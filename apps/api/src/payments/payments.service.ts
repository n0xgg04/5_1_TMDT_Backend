import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { EventsService } from "../common/events/events.service";
import { StripeService } from "./stripe.service";
import { VNPayGateway } from "./gateway/vnpay.gateway";
import { CouponsService } from "../coupons/coupons.service";
import {
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
  PaymentType,
} from "@prisma/client";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly stripe: StripeService,
    private readonly vnpay: VNPayGateway,
    private readonly coupons: CouponsService,
  ) {}

  async initiatePayment(
    bookingId: string,
    customerId: string,
    method: PaymentMethod,
    ipAddr: string,
    paymentType: PaymentType = PaymentType.FULL,
    couponCode?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");
    if (booking.customerId !== customerId) {
      throw new BadRequestException("Không có quyền thanh toán đơn này");
    }
    if (booking.status === BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Đơn chưa được duyệt để thanh toán");
    }
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Đơn không ở trạng thái chờ thanh toán");
    }
    if (!booking.approvedAt || !booking.paymentDeadline) {
      throw new BadRequestException("Đơn chưa được duyệt để thanh toán");
    }
    if (new Date() > booking.paymentDeadline) {
      throw new BadRequestException("Đơn đã hết hạn thanh toán");
    }

    let payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (payment && payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException("Đơn đã được thanh toán");
    }

    const prepared = await this.prepareAmountWithCoupon(
      booking,
      customerId,
      couponCode,
    );
    let amount = prepared.amount;
    if (paymentType === PaymentType.DEPOSIT) {
      amount = Math.floor(amount * 0.3);
    }

    let gatewayUrl: string | undefined;
    if (method === PaymentMethod.VNPAY) {
      gatewayUrl = this.vnpay.createPaymentUrl({
        bookingId,
        amount,
        orderInfo: `Thanh toan dat phong ${booking.bookingCode}`,
        ipAddr,
      });
    }

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          customerId,
          method,
          paymentType,
          amount: amount,
          status: PaymentStatus.PROCESSING,
          gatewayUrl,
        },
      });
    } else {
      payment = await this.prisma.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.PROCESSING,
          method,
          paymentType,
          amount,
          gatewayUrl,
        },
      });
    }

    if (method === PaymentMethod.BANK_TRANSFER) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PENDING_PAYMENT },
      });
      const bankInfo = await this.prisma.paymentMethodInfo.findFirst({
        where: { isActive: true },
      });
      return { payment, gatewayUrl, bankInfo, amount };
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAYING },
    });

    return { payment, gatewayUrl, amount };
  }

  async handleWebhook(query: Record<string, string>) {
    const { valid, txnRef, amount, responseCode } =
      this.vnpay.verifyWebhook(query);

    if (!valid) {
      return { code: "97", message: "Invalid signature" };
    }

    const bookingCodePart = txnRef.split("-")[0];
    const booking = await this.prisma.booking.findFirst({
      where: { bookingCode: { endsWith: bookingCodePart } },
    });

    if (!booking) {
      return { code: "01", message: "Order not found" };
    }

    const gatewayTransactionId = query["vnp_TransactionNo"];

    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId: booking.id },
    });

    if (existingPayment?.gatewayTransactionId === gatewayTransactionId) {
      return { code: "00", message: "Already processed" };
    }

    const isSuccess = responseCode === "00";

    await this.prisma.payment.update({
      where: { bookingId: booking.id },
      data: {
        status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        gatewayTransactionId,
        paidAt: isSuccess ? new Date() : undefined,
        failureReason: isSuccess ? undefined : `VNPay code: ${responseCode}`,
      },
    });

    if (isSuccess) {
      await this.events.emit("payment.success", {
        bookingId: booking.id,
        amount,
        gatewayTransactionId,
      });
    } else {
      await this.events.emit("payment.failed", {
        bookingId: booking.id,
        responseCode,
        gatewayTransactionId,
      });
    }

    return { code: "00", message: "Confirmed" };
  }

  async getPaymentByBookingId(bookingId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true },
    });
    if (!payment)
      throw new NotFoundException("Thông tin thanh toán không tồn tại");
    if (payment.customerId !== userId) {
      throw new BadRequestException("Không có quyền xem thông tin này");
    }
    return payment;
  }

  async initiateStripePayment(
    bookingId: string,
    customerId: string,
    userPaymentMethodId: string,
    couponCode?: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException("Đơn đặt phòng không tồn tại");
    if (booking.customerId !== customerId) {
      throw new BadRequestException("Không có quyền thanh toán đơn này");
    }
    if (booking.status === BookingStatus.PENDING_HOST_APPROVAL) {
      throw new BadRequestException("Đơn chưa được duyệt để thanh toán");
    }
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException("Đơn không ở trạng thái chờ thanh toán");
    }
    if (!booking.approvedAt || !booking.paymentDeadline) {
      throw new BadRequestException("Đơn chưa được duyệt để thanh toán");
    }
    if (new Date() > booking.paymentDeadline) {
      throw new BadRequestException("Đơn đã hết hạn thanh toán");
    }

    const userMethod = await this.prisma.userPaymentMethod.findFirst({
      where: { id: userPaymentMethodId, userId: customerId },
    });
    if (!userMethod) {
      throw new NotFoundException("Không tìm thấy phương thức thanh toán");
    }

    const paymentMethodId = (
      userMethod.details as Record<string, string> | undefined
    )?.paymentMethodId;
    if (!paymentMethodId) {
      throw new BadRequestException("Thẻ chưa được liên kết với Stripe");
    }

    let payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (payment && payment.status === PaymentStatus.COMPLETED) {
      throw new ConflictException("Đơn đã được thanh toán");
    }

    const { amount } = await this.prepareAmountWithCoupon(
      booking,
      customerId,
      couponCode,
    );

    const { clientSecret, paymentIntentId } =
      await this.stripe.createPaymentIntent({
        amount: amount * 100,
        currency: "vnd",
        paymentMethodId,
        metadata: {
          bookingId,
          bookingCode: booking.bookingCode,
        },
      });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          bookingId,
          customerId,
          method: PaymentMethod.VISA,
          paymentType: PaymentType.FULL,
          amount,
          status: PaymentStatus.PROCESSING,
          gatewayTransactionId: paymentIntentId,
        },
      });
    } else {
      payment = await this.prisma.payment.update({
        where: { bookingId },
        data: {
          status: PaymentStatus.PROCESSING,
          method: PaymentMethod.VISA,
          paymentType: PaymentType.FULL,
          amount,
          gatewayTransactionId: paymentIntentId,
        },
      });
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.PAYING },
    });

    return { payment, clientSecret, amount };
  }

  async confirmStripePayment(paymentIntentId: string) {
    const paymentIntent =
      await this.stripe.confirmPaymentIntent(paymentIntentId);

    const payment = await this.prisma.payment.findFirst({
      where: { gatewayTransactionId: paymentIntentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException("Không tìm thấy giao dịch");
    }

    const isSuccess = paymentIntent.status === "succeeded";

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
        paidAt: isSuccess ? new Date() : undefined,
        failureReason: isSuccess
          ? undefined
          : `Stripe status: ${paymentIntent.status}`,
      },
    });

    if (isSuccess) {
      await this.events.emit("payment.success", {
        bookingId: payment.bookingId,
        amount: payment.amount,
        gatewayTransactionId: paymentIntentId,
      });
    } else {
      await this.events.emit("payment.failed", {
        bookingId: payment.bookingId,
        responseCode: paymentIntent.status,
        gatewayTransactionId: paymentIntentId,
      });
    }

    return { success: isSuccess, status: paymentIntent.status };
  }

  private async prepareAmountWithCoupon(
    booking: {
      id: string;
      couponCode: string | null;
      totalAmount: unknown;
    },
    customerId: string,
    couponCode?: string,
  ) {
    const requestedCode = couponCode?.trim();
    if (!requestedCode) {
      return { amount: Number(booking.totalAmount) };
    }

    const normalized = requestedCode.toUpperCase();
    if (booking.couponCode) {
      if (booking.couponCode.toUpperCase() !== normalized) {
        throw new BadRequestException("Đơn đã áp dụng mã giảm giá khác");
      }
      return { amount: Number(booking.totalAmount) };
    }

    const couponResult = await this.coupons.reserveCouponForUser(
      customerId,
      normalized,
      Number(booking.totalAmount),
    );
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        couponCode: normalized,
        discountAmount: couponResult.discount,
        totalAmount: couponResult.finalAmount,
      },
    });

    return { amount: couponResult.finalAmount };
  }
}
