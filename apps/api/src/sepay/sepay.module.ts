import { Module } from "@nestjs/common";
import { SepayWebhookController } from "./sepay.controller";
import { SepayWebhookService } from "./sepay.service";
import { MatchService } from "./match.service";
import { SepayReconciliationService } from "./sepay-reconciliation.service";
import { BillsModule } from "../bills/bills.module";

@Module({
  imports: [BillsModule],
  controllers: [SepayWebhookController],
  providers: [SepayWebhookService, MatchService, SepayReconciliationService],
  exports: [SepayWebhookService, MatchService, SepayReconciliationService],
})
export class SepayModule {}
