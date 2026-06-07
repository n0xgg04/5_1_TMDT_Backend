import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { Request } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { IsString, IsEnum, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentMethod, Role } from "@prisma/client";
import { PaymentsService } from "./payments.service";
import { StripeService } from "./stripe.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { Roles } from "../common/decorators/roles.decorator";

class InitiatePaymentDto {
  @ApiProperty()
  @IsString()
  bookingId!: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;
}

class ConfirmStripeSetupDto {
  @ApiProperty()
  @IsString()
  clientSecret!: string;

  @ApiProperty()
  @IsString()
  paymentMethodId!: string;
}

class CreateStripePaymentIntentDto {
  @ApiProperty()
  @IsString()
  bookingId!: string;

  @ApiProperty()
  @IsString()
  paymentMethodId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;
}

class ConfirmManualPaymentDto {
  @ApiProperty({ enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER] })
  @IsEnum(PaymentMethod)
  method!: "CASH" | "BANK_TRANSFER";
}

@ApiTags("Payments")
@ApiBearerAuth()
@Controller({ path: "payments", version: "1" })
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post("initiate")
  @ApiOperation({ summary: "Khởi tạo thanh toán" })
  initiatePayment(
    @CurrentUser() user: { id: string },
    @Body() dto: InitiatePaymentDto,
    @Req() req: Request,
  ) {
    const ipAddr =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ??
      req.socket.remoteAddress ??
      "127.0.0.1";
    return this.paymentsService.initiatePayment(
      dto.bookingId,
      user.id,
      dto.method,
      ipAddr,
      undefined,
      dto.couponCode,
      this.shouldBypassLocalVNPay(req, dto.method),
    );
  }

  @Public()
  @Get("webhook/vnpay")
  @ApiOperation({ summary: "VNPay webhook callback (public)" })
  vnpayWebhook(@Query() query: Record<string, string>) {
    return this.paymentsService.handleWebhook(query);
  }

  @Get("booking/:bookingId")
  @ApiOperation({ summary: "Lấy thông tin thanh toán theo đơn" })
  getPayment(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentsService.getPaymentByBookingId(bookingId, user.id);
  }

  @Post("stripe/setup-intent")
  @ApiOperation({ summary: "Tạo Stripe Setup Intent (mock)" })
  createStripeSetupIntent() {
    return this.stripeService.createSetupIntent();
  }

  @Post("stripe/confirm-setup")
  @ApiOperation({ summary: "Xác nhận Stripe Setup Intent" })
  confirmStripeSetup(@Body() dto: ConfirmStripeSetupDto) {
    return this.stripeService.confirmCardSetup(
      dto.clientSecret,
      dto.paymentMethodId,
    );
  }

  @Post("stripe/payment-intent")
  @ApiOperation({ summary: "Tạo Stripe Payment Intent cho thanh toán VISA" })
  createStripePaymentIntent(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateStripePaymentIntentDto,
  ) {
    return this.paymentsService.initiateStripePayment(
      dto.bookingId,
      user.id,
      dto.paymentMethodId,
      dto.couponCode,
    );
  }

  @Post("stripe/confirm-payment")
  @ApiOperation({ summary: "Xác nhận thanh toán Stripe" })
  confirmStripePayment(@Body() dto: { paymentIntentId: string }) {
    return this.paymentsService.confirmStripePayment(dto.paymentIntentId);
  }

  @Post("booking/:bookingId/manual-confirm")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Xác nhận thanh toán thủ công tại quầy" })
  confirmManualPayment(
    @Param("bookingId") bookingId: string,
    @Body() dto: ConfirmManualPaymentDto,
  ) {
    if (
      dto.method !== PaymentMethod.CASH &&
      dto.method !== PaymentMethod.BANK_TRANSFER
    ) {
      throw new BadRequestException("Phương thức thanh toán thủ công không hợp lệ");
    }

    return this.paymentsService.confirmManualPayment(bookingId, dto.method);
  }

  private shouldBypassLocalVNPay(req: Request, method: PaymentMethod) {
    // if (method !== PaymentMethod.VNPAY) {
    {
      return false;
    }

    const values = [
      req.headers.origin,
      req.headers.referer,
      req.headers.host,
      req.hostname,
    ].flatMap((value) => (Array.isArray(value) ? value : [value]));

    return values.some(
      (value) =>
        typeof value === "string" &&
        (value.includes("localhost") || value.includes("127.0.0.1")),
    );
  }
}
