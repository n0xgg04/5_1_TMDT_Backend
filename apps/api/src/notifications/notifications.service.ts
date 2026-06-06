import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MessageEvent } from "@nestjs/common";
import { Resend } from "resend";
import { Observable, Subject } from "rxjs";
import { finalize } from "rxjs/operators";
import { PrismaService } from "../common/prisma/prisma.service";

export type NotificationType =
  | "booking.request.approved"
  | "booking.request.rejected"
  | "booking.approval.expired"
  | "booking.payment.expired"
  | "booking.confirmed"
  | "booking.cancelled"
  | "booking.expired"
  | "checkout.completed";

export interface NotificationPayload {
  type: NotificationType;
  bookingId: string;
  customerId?: string;
  reason?: string;
  finalAmount?: number;
  paymentDeadline?: Date | string;
  [key: string]: unknown;
}

interface EmailTemplate {
  subject: (data: TemplateData) => string;
  html: (data: TemplateData) => string;
}

interface TemplateData {
  customerName: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  reason?: string;
  finalAmount?: string;
  paymentDeadline?: string;
  bookingId?: string;
  type?: string;
}

const TEMPLATES: Record<NotificationType, EmailTemplate> = {
  "booking.request.approved": {
    subject: (d) => `Yêu cầu đặt phòng đã được duyệt - ${d.bookingCode}`,
    html: (d) => `
      <h2>Yêu cầu đặt phòng đã được duyệt</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn <strong>${d.bookingCode}</strong> đã được duyệt. Vui lòng thanh toán trước <strong>${d.paymentDeadline ?? "thời hạn được thông báo"}</strong> để giữ chỗ.</p>
    `,
  },
  "booking.request.rejected": {
    subject: (d) => `Yêu cầu đặt phòng bị từ chối - ${d.bookingCode}`,
    html: (d) => `
      <h2>Yêu cầu đặt phòng bị từ chối</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn <strong>${d.bookingCode}</strong> đã bị từ chối.</p>
      <p>Lý do: ${d.reason ?? "—"}</p>
    `,
  },
  "booking.approval.expired": {
    subject: (d) => `Yêu cầu đặt phòng đã hết hạn duyệt - ${d.bookingCode}`,
    html: (d) => `
      <h2>Yêu cầu đặt phòng đã hết hạn</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn <strong>${d.bookingCode}</strong> đã quá 24 giờ chưa được duyệt và bị hủy tự động.</p>
    `,
  },
  "booking.payment.expired": {
    subject: (d) => `Đơn đặt phòng đã hết hạn thanh toán - ${d.bookingCode}`,
    html: (d) => `
      <h2>Đơn đặt phòng đã hết hạn thanh toán</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn <strong>${d.bookingCode}</strong> đã được duyệt nhưng không thanh toán đúng hạn nên đã hết hạn.</p>
    `,
  },
  "booking.confirmed": {
    subject: (d) => `Xác nhận đặt phòng thành công - ${d.bookingCode}`,
    html: (d) => `
      <h2>Xác nhận đặt phòng</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn đặt phòng <strong>${d.bookingCode}</strong> của bạn đã được xác nhận.</p>
      <ul>
        <li>Check-in: ${d.checkIn}</li>
        <li>Check-out: ${d.checkOut}</li>
        <li>Tổng tiền: ${d.totalAmount} VNĐ</li>
      </ul>
    `,
  },
  "checkout.completed": {
    subject: (d) => `Hóa đơn trả phòng - ${d.bookingCode}`,
    html: (d) => `
      <h2>Cảm ơn bạn đã sử dụng dịch vụ</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Bạn đã trả phòng thành công. Tổng hóa đơn: <strong>${d.finalAmount ?? d.totalAmount} VNĐ</strong></p>
    `,
  },
  "booking.cancelled": {
    subject: (d) => `Thông báo hủy đặt phòng - ${d.bookingCode}`,
    html: (d) => `
      <h2>Đơn đặt phòng đã bị hủy</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn đặt phòng <strong>${d.bookingCode}</strong> đã bị hủy.</p>
      <p>Lý do: ${d.reason ?? "—"}</p>
    `,
  },
  "booking.expired": {
    subject: (d) => `Đơn đặt phòng đã hết hạn - ${d.bookingCode}`,
    html: (d) => `
      <h2>Đơn đặt phòng đã hết hạn</h2>
      <p>Kính gửi ${d.customerName},</p>
      <p>Đơn <strong>${d.bookingCode}</strong> đã hết hạn thanh toán và bị hủy tự động.</p>
    `,
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly streams = new Map<string, Set<Subject<MessageEvent>>>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    this.fromAddress = this.config.get<string>(
      "EMAIL_FROM",
      "Sapphire Stay <onboarding@resend.dev>",
    );
    this.resend = apiKey ? new Resend(apiKey) : null;
    if (!this.resend) {
      this.logger.warn(
        "RESEND_API_KEY not set — notifications will be persisted but emails skipped",
      );
    }
  }

  /**
   * Sends a notification email and records it in the notifications table.
   * Failures never throw — they're logged and persisted so the calling
   * business transaction is not rolled back.
   */
  async send(payload: NotificationPayload): Promise<void> {
    const template = TEMPLATES[payload.type];
    if (!template) {
      this.logger.warn(`Unknown notification type: ${payload.type}`);
      return;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: { customer: true },
    });
    if (!booking) {
      this.logger.warn(
        `Booking ${payload.bookingId} not found for notification`,
      );
      return;
    }

    const data: TemplateData = {
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      bookingCode: booking.bookingCode,
      checkIn: booking.checkIn.toLocaleDateString("vi-VN"),
      checkOut: booking.checkOut.toLocaleDateString("vi-VN"),
      totalAmount: Number(booking.totalAmount).toLocaleString("vi-VN"),
      finalAmount: payload.finalAmount?.toLocaleString("vi-VN"),
      paymentDeadline: payload.paymentDeadline
        ? new Date(payload.paymentDeadline).toLocaleString("vi-VN")
        : booking.paymentDeadline?.toLocaleString("vi-VN"),
      reason: payload.reason,
      bookingId: booking.id,
      type: payload.type,
    };

    const recipient = booking.customer.email;
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: booking.customerId,
        email: recipient,
        type: payload.type,
        templateData: {
          ...data,
          bookingId: booking.id,
          paymentDeadline: booking.paymentDeadline?.toISOString() ?? null,
          reason: payload.reason ?? null,
        } as object,
      },
    });

    this.publishToStreams(booking.customerId, notification);

    if (!this.resend) {
      this.logger.log(
        `[skip] Email ${payload.type} → ${recipient} (no RESEND_API_KEY)`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: recipient,
        subject: template.subject(data),
        html: template.html(data),
      });

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { sentAt: new Date(), failed: false },
      });
      this.logger.log(`Email ${payload.type} → ${recipient}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send ${payload.type} to ${recipient}: ${reason}`,
      );
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          failed: true,
          failReason: reason,
          retries: { increment: 1 },
        },
      });
    }
  }

  listMine(userId: string, page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      skip: (Math.max(page, 1) - 1) * safeLimit,
      take: safeLimit,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });
    if (!notification) return null;
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: notification.readAt ?? new Date() },
    });
  }

  streamForUser(userId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    const set = this.streams.get(userId) ?? new Set<Subject<MessageEvent>>();
    set.add(subject);
    this.streams.set(userId, set);

    return subject.asObservable().pipe(
      finalize(() => {
        set.delete(subject);
        if (set.size === 0) this.streams.delete(userId);
      }),
    );
  }

  private publishToStreams(userId: string, notification: object) {
    const streams = this.streams.get(userId);
    if (!streams?.size) return;
    for (const stream of streams) {
      stream.next({ type: "notification", data: notification });
    }
  }
}
