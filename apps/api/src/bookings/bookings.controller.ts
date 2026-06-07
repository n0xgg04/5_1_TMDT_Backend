import { Controller, Post, Get, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Role, BookingStatus } from "@prisma/client";
import { BookingsService } from "./bookings.service";
import { BillsService } from "../bills/bills.service";
import {
  CreateBookingDto,
  CancelBookingDto,
  UploadReceiptDto,
  ApproveBookingDto,
  RejectBookingDto,
} from "./dto/bookings.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";

@ApiTags("Bookings")
@ApiBearerAuth()
@Controller({ path: "bookings", version: "1" })
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly billsService: BillsService,
  ) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Tạo đơn đặt phòng" })
  createBooking(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Get("my")
  @ApiOperation({ summary: "Lịch sử đặt phòng của tôi" })
  getMyBookings(
    @CurrentUser() user: { id: string },
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("status") status?: BookingStatus,
  ) {
    return this.bookingsService.getMyBookings(user.id, +page, +limit, status);
  }

  @Get("staff/approval-requests")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Danh sách yêu cầu đặt chỗ chờ duyệt" })
  getApprovalRequests(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.bookingsService.getApprovalRequests(+page, +limit);
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: "Danh sách tất cả đơn đặt phòng (Admin/Staff)" })
  getAllBookings(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("status") status?: BookingStatus,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("search") search?: string,
  ) {
    return this.bookingsService.getAllBookings(
      +page,
      +limit,
      status,
      from,
      to,
      search,
    );
  }

  @Get("refunds")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Danh sách yêu cầu hoàn tiền (Admin)" })
  getRefundRequests(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.bookingsService.getRefundRequests(+page, +limit);
  }

  @Post("refunds/:refundId/process")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Xác nhận đã hoàn tiền (Admin)" })
  processRefund(
    @Param("refundId") refundId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.bookingsService.processRefund(refundId, user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Chi tiết đơn đặt phòng" })
  getBooking(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    return this.bookingsService.getBookingById(id, user);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Hủy đơn đặt phòng" })
  cancelBooking(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(id, user.id, dto.reason);
  }

  @Post(":id/checkin")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Check-in (Staff)" })
  checkin(@Param("id") id: string) {
    return this.bookingsService.checkin(id);
  }

  @Post(":id/checkout")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Check-out (Staff)" })
  checkout(@Param("id") id: string) {
    return this.bookingsService.checkout(id);
  }

  @Get(":id/bill")
  @ApiOperation({ summary: "Xem hóa đơn thanh toán của đơn" })
  getBill(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    // Reuse booking auth check via getBookingById
    return this.bookingsService.getBookingById(id, user).then(() =>
      this.billsService.getBillByBookingId(id)
    );
  }

  @Post(":id/reopen")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Mở lại đơn đã hủy (Staff)" })
  reopenBooking(@Param("id") id: string) {
    return this.bookingsService.reopenBooking(id);
  }

  @Post(":id/upload-receipt")
  @Roles(Role.CUSTOMER, Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Upload biên lai chuyển khoản" })
  uploadReceipt(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UploadReceiptDto,
  ) {
    return this.bookingsService.uploadReceipt(id, user.id, dto);
  }

  @Post(":id/approve-request")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Duyệt yêu cầu đặt chỗ trước thanh toán" })
  approveRequest(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.bookingsService.approveRequest(id, user.id);
  }

  @Post(":id/reject-request")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Từ chối yêu cầu đặt chỗ trước thanh toán" })
  rejectRequest(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RejectBookingDto,
  ) {
    return this.bookingsService.rejectRequest(id, user.id, dto);
  }

  @Get("staff/pending")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Danh sách booking chờ duyệt (Staff)" })
  getPendingBookings(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.bookingsService.getPendingBookings(+page, +limit);
  }

  @Post(":id/approve")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Duyệt booking (Staff)" })
  approveBooking(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ApproveBookingDto,
  ) {
    return this.bookingsService.approveBooking(id, user.id, dto);
  }

  @Post(":id/reject")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Từ chối booking (Staff)" })
  rejectBooking(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RejectBookingDto,
  ) {
    return this.bookingsService.rejectBooking(id, user.id, dto);
  }

  @Get(":id/refund")
  @Roles(Role.CUSTOMER, Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Tính số tiền hoàn trả khi hủy đơn" })
  async getRefundCalculation(
    @Param("id") id: string,
    @CurrentUser() user: { id: string; role: Role },
  ) {
    const booking = await this.bookingsService.getBookingById(id, user);
    return this.bookingsService.calculateRefund(booking);
  }

  @Post(":id/refund-request")
  @Roles(Role.CUSTOMER, Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Gửi yêu cầu hoàn tiền" })
  submitRefundRequest(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body()
    dto: {
      accountHolder: string;
      accountNumber: string;
      bankName: string;
      bankBranch?: string;
    },
  ) {
    return this.bookingsService.submitRefundRequest(id, user.id, dto);
  }
}
