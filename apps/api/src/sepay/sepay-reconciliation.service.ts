import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { MatchService } from "./match.service";
import type { SepayWebhookPayload } from "./sepay.types";

/**
 * Dịch vụ đối soát định kỳ — gọi Sepay API để bổ sung giao dịch thiếu
 * khi webhook không đến (endpoint sập > 5h).
 * Được trigger bởi external cron (Vercel Cron, cron-job.org) qua
 * POST /internal/cron/sepay-reconciliation.
 */
@Injectable()
export class SepayReconciliationService {
  private readonly logger = new Logger(SepayReconciliationService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchService: MatchService,
  ) {}

  async reconcile(): Promise<{ skipped?: boolean; newCount?: number }> {
    const apiKey = process.env.SEPAY_API_KEY;
    if (!apiKey) {
      this.logger.debug("SEPAY_API_KEY not configured, skipping");
      return { skipped: true };
    }

    if (this.running) {
      this.logger.warn("Previous reconciliation still running, skipping");
      return { skipped: true };
    }

    this.running = true;
    try {
      this.logger.log("Starting Sepay reconciliation...");
      const transactions = await this.fetchSepayTransactions(apiKey);

      let newCount = 0;
      for (const tx of transactions) {
        const txId = String(tx.id);
        const existing = await this.prisma.bankTransaction.findUnique({
          where: { gatewayTransactionId: txId },
        });
        if (existing) continue;

        await this.storeAndMatch(tx);
        newCount += 1;
      }

      this.logger.log(`Reconciliation done: ${newCount} new transactions`);
      return { newCount };
    } catch (error: unknown) {
      this.logger.error(
        `Reconciliation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      this.running = false;
    }
  }

  private async fetchSepayTransactions(apiKey: string): Promise<SepayWebhookPayload[]> {
    const url = "https://api.sepay.vn/v1/transactions";
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      throw new Error(`Sepay API returned ${resp.status}: ${await resp.text()}`);
    }

    const data = await resp.json() as { transactions?: SepayWebhookPayload[] };
    return data.transactions ?? [];
  }

  private async storeAndMatch(payload: SepayWebhookPayload): Promise<void> {
    try {
      await this.prisma.bankTransaction.create({
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
      await this.matchService.matchTransaction(payload);
    } catch (error: unknown) {
      const isDup =
        error instanceof Error && "code" in error && (error as Record<string, unknown>).code === "P2002";
      if (!isDup) throw error;
    }
  }
}
