import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { EventsService } from "../common/events/events.service";
import type { SepayWebhookPayload } from "./sepay.types";

const PAYMENT_CODE_REGEX = /SS-?[A-Za-z0-9]+/;

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  /**
   * Parse mã thanh toán từ Sepay payload.
   * Ưu tiên `code` field (đã được Sepay parse theo cấu hình).
   * Fallback regex từ `content`.
   */
  parsePaymentCode(content: string, code: string | null): string | null {
    if (code) return this.normalizeCode(code);
    const match = PAYMENT_CODE_REGEX.exec(content);
    return match ? this.normalizeCode(match[0]) : null;
  }

  /**
   * Chuẩn hóa mã thanh toán: đảm bảo có dấu "-" sau "SS".
   * "SScmq3ma..." → "SS-cmq3ma..."
   */
  private normalizeCode(raw: string): string {
    if (raw.startsWith("SS-")) return raw;
    if (raw.startsWith("SS")) return `SS-${raw.slice(2)}`;
    return raw;
  }

  /**
   * Khớp giao dịch với bill và xử lý tự động.
   */
  async matchTransaction(payload: SepayWebhookPayload): Promise<void> {
    if (payload.transferType === "out") {
      this.logger.debug(`Skipping out transfer ${payload.id}`);
      return;
    }

    const paymentCode = this.parsePaymentCode(payload.content, payload.code);
    const txId = String(payload.id);

    if (!paymentCode) {
      this.logger.debug(`No payment code in transaction ${txId}`);
      await this.updateTxStatus(txId, "UNMATCHED");
      return;
    }

    const bill = await this.prisma.bill.findUnique({
      where: { paymentCode },
      include: { booking: { include: { payment: true } } },
    });

    if (!bill) {
      this.logger.debug(`No bill found for code ${paymentCode}`);
      await this.updateTxStatus(txId, "UNMATCHED");
      return;
    }

    // Bill đã hết hạn hoặc đã hủy
    if (bill.status === "EXPIRED" || bill.status === "CANCELLED") {
      this.logger.warn(`Late payment for bill ${paymentCode} (status: ${bill.status})`);
      await this.updateTxStatus(txId, "LATE_PAYMENT", bill.id);
      return;
    }

    // Bill đã paid rồi
    if (bill.status === "PAID") {
      this.logger.debug(`Bill ${paymentCode} already paid, skipping`);
      await this.updateTxStatus(txId, "MATCHED", bill.id);
      return;
    }

    // Kiểm tra amount
    if (payload.transferAmount !== Number(bill.amount)) {
      this.logger.warn(
        `Mismatch amount for ${paymentCode}: expected ${bill.amount}, got ${payload.transferAmount}`,
      );
      await this.updateTxStatus(txId, "MISMATCH", bill.id);
      return;
    }

    // === MATCHED ===
    await this.prisma.$transaction([
      this.prisma.bill.update({
        where: { id: bill.id },
        data: { status: "PAID", paidAt: new Date(payload.transactionDate) },
      }),
      this.prisma.payment.updateMany({
        where: { bookingId: bill.bookingId },
        data: {
          status: "COMPLETED",
          gatewayTransactionId: txId,
          paidAt: new Date(payload.transactionDate),
        },
      }),
      this.prisma.bankTransaction.update({
        where: { gatewayTransactionId: txId },
        data: { matchStatus: "MATCHED", matchedBillId: bill.id },
      }),
    ]);

    this.logger.log(`Matched: tx ${txId} → bill ${paymentCode} → booking ${bill.bookingId}`);

    // Emit payment.success để confirm booking
    await this.events.emit("payment.success", {
      bookingId: bill.bookingId,
      amount: payload.transferAmount,
      gatewayTransactionId: txId,
    });
  }

  private async updateTxStatus(gatewayTransactionId: string, matchStatus: string, matchedBillId?: string) {
    await this.prisma.bankTransaction.update({
      where: { gatewayTransactionId },
      data: {
        matchStatus: matchStatus as never,
        ...(matchedBillId ? { matchedBillId } : {}),
      },
    });
  }
}
