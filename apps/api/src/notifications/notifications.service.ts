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
  customerEmail: string;
  customerPhone: string;
  bookingCode: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  roomName: string;
  roomNumber: string;
  bedType: string;
  adults: number;
  children: number;
  nights: number;
  reason?: string;
  finalAmount?: string;
  paymentDeadline?: string;
  bookingId?: string;
  type?: string;
  detailUrl?: string;
}

const wrapper = (title: string, badge: string, badgeColor: string, content: string, detailUrl: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;padding:20px;">
    <div style="background:${badgeColor};padding:20px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Sapphire Stay</h1>
      <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:14px;">${badge}</p>
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
      ${content}
      <div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
        <a href="${detailUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
          Xem chi tiết đơn đặt phòng
        </a>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">
        © 2026 Sapphire Stay. Vui lòng không trả lời email tự động này.
      </p>
    </div>
  </div>
</body>
</html>`;

const infoTable = (data: TemplateData, showAmount = true) => `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr style="background:#f8fafc;">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;width:130px;">Mã đơn</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;">${data.bookingCode}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">Phòng</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${data.roomName} (#${data.roomNumber})</td>
    </tr>
    <tr style="background:#f8fafc;">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">Loại giường</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${data.bedType}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">Nhận phòng</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${data.checkIn}</td>
    </tr>
    <tr style="background:#f8fafc;">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">Trả phòng</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${data.checkOut} (${data.nights} đêm)</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">Khách</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${data.adults} người lớn${data.children ? `, ${data.children} trẻ em` : ""}</td>
    </tr>
    ${showAmount ? `
    <tr style="background:#ecfdf5;">
      <td style="padding:8px 12px;font-weight:600;color:#059669;">Tổng tiền</td>
      <td style="padding:8px 12px;font-weight:700;color:#059669;font-size:16px;">${data.totalAmount} VNĐ</td>
    </tr>` : ""}
  </table>`;

const TEMPLATES: Record<NotificationType, EmailTemplate> = {
  "booking.request.approved": {
    subject: (d) => `[Sapphire Stay] Yêu cầu đặt phòng đã được duyệt - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Yêu cầu đã được duyệt",
      "Đã duyệt - Vui lòng thanh toán",
      "#1e293b",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Yêu cầu đặt phòng <strong>${d.bookingCode}</strong> của bạn đã được duyệt.</p>
        ${infoTable(d)}
        <p style="background:#fef3c7;padding:12px;border-radius:6px;color:#92400e;">
          ⏰ Vui lòng thanh toán trước <strong>${d.paymentDeadline ?? "thời hạn được thông báo"}</strong> để giữ chỗ.
        </p>
        <p style="color:#64748b;font-size:13px;">Bạn có thể thanh toán bằng chuyển khoản ngân hàng (quét mã QR) tại trang chi tiết đơn.</p>
      `,
      d.detailUrl ?? "",
    ),
  },
  "booking.request.rejected": {
    subject: (d) => `[Sapphire Stay] Yêu cầu đặt phòng bị từ chối - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Yêu cầu bị từ chối",
      "Đã từ chối",
      "#dc2626",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Đơn <strong>${d.bookingCode}</strong> — ${d.roomName} (#${d.roomNumber}) — đã bị từ chối.</p>
        ${d.reason ? `<p style="background:#fef2f2;padding:12px;border-radius:6px;color:#991b1b;"><strong>Lý do:</strong> ${d.reason}</p>` : ""}
      `,
      d.detailUrl ?? "",
    ),
  },
  "booking.approval.expired": {
    subject: (d) => `[Sapphire Stay] Yêu cầu đặt phòng đã hết hạn duyệt - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Đã hết hạn duyệt",
      "Hết hạn",
      "#1e293b",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Đơn <strong>${d.bookingCode}</strong> đã quá 24 giờ chưa được duyệt và bị hủy tự động.</p>
      `,
      d.detailUrl ?? "",
    ),
  },
  "booking.payment.expired": {
    subject: (d) => `[Sapphire Stay] Đơn đặt phòng đã hết hạn thanh toán - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Đã hết hạn thanh toán",
      "Hết hạn",
      "#1e293b",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Đơn <strong>${d.bookingCode}</strong> đã được duyệt nhưng không thanh toán đúng hạn nên đã hết hạn.</p>
      `,
      d.detailUrl ?? "",
    ),
  },
  "booking.confirmed": {
    subject: (d) => `[Sapphire Stay] Xác nhận đặt phòng thành công - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Đặt phòng thành công!",
      "Đã thanh toán",
      "#059669",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Đơn đặt phòng <strong>${d.bookingCode}</strong> đã được xác nhận và thanh toán thành công.</p>
        ${infoTable(d)}
        <p style="background:#d1fae5;padding:12px;border-radius:6px;color:#065f46;">
          ✅ Phòng đã được giữ cho lịch lưu trú của bạn. Vui lòng đến quầy lễ tân để làm thủ tục check-in vào ngày ${d.checkIn}.
        </p>
      `,
      d.detailUrl ?? "",
    ),
  },
  "checkout.completed": {
    subject: (d) => `[Sapphire Stay] Hóa đơn trả phòng - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Trả phòng thành công",
      "Cảm ơn bạn",
      "#1e293b",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Bạn đã trả phòng thành công.</p>
        ${infoTable(d)}
        <p style="background:#d1fae5;padding:12px;border-radius:6px;color:#065f46;">
          Tổng hóa đơn: <strong>${d.finalAmount ?? d.totalAmount} VNĐ</strong>
        </p>
      `,
      d.detailUrl ?? "",
    ),
  },
  "booking.cancelled": {
    subject: (d) => `[Sapphire Stay] Thông báo hủy đặt phòng - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Đơn đã bị hủy",
      "Đã hủy",
      "#dc2626",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Đơn đặt phòng <strong>${d.bookingCode}</strong> — ${d.roomName} (#${d.roomNumber}) — đã bị hủy.</p>
        ${d.reason ? `<p style="background:#fef2f2;padding:12px;border-radius:6px;color:#991b1b;"><strong>Lý do:</strong> ${d.reason}</p>` : ""}
        <p style="color:#64748b;font-size:13px;">Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi.</p>
      `,
      d.detailUrl ?? "",
    ),
  },
  "booking.expired": {
    subject: (d) => `[Sapphire Stay] Đơn đặt phòng đã hết hạn - ${d.bookingCode}`,
    html: (d) => wrapper(
      "Đơn đã hết hạn",
      "Hết hạn",
      "#1e293b",
      `
        <p>Kính gửi <strong>${d.customerName}</strong>,</p>
        <p>Đơn <strong>${d.bookingCode}</strong> — ${d.roomName} (#${d.roomNumber}) — đã hết hạn và bị hủy tự động.</p>
      `,
      d.detailUrl ?? "",
    ),
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
      include: {
        customer: true,
        room: { include: { roomType: true } },
      },
    });
    if (!booking) {
      this.logger.warn(
        `Booking ${payload.bookingId} not found for notification`,
      );
      return;
    }

    const nights = Math.max(
      1,
      Math.round(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const appUrl = this.config.get<string>("APP_URL", "http://localhost:3001");
    const detailUrl = `${appUrl}/my-bookings/${booking.id}`;

    const data: TemplateData = {
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      customerEmail: booking.customer.email,
      customerPhone: booking.customer.phone ?? "—",
      bookingCode: booking.bookingCode,
      checkIn: booking.checkIn.toLocaleDateString("vi-VN"),
      checkOut: booking.checkOut.toLocaleDateString("vi-VN"),
      totalAmount: Number(booking.totalAmount).toLocaleString("vi-VN"),
      roomName: booking.room?.roomType?.name ?? "—",
      roomNumber: booking.room?.roomNumber ?? "—",
      bedType: booking.room?.roomType?.bedType ?? "—",
      adults: booking.adults,
      children: booking.children,
      nights,
      finalAmount: payload.finalAmount?.toLocaleString("vi-VN"),
      paymentDeadline: payload.paymentDeadline
        ? new Date(payload.paymentDeadline).toLocaleString("vi-VN")
        : booking.paymentDeadline?.toLocaleString("vi-VN"),
      reason: payload.reason,
      bookingId: booking.id,
      type: payload.type,
      detailUrl,
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
        headers: { "Content-Type": "text/html; charset=UTF-8" },
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
