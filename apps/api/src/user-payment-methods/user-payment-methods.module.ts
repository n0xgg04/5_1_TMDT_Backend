import { Module } from "@nestjs/common";
import { UserPaymentMethodsController } from "./user-payment-methods.controller";
import { UserPaymentMethodsService } from "./user-payment-methods.service";

@Module({
  controllers: [UserPaymentMethodsController],
  providers: [UserPaymentMethodsService],
  exports: [UserPaymentMethodsService],
})
export class UserPaymentMethodsModule {}
