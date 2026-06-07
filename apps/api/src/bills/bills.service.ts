import {
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import type { BillStatus } from "@prisma/client";

const PAYMENT_CODE_PREFIX = "SS-";

@Injectable()
export class BillsService {
  private readonly logger = new Logger(BillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo bill cho booking khi được duyệt yêu cầu đặt chỗ.
   * Sinh paymentCode = SS-<bookingCode>. Lấy account info từ env.
   */
  async createBill(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");

    // Idempotent — không tạo trùng
    const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER ?? "000000000";
    const bankName = process.env.SEPAY_BANK_NAME ?? "Ngân hàng";
    const accountHolder = process.env.SEPAY_ACCOUNT_HOLDER ?? "Sapphire Stay";

    // Update existing bill with latest bank info
    const existing = await this.prisma.bill.findUnique({ where: { bookingId } });
    if (existing) {
      return this.prisma.bill.update({
        where: { id: existing.id },
        data: { accountNumber, bankName, accountHolder },
      });
    }

    const paymentCode = `${PAYMENT_CODE_PREFIX}${booking.bookingCode}`;
    const bill = await this.prisma.bill.create({
      data: {
        bookingId,
        paymentCode,
        amount: booking.totalAmount,
        status: "PENDING",
        paymentDeadline: booking.paymentDeadline,
        accountNumber,
        bankName,
        accountHolder,
      },
    });
    this.logger.log(`Created bill ${paymentCode} for booking ${booking.bookingCode}`);
    return bill;
  }

  async getBillByBookingId(bookingId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { bookingId } });
    if (!bill) throw new NotFoundException("Không tìm thấy hóa đơn cho đơn này");
    return bill;
  }

  async updateBillStatus(billId: string, status: BillStatus, paidAt?: Date) {
    return this.prisma.bill.update({
      where: { id: billId },
      data: {
        status,
        ...(paidAt ? { paidAt } : {}),
      },
    });
  }

  /**
   * Cập nhật bill status theo booking status.
   * Gọi khi booking expired hoặc cancelled.
   */
  async syncBillStatusByBooking(bookingId: string, bookingStatus: string) {
    const bill = await this.prisma.bill.findUnique({ where: { bookingId } });
    if (!bill) return;

    const statusMap: Record<string, BillStatus> = {
      EXPIRED: "EXPIRED",
      CANCELLED: "CANCELLED",
    };
    const newStatus = statusMap[bookingStatus];
    if (newStatus && bill.status === "PENDING") {
      await this.updateBillStatus(bill.id, newStatus);
      this.logger.log(`Bill ${bill.paymentCode} → ${newStatus} (booking ${bookingStatus})`);
    }
  }
}
