import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus, RoomStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";

export type AvailabilityDayStatus = "available" | "held" | "booked";

export interface AvailabilityConflict {
  checkIn: string;
  checkOut: string;
  status: AvailabilityDayStatus;
}

export interface RangeAvailabilityResult {
  available: boolean;
  from: string;
  to: string;
  conflicts: AvailabilityConflict[];
}

const MAX_CALENDAR_DAYS = 90;
const HELD_STATUSES = new Set<BookingStatus>([
  BookingStatus.PENDING_HOST_APPROVAL,
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PAYING,
  BookingStatus.PENDING_APPROVAL,
]);

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  parseDateRange(from: string, to: string, maxDays = MAX_CALENDAR_DAYS) {
    const start = this.parseDate(from);
    const end = this.parseDate(to);
    if (end <= start) {
      throw new BadRequestException("Ngày trả phòng phải sau ngày nhận phòng");
    }
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (days > maxDays) {
      throw new BadRequestException(`Khoảng ngày không được vượt quá ${maxDays} ngày`);
    }
    return { start, end, days };
  }

  parseCalendarRange(from: string, to: string, maxDays = MAX_CALENDAR_DAYS) {
    const start = this.parseDate(from);
    const inclusiveEnd = this.parseDate(to);
    if (inclusiveEnd < start) {
      throw new BadRequestException("Ngày trả phòng phải sau ngày nhận phòng");
    }
    const endExclusive = this.addDays(inclusiveEnd, 1);
    const days = Math.ceil(
      (endExclusive.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (days > maxDays) {
      throw new BadRequestException(`Khoảng ngày không được vượt quá ${maxDays} ngày`);
    }
    return { start, inclusiveEnd, endExclusive, days };
  }

  activeBookingWhere(now = new Date()) {
    return {
      OR: [
        {
          status: BookingStatus.PENDING_HOST_APPROVAL,
          approvalDeadline: { gt: now },
        },
        {
          status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PAYING] },
          paymentDeadline: { gt: now },
        },
        {
          status: {
            in: [
              BookingStatus.PENDING_APPROVAL,
              BookingStatus.CONFIRMED,
              BookingStatus.CHECKED_IN,
            ],
          },
        },
      ],
    };
  }

  overlapWhere(checkIn: Date, checkOut: Date) {
    return {
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    };
  }

  async findActiveOverlap(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ) {
    return this.prisma.booking.findFirst({
      where: {
        roomId,
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
        ...this.overlapWhere(checkIn, checkOut),
        ...this.activeBookingWhere(),
      },
    });
  }

  async getBookedRoomIds(checkIn: Date, checkOut: Date): Promise<string[]> {
    const conflicting = await this.prisma.booking.findMany({
      where: {
        ...this.overlapWhere(checkIn, checkOut),
        ...this.activeBookingWhere(),
      },
      select: { roomId: true },
    });
    return conflicting.map((b) => b.roomId);
  }

  async checkRoomRange(
    roomId: string,
    from: string,
    to: string,
  ): Promise<RangeAvailabilityResult> {
    const { start, end } = this.parseDateRange(from, to);
    const conflicts = await this.getPublicConflicts(roomId, start, end);
    return {
      available: conflicts.length === 0,
      from: this.toISODate(start),
      to: this.toISODate(end),
      conflicts,
    };
  }

  async getRoomCalendar(roomId: string, from: string, to: string) {
    const { start, inclusiveEnd, endExclusive } = this.parseCalendarRange(
      from,
      to,
    );
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, status: true },
    });
    if (!room) throw new NotFoundException("Phòng không tồn tại");

    const bookings = await this.getActiveBookingsForRooms(
      [roomId],
      start,
      endExclusive,
    );
    const days = this.daysBetweenInclusive(start, inclusiveEnd).map((date) => {
      const status = this.getRoomDayStatus(room.status, date, bookings);
      return {
        date: this.toISODate(date),
        status,
        available: status === "available",
      };
    });

    return { roomId, from: this.toISODate(start), to: this.toISODate(inclusiveEnd), days };
  }

  async getRoomTypeCalendar(roomTypeId: string, from: string, to: string) {
    const { start, inclusiveEnd, endExclusive } = this.parseCalendarRange(
      from,
      to,
    );
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
      select: { id: true, isActive: true },
    });
    if (!roomType || !roomType.isActive) {
      throw new NotFoundException("Loại phòng không tồn tại");
    }

    const rooms = await this.prisma.room.findMany({
      where: { roomTypeId },
      select: { id: true, status: true },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    });
    const bookings = await this.getActiveBookingsForRooms(
      rooms.map((r) => r.id),
      start,
      endExclusive,
    );

    const days = this.daysBetweenInclusive(start, inclusiveEnd).map((date) => {
      let availableRooms = 0;
      let heldRooms = 0;
      let bookedRooms = 0;
      for (const room of rooms) {
        const status = this.getRoomDayStatus(room.status, date, bookings, room.id);
        if (status === "available") availableRooms += 1;
        if (status === "held") heldRooms += 1;
        if (status === "booked") bookedRooms += 1;
      }
      return {
        date: this.toISODate(date),
        status: availableRooms > 0 ? "available" : "booked",
        totalRooms: rooms.length,
        availableRooms,
        heldRooms,
        bookedRooms,
      };
    });

    return {
      roomTypeId,
      from: this.toISODate(start),
      to: this.toISODate(inclusiveEnd),
      days,
    };
  }

  async getStaffCalendar(params: {
    from: string;
    to: string;
    roomTypeId?: string;
    floor?: number;
  }) {
    const { start, inclusiveEnd, endExclusive } = this.parseCalendarRange(
      params.from,
      params.to,
    );
    const rooms = await this.prisma.room.findMany({
      where: {
        ...(params.roomTypeId ? { roomTypeId: params.roomTypeId } : {}),
        ...(params.floor !== undefined ? { floor: params.floor } : {}),
      },
      include: {
        roomType: { select: { id: true, name: true, maxGuests: true } },
        branch: { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        ...this.overlapWhere(start, endExclusive),
        ...this.activeBookingWhere(),
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            roomType: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ checkIn: "asc" }, { createdAt: "asc" }],
    });

    const bookingsByRoom = new Map<string, typeof bookings>();
    for (const booking of bookings) {
      const list = bookingsByRoom.get(booking.roomId) ?? [];
      list.push(booking);
      bookingsByRoom.set(booking.roomId, list);
    }

    return {
      from: this.toISODate(start),
      to: this.toISODate(inclusiveEnd),
      days: this.daysBetweenInclusive(start, inclusiveEnd).map((d) =>
        this.toISODate(d),
      ),
      rooms: rooms.map((room) => ({
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: room.status,
        roomType: room.roomType,
        branch: room.branch,
        bookings: (bookingsByRoom.get(room.id) ?? []).map((booking) => ({
          id: booking.id,
          bookingCode: booking.bookingCode,
          status: booking.status,
          checkIn: this.toISODate(booking.checkIn),
          checkOut: this.toISODate(booking.checkOut),
          action: this.staffActionForStatus(booking.status, booking.id),
          customer: booking.customer,
          room: booking.room,
        })),
      })),
    };
  }

  private async getPublicConflicts(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<AvailabilityConflict[]> {
    const bookings = await this.getActiveBookingsForRooms(
      [roomId],
      checkIn,
      checkOut,
    );
    return bookings.map((booking) => ({
      checkIn: this.toISODate(booking.checkIn),
      checkOut: this.toISODate(booking.checkOut),
      status: this.bookingAvailabilityStatus(booking.status),
    }));
  }

  private getActiveBookingsForRooms(
    roomIds: string[],
    checkIn: Date,
    checkOut: Date,
  ): Promise<
    Array<{
      id: string;
      roomId: string;
      checkIn: Date;
      checkOut: Date;
      status: BookingStatus;
    }>
  > {
    if (roomIds.length === 0) return Promise.resolve([]);
    return this.prisma.booking.findMany({
      where: {
        roomId: { in: roomIds },
        ...this.overlapWhere(checkIn, checkOut),
        ...this.activeBookingWhere(),
      },
      select: {
        id: true,
        roomId: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
      orderBy: [{ checkIn: "asc" }, { createdAt: "asc" }],
    });
  }

  private getRoomDayStatus(
    roomStatus: RoomStatus,
    date: Date,
    bookings: Array<{
      roomId: string;
      checkIn: Date;
      checkOut: Date;
      status: BookingStatus;
    }>,
    roomId?: string,
  ): AvailabilityDayStatus {
    if (roomStatus !== RoomStatus.AVAILABLE && roomStatus !== RoomStatus.DIRTY) {
      return "booked";
    }
    const dayEnd = this.addDays(date, 1);
    const conflict = bookings.find(
      (booking) =>
        (!roomId || booking.roomId === roomId) &&
        booking.checkIn < dayEnd &&
        booking.checkOut > date,
    );
    if (!conflict) return "available";
    return this.bookingAvailabilityStatus(conflict.status);
  }

  private bookingAvailabilityStatus(status: BookingStatus): AvailabilityDayStatus {
    return HELD_STATUSES.has(status) ? "held" : "booked";
  }

  private staffActionForStatus(status: BookingStatus, bookingId: string) {
    if (status === BookingStatus.PENDING_HOST_APPROVAL) {
      return {
        type: "approval-request",
        href: "/staff/pending-bookings",
      };
    }
    if (status === BookingStatus.PENDING_APPROVAL) {
      return {
        type: "receipt-approval",
        href: "/staff/receipt-approvals",
      };
    }
    return {
      type: "booking-detail",
      href: `/my-bookings/${bookingId}`,
    };
  }

  private parseDate(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Ngày không hợp lệ");
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private daysBetweenInclusive(start: Date, end: Date) {
    const days: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private toISODate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
