import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { VNPayGateway } from "./gateway/vnpay.gateway";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, VNPayGateway],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}
