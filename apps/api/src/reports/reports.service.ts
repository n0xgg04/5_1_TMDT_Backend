import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { PaymentStatus, BookingStatus } from "@prisma/client";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRevenueReport(
    from: string,
    to: string,
    groupBy: "day" | "week" | "month" = "day",
  ) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.COMPLETED,
        paidAt: { gte: fromDate, lte: toDate },
      },
      include: {
        booking: {
          include: { room: { include: { roomType: true } } },
        },
      },
      orderBy: { paidAt: "asc" },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalBookings = payments.length;

    const byRoomType: Record<string, { count: number; revenue: number }> = {};
    for (const p of payments) {
      const typeName = p.booking.room.roomType.name;
      if (!byRoomType[typeName])
        byRoomType[typeName] = { count: 0, revenue: 0 };
      byRoomType[typeName].count++;
      byRoomType[typeName].revenue += Number(p.amount);
    }

    const daily: Record<string, number> = {};
    for (const p of payments) {
      const d = new Date(p.paidAt!);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      daily[key] = (daily[key] || 0) + Number(p.amount);
    }

    const data = Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    return {
      from,
      to,
      total: totalRevenue,
      totalRevenue,
      totalBookings,
      byRoomType,
      data,
    };
  }

  async getOccupancyReport(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const totalRooms = await this.prisma.room.count();

    const checkedIn = await this.prisma.booking.count({
      where: {
        status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkIn: { gte: fromDate },
        checkOut: { lte: toDate },
      },
    });

    const days = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalRoomNights = totalRooms * days;
    const occupancyRate =
      totalRoomNights > 0 ? (checkedIn / totalRoomNights) * 100 : 0;

    const byRoomType = await this.prisma.booking.groupBy({
      by: ["roomId"],
      where: {
        status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkIn: { gte: fromDate },
        checkOut: { lte: toDate },
      },
      _count: { id: true },
    });

    return {
      from,
      to,
      totalRooms,
      totalRoomNights,
      occupiedNights: checkedIn,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }

  async getBookingStatusSummary(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const summary = await this.prisma.booking.groupBy({
      by: ["status"],
      where: { createdAt: { gte: fromDate, lte: toDate } },
      _count: { id: true },
    });

    const result: Record<string, number> = Object.values(BookingStatus).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {},
    );
    for (const s of summary) {
      result[s.status] = s._count.id;
    }
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000);
    result.PENDING_HOST_APPROVAL_EXPIRING_SOON =
      await this.prisma.booking.count({
        where: {
          status: BookingStatus.PENDING_HOST_APPROVAL,
          approvalDeadline: { lte: soon, gt: new Date() },
        },
      });
    return result;
  }

  async exportRevenueCsv(
    from: string,
    to: string,
    groupBy: "day" | "week" | "month" = "day",
  ): Promise<string> {
    const report = await this.getRevenueReport(from, to, groupBy);
    const rows = [["Date", "Revenue (VND)"]];
    for (const d of report.data) {
      rows.push([d.date, d.revenue.toString()]);
    }
    rows.push([]);
    rows.push(["Total Revenue", report.totalRevenue.toString()]);
    rows.push(["Total Bookings", report.totalBookings.toString()]);
    rows.push([]);
    rows.push(["Room Type", "Bookings", "Revenue (VND)"]);
    for (const [type, info] of Object.entries(report.byRoomType)) {
      rows.push([type, info.count.toString(), info.revenue.toString()]);
    }
    return rows.map((r) => r.join(",")).join("\n");
  }

  async exportOccupancyCsv(from: string, to: string): Promise<string> {
    const report = await this.getOccupancyReport(from, to);
    const rows = [
      ["Metric", "Value"],
      ["From", report.from],
      ["To", report.to],
      ["Total Rooms", report.totalRooms.toString()],
      ["Total Room Nights", report.totalRoomNights.toString()],
      ["Occupied Nights", report.occupiedNights.toString()],
      ["Occupancy Rate (%)", report.occupancyRate.toString()],
    ];
    return rows.map((r) => r.join(",")).join("\n");
  }
}
