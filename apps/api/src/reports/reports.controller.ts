import { Controller, Get, Query, Res } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { Response } from "express";
import { Role } from "@prisma/client";
import { ReportsService } from "./reports.service";
import { Roles } from "../common/decorators/roles.decorator";

@ApiTags("Reports")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller({ path: "reports", version: "1" })
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("revenue")
  @ApiOperation({ summary: "Báo cáo doanh thu (Admin)" })
  @ApiQuery({ name: "from", required: true, example: "2026-01-01" })
  @ApiQuery({ name: "to", required: true, example: "2026-01-31" })
  @ApiQuery({
    name: "groupBy",
    required: false,
    enum: ["day", "week", "month"],
  })
  @ApiQuery({ name: "format", required: false, enum: ["json", "csv"] })
  async getRevenue(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("groupBy") groupBy: "day" | "week" | "month" = "day",
    @Query("format") format: "json" | "csv" = "json",
    @Res() res?: Response,
  ) {
    if (format === "csv") {
      const csv = await this.reportsService.exportRevenueCsv(from, to, groupBy);
      res!.setHeader("Content-Type", "text/csv; charset=utf-8");
      res!.setHeader(
        "Content-Disposition",
        `attachment; filename=revenue-${from}-to-${to}.csv`,
      );
      return res!.send(csv);
    }
    const result = await this.reportsService.getRevenueReport(from, to, groupBy);
    return res!.json(result);
  }

  @Get("occupancy")
  @ApiOperation({ summary: "Báo cáo tỷ lệ lấp phòng (Admin)" })
  @ApiQuery({ name: "format", required: false, enum: ["json", "csv"] })
  async getOccupancy(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("format") format: "json" | "csv" = "json",
    @Res() res?: Response,
  ) {
    if (format === "csv") {
      const csv = await this.reportsService.exportOccupancyCsv(from, to);
      res!.setHeader("Content-Type", "text/csv; charset=utf-8");
      res!.setHeader(
        "Content-Disposition",
        `attachment; filename=occupancy-${from}-to-${to}.csv`,
      );
      return res!.send(csv);
    }
    const result = await this.reportsService.getOccupancyReport(from, to);
    return res!.json(result);
  }

  @Get("bookings-by-room-type")
  @ApiOperation({ summary: "Số đơn theo loại phòng (Admin)" })
  getBookingsByRoomType(
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.reportsService.getBookingsByRoomType(from, to);
  }

  @Get("bookings/summary")
  @ApiOperation({ summary: "Tổng hợp trạng thái đơn (Admin)" })
  getBookingsSummary(@Query("from") from: string, @Query("to") to: string) {
    return this.reportsService.getBookingStatusSummary(from, to);
  }

  @Get("users")
  @ApiOperation({ summary: "Thống kê người dùng (Admin)" })
  getUserStats() {
    return this.reportsService.getUserStats();
  }
}
