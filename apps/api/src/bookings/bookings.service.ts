import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { EventsService } from "../common/events/events.service";
import { PricingService } from "../rooms/pricing.service";
import { CouponsService } from "../coupons/coupons.service";
import { FlashSalesService } from "../flash-sales/flash-sales.service";
import { AvailabilityService } from "../availability/availability.service";
import { BillsService } from "../bills/bills.service";
import {
  CreateBookingDto,
  UploadReceiptDto,
  ApproveBookingDto,
  RejectBookingDto,
} from "./dto/bookings.dto";
import { BookingStatus, Role, PaymentStatus } from "@prisma/client";

const APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;
const PAYMENT_TTL_MS = 30 * 60 * 1000;
const MAX_PAYMENT_TTL_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly events: EventsService,
    private readonly pricingService: PricingService,
    private readonly couponsService: CouponsService,
    private readonly flashSalesService: FlashSalesService,
    private readonly availability: AvailabilityService,
    private readonly billsService: BillsService,
  ) {}

  async createBooking(customerId: string, dto: CreateBookingDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkOut <= checkIn) {
      throw new BadRequestException("Ngày trả phòng phải sau ngày nhận phòng");
    }

    const lockKey = `booking:lock:${dto.roomId}:${dto.checkIn}:${dto.checkOut}`;
    const acquired = await this.redis.setNx(lockKey, customerId, 10000);
    if (!acquired) {
      throw new ConflictException(
        "Phòng này đang được đặt bởi người khác, vui lòng thử lại",
      );
    }

    try {
      const room = await this.prisma.room.findUnique({
        where: { id: dto.roomId },
        include: { roomType: true },
      });
      if (!room) throw new NotFoundException("Phòng không tồn tại");
      if (!room.roomType.isActive)
        throw new BadRequestException("Loại phòng không còn hoạt động");

      const conflict = await this.availability.findActiveOverlap(
        dto.roomId,
        checkIn,
        checkOut,
      );
      if (conflict)
        throw new ConflictException(
          "Phòng đã được đặt trong khoảng thời gian này",
        );

      let totalAmount = await this.pricingService.calculateTotalPrice(
        room.roomTypeId,
        checkIn,
        checkOut,
      );

      const flashSaleResult =
        await this.flashSalesService.calculateFlashSalePrice(
          room.roomTypeId,
          Number(totalAmount),
        );
      if (flashSaleResult.flashSaleId) {
        totalAmount = flashSaleResult.price as any;
      }

      const approvalDeadline = new Date(Date.now() + APPROVAL_TTL_MS);

      const booking = await this.prisma.booking.create({
        data: {
          customerId,
          roomId: dto.roomId,
          checkIn,
          checkOut,
          checkInTime: dto.checkInTime ?? "14:00",
          checkOutTime: dto.checkOutTime ?? "12:00",
          adults: dto.adults ?? 2,
          children: dto.children ?? 0,
          totalAmount,
          approvalDeadline,
          paymentDeadline: null,
          guestNotes: dto.guestNotes,
          specialRequests: dto.specialRequests,
          status: BookingStatus.PENDING_HOST_APPROVAL,
        },
        include: { room: { include: { roomType: true } } },
      });

      await this.publishOutbox("booking.request.created", {
        bookingId: booking.id,
        customerId,
        roomId: dto.roomId,
        totalAmount,
        approvalDeadline,
      });

      return booking;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async getAllBookings(
    page = 1,
    limit = 10,
    status?: BookingStatus,
    from?: string,
    to?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    if (search) {
      where.OR = [
        { bookingCode: { contains: search, mode: "insensitive" } },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          room: { include: { roomType: true } },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          addons: true,
          payment: true,
          review: true,
          approvedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { data: items, total, page, limit };
  }

  async getMyBookings(
    customerId: string,
    page = 1,
    limit = 10,
    status?: BookingStatus,
  ) {
    const skip = (page - 1) * limit;
    const where: any = { customerId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          room: { include: { roomType: true } },
          addons: true,
          payment: true,
          review: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return { data: items, total, page, limit };
  }

  async getBookingById(id: string, user: { id: string; role: Role }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        room: { include: { roomType: true } },
        addons: true,
        payment: true,
        review: true,
      },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");

    const canView =
      booking.customerId === user.id ||
      user.role === Role.ADMIN ||
      user.role === Role.RECEPTIONIST;
    if (!canView) throw new ForbiddenException("Không có quyền xem đơn này");

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");
    if (booking.customerId !== userId)
      throw new ForbiddenException("Không có quyền hủy đơn này");

    const cancellable: BookingStatus[] = [
      BookingStatus.PENDING_HOST_APPROVAL,
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.PAYING,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellable.includes(booking.status)) {
      throw new BadRequestException("Không thể hủy đơn ở trạng thái này");
    }

    await this.couponsService.releaseReservationForBooking(booking);

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await this.billsService.syncBillStatusByBooking(bookingId, "CANCELLED");

    await this.events.emit("booking.cancelled", {
      bookingId,
      customerId: userId,
      reason: reason ?? "Customer cancelled",
    });

    return updated;
  }

  async confirmBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");

    if (
      booking.status !== BookingStatus.PAYING
    ) {
      return booking;
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      }),
      this.prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "RESERVED" },
      }),
    ]);

    await this.events.emit("booking.confirmed", {
      bookingId,
      customerId: booking.customerId,
    });

    return updated;
  }

  async expireBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) return;

    if (booking.status === BookingStatus.PENDING_HOST_APPROVAL) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.EXPIRED },
      });

      await this.events.emit("booking.approval.expired", {
        bookingId,
        customerId: booking.customerId,
      });
      return;
    }

    if (
      booking.status !== BookingStatus.PENDING_PAYMENT &&
      booking.status !== BookingStatus.PAYING
    ) {
      return;
    }

    await this.couponsService.releaseReservationForBooking(booking);

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.EXPIRED },
    });

    await this.billsService.syncBillStatusByBooking(bookingId, "EXPIRED");

    await this.events.emit("booking.payment.expired", {
      bookingId,
      customerId: booking.customerId,
    });
  }

  async handlePaymentFailed(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) return;

    await this.couponsService.releaseReservationForBooking(booking);

    if (
      booking.status !== BookingStatus.PENDING_PAYMENT &&
      booking.status !== BookingStatus.PAYING
    ) {
      return;
    }

    if (booking.paymentDeadline && new Date() > booking.paymentDeadline) {
      await this.expireBooking(bookingId);
      return;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PENDING_PAYMENT },
    });
  }

  async checkin(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        "Đơn phải ở trạng thái CONFIRMED để check-in",
      );
    }

    const [updatedBooking] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CHECKED_IN, checkInActual: new Date() },
      }),
      this.prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "OCCUPIED" },
      }),
    ]);

    return updatedBooking;
  }

  async checkout(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true, addons: true },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");
    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException("Khách chưa check-in");
    }

    const addonTotal = booking.addons.reduce(
      (sum, a) => sum + Number(a.totalPrice),
      0,
    );
    const finalAmount = Number(booking.totalAmount) + addonTotal;

    const [updatedBooking] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CHECKED_OUT,
          checkOutActual: new Date(),
          totalAmount: finalAmount,
        },
      }),
      this.prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "DIRTY" },
      }),
    ]);

    await this.events.emit("checkout.completed", {
      bookingId,
      customerId: booking.customerId,
      finalAmount,
    });

    return updatedBooking;
  }

  async getExpiredBookings() {
    return this.prisma.booking.findMany({
      where: {
        OR: [
          {
            status: BookingStatus.PENDING_HOST_APPROVAL,
            approvalDeadline: { lt: new Date() },
          },
          {
            status: {
              in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PAYING],
            },
            paymentDeadline: { lt: new Date() },
          },
        ],
      },
    });
  }

  async uploadReceipt(
    bookingId: string,
    customerId: string,
    dto: UploadReceiptDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");
    if (booking.customerId !== customerId) {
      throw new ForbiddenException("Không có quyền thao tác");
    }
    if (booking.status === BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Đơn chưa được duyệt để thanh toán");
    }
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Đơn không ở trạng thái chờ thanh toán");
    }

    await this.prisma.$transaction([
      this.prisma.payment.updateMany({
        where: { bookingId },
        data: {
          receiptImageUrl: dto.receiptImageUrl,
          status: PaymentStatus.PENDING,
        },
      }),
      this.prisma.bookingAttachment.create({
        data: { bookingId, type: "receipt", fileUrl: dto.receiptImageUrl },
      }),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PENDING_APPROVAL },
      }),
    ]);

    return { message: "Đã upload biên lai, chờ staff xác nhận" };
  }

  async getApprovalRequests(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { status: BookingStatus.PENDING_HOST_APPROVAL };
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          room: { include: { roomType: true, branch: true } },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.booking.count({ where }),
    ]);

    const bookingIds = items.map((b) => b.id);
    const conversations = await this.prisma.conversation.findMany({
      where: { bookingId: { in: bookingIds } },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const conversationByBooking = new Map(
      conversations.map((c) => [c.bookingId, c]),
    );

    const decorated = await Promise.all(
      items.map(async (booking) => ({
        ...booking,
        conversation: conversationByBooking.get(booking.id) ?? null,
        hasActiveOverlap: Boolean(
          await this.availability.findActiveOverlap(
            booking.roomId,
            booking.checkIn,
            booking.checkOut,
            booking.id,
          ),
        ),
      })),
    );

    return { items: decorated, data: decorated, total, page, limit };
  }

  async getPendingBookings(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { status: BookingStatus.PENDING_APPROVAL },
        skip,
        take: limit,
        include: {
          room: { include: { roomType: true } },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          payment: true,
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING_APPROVAL },
      }),
    ]);
    return { items, data: items, total, page, limit };
  }

  async approveRequest(bookingId: string, staffId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");
    if (booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Đơn không ở trạng thái chờ duyệt yêu cầu");
    }
    if (booking.approvalDeadline && new Date() > booking.approvalDeadline) {
      throw new BadRequestException("Yêu cầu đặt phòng đã hết hạn duyệt");
    }

    const conflict = await this.availability.findActiveOverlap(
      booking.roomId,
      booking.checkIn,
      booking.checkOut,
      bookingId,
    );
    if (conflict) {
      throw new ConflictException("Phòng đã được đặt trong khoảng thời gian này");
    }

    const now = new Date();
    const paymentDeadline = new Date(
      now.getTime() + Math.min(PAYMENT_TTL_MS, MAX_PAYMENT_TTL_MS),
    );
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PENDING_PAYMENT,
        approvedById: staffId,
        approvedAt: now,
        paymentDeadline,
      },
    });

    await this.events.emit("booking.request.approved", {
      bookingId,
      staffId,
      customerId: booking.customerId,
      paymentDeadline,
    });

    // Tạo bill cho thanh toán chuyển khoản (fire-and-forget, không block flow)
    this.billsService.createBill(bookingId).catch(() => {
      // Bill creation failure should not block the approval flow
    });

    return updated;
  }

  async rejectRequest(
    bookingId: string,
    staffId: string,
    dto: RejectBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");
    if (booking.status !== BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Đơn không ở trạng thái chờ duyệt yêu cầu");
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        approvedById: staffId,
        rejectedReason: dto.reason,
      },
    });

    await this.events.emit("booking.request.rejected", {
      bookingId,
      staffId,
      customerId: booking.customerId,
      reason: dto.reason,
    });

    return updated;
  }

  async approveBooking(
    bookingId: string,
    staffId: string,
    _dto?: ApproveBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");
    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Đơn không ở trạng thái chờ duyệt");
    }

    const conflict = await this.prisma.booking.findFirst({
      where: {
        roomId: booking.roomId,
        id: { not: bookingId },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        AND: [
          { checkIn: { lt: booking.checkOut } },
          { checkOut: { gt: booking.checkIn } },
        ],
      },
    });
    if (conflict) {
      throw new ConflictException("Phòng đã có đơn confirmed trong khoảng này");
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          approvedById: staffId,
          approvedAt: new Date(),
        },
      }),
      this.prisma.payment.updateMany({
        where: { bookingId },
        data: { status: PaymentStatus.COMPLETED, paidAt: new Date() },
      }),
      this.prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "RESERVED" },
      }),
    ]);

    await this.events.emit("booking.confirmed", {
      bookingId,
      staffId,
      customerId: booking.customerId,
    });

    return updated;
  }

  async rejectBooking(
    bookingId: string,
    staffId: string,
    dto: RejectBookingDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) throw new NotFoundException("Đơn không tồn tại");
    if (booking.status !== BookingStatus.PENDING_APPROVAL) {
      throw new BadRequestException("Đơn không ở trạng thái chờ duyệt");
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
        approvedById: staffId,
        rejectedReason: dto.reason,
      },
    });

    await this.couponsService.releaseReservationForBooking(booking);

    if (booking.payment?.status === PaymentStatus.COMPLETED) {
      await this.prisma.payment.update({
        where: { bookingId },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
      });
    }

    await this.events.emit("booking.rejected", {
      bookingId,
      staffId,
      reason: dto.reason,
    });

    return { message: "Đã từ chối booking" };
  }

  /**
   * Persists the event into the outbox table for durability/audit, then
   * dispatches it through the in-process bus. Historical calls used
   * RabbitMQ exchanges; we keep the same table so we can replay later.
   */
  private async publishOutbox(
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.outboxEvent.create({
      data: {
        aggregateId: (payload.bookingId as string) ?? "unknown",
        eventType,
        exchange: "hotel.events",
        routingKey: eventType,
        payload: payload as object,
      },
    });
    await this.events.emit(eventType as never, payload);
  }

}
