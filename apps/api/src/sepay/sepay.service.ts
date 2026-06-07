import {
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { MatchService } from "./match.service";
import type { SepayWebhookPayload } from "./sepay.types";

@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchService: MatchService,
  ) {}

  /**
   * Xác thực API Key từ Sepay webhook.
   * Header: Authorization: Apikey <key>
   */
  verifyApiKey(authHeader: string): void {
    const expectedKey = process.env.SEPAY_API_KEY;
    if (!expectedKey) {
      throw new UnauthorizedException("SEPAY_API_KEY not configured");
    }

    if (!authHeader || !authHeader.startsWith("Apikey ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const providedKey = authHeader.slice(7); // bỏ "Apikey "
    if (providedKey !== expectedKey) {
      throw new UnauthorizedException("Invalid API key");
    }
  }

  /**
   * Lưu giao dịch từ webhook vào BankTransaction.
   * Chống trùng qua UNIQUE constraint trên gatewayTransactionId.
   */
  async storeTransaction(payload: SepayWebhookPayload): Promise<{ inserted: boolean; id?: string }> {
    try {
      const tx = await this.prisma.bankTransaction.create({
        data: {
          gatewayTransactionId: String(payload.id),
          gateway: payload.gateway,
          transactionDate: new Date(payload.transactionDate),
          accountNumber: payload.accountNumber,
          subAccount: payload.subAccount || null,
          code: payload.code,
          content: payload.content,
          transferType: payload.transferType,
          description: payload.description || null,
          transferAmount: payload.transferAmount,
          accumulated: payload.accumulated ?? 0,
          referenceCode: payload.referenceCode || null,
          rawPayload: payload as unknown as object,
        },
      });
      this.logger.log(`Stored transaction ${payload.id} from ${payload.gateway}`);
      return { inserted: true, id: tx.id };
    } catch (error: unknown) {
      const isUniqueViolation =
        error instanceof Error && "code" in error && (error as Record<string, unknown>).code === "P2002";
      if (isUniqueViolation) {
        this.logger.debug(`Duplicate transaction ${payload.id}, skipped`);
        return { inserted: false };
      }
      throw error;
    }
  }

  /**
   * Khớp giao dịch với bill (delegate sang MatchService).
   */
  async matchTransaction(payload: SepayWebhookPayload): Promise<void> {
    await this.matchService.matchTransaction(payload);
  }
}
