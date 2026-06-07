import {
  Controller,
  Post,
  Req,
  Res,
  Logger,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Public } from "../common/decorators/public.decorator";
import { SepayWebhookService } from "./sepay.service";
import type { SepayWebhookPayload } from "./sepay.types";

@Controller({ path: "webhook", version: VERSION_NEUTRAL })
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(private readonly sepayService: SepayWebhookService) {}

  /**
   * Endpoint nhận webhook từ Sepay.
   * URL: POST /api/webhook/payment
   * Xác thực: API Key qua header Authorization: Apikey <key>
   * Phản hồi {"success": true} trong 30 giây.
   */
  @Post("payment")
  @Public()
  async handleWebhook(@Req() req: Request, @Res() res: Response): Promise<void> {
    // ===== LOG REQUEST =====
    this.logger.log("========================================");
    this.logger.log("WEBHOOK RECEIVED");
    this.logger.log(`Method: ${req.method}`);
    this.logger.log(`URL: ${req.url}`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Body: ${JSON.stringify(req.body)}`);
    this.logger.log("========================================");

    try {
      const authHeader = req.headers.authorization;

      // 1. Verify API Key
      this.logger.log(`[AUTH] Authorization header: ${authHeader ?? "MISSING"}`);
      this.logger.log(`[AUTH] Expected API Key (first 8 chars): ${(process.env.SEPAY_API_KEY ?? "NOT SET").slice(0, 8)}...`);
      this.sepayService.verifyApiKey(authHeader ?? "");
      this.logger.log("[AUTH] API Key verified OK");

      // 2. Parse payload
      const payload: SepayWebhookPayload = req.body;
      this.logger.log(`[PAYLOAD] id=${payload.id} gateway=${payload.gateway} transferType=${payload.transferType} amount=${payload.transferAmount}`);
      this.logger.log(`[PAYLOAD] accountNumber=${payload.accountNumber} code=${payload.code} content="${payload.content}"`);

      // 3. Store transaction (idempotent)
      const { inserted } = await this.sepayService.storeTransaction(payload);
      this.logger.log(`[STORE] inserted=${inserted}`);

      if (inserted && payload.transferType === "in") {
        // 4. Process matching async — fire and forget
        this.logger.log("[MATCH] Starting async match...");
        this.sepayService.matchTransaction(payload).then(() => {
          this.logger.log(`[MATCH] Match completed for tx ${payload.id}`);
        }).catch((err: unknown) => {
          this.logger.error(
            `[MATCH] Match failed for tx ${payload.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
      } else {
        this.logger.log(`[MATCH] Skipped (inserted=${inserted}, transferType=${payload.transferType})`);
      }

      this.logger.log("[RESPONSE] 200 OK");
      res.status(200).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`[ERROR] ${message}`);
      if (message.includes("API key") || message.includes("Authorization") || message.includes("not configured")) {
        this.logger.error("[RESPONSE] 401 Unauthorized");
        res.status(401).json({ success: false, message });
        return;
      }
      this.logger.error("[RESPONSE] 500 Internal Error");
      res.status(500).json({ success: false, message: "Internal error" });
    }
  }
}
