import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { VNPayGateway } from "./gateway/vnpay.gateway";
import { CouponsModule } from "../coupons/coupons.module";
import { BillsModule } from "../bills/bills.module";

@Module({
  imports: [CouponsModule, BillsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, VNPayGateway],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}
