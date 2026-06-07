import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { CreateCouponDto, ApplyCouponDto } from "./coupons.dto";

const COUPONS_CACHE_KEY = "coupons:active";
const COUPONS_CACHE_TTL = 60;

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findActive() {
    const cached = await this.redis.get(COUPONS_CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const result = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        usageCount: { lt: this.prisma.coupon.fields.usageLimit },
      },
      orderBy: { createdAt: "desc" },
    });
    await this.redis.set(COUPONS_CACHE_KEY, JSON.stringify(result), COUPONS_CACHE_TTL);
    return result;
  }

  async create(dto: CreateCouponDto) {
    await this.redis.del(COUPONS_CACHE_KEY);
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type ?? "percentage",
        value: dto.value,
        minAmount: dto.minAmount ? dto.minAmount : null,
        maxDiscount: dto.maxDiscount ? dto.maxDiscount : null,
        usageLimit: dto.usageLimit ?? 1,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async applyCoupon(dto: ApplyCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (!coupon) throw new NotFoundException("Mã giảm giá không tồn tại");
    if (!coupon.isActive)
      throw new BadRequestException("Mã giảm giá không còn hiệu lực");

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new BadRequestException("Mã giảm giá đã hết hạn hoặc chưa bắt đầu");
    }
    if (coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException("Mã giảm giá đã hết lượt sử dụng");
    }

    const amount = dto.amount;
    if (coupon.minAmount && amount < Number(coupon.minAmount)) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu ${coupon.minAmount}đ mới được áp dụng`,
      );
    }

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (amount * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.value);
    }

    discount = Math.min(discount, amount);

    return {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      finalAmount: amount - discount,
    };
  }

  async incrementUsage(code: string) {
    await this.redis.del(COUPONS_CACHE_KEY);
    return this.prisma.coupon.update({
      where: { code: code.toUpperCase() },
      data: { usageCount: { increment: 1 } },
    });
  }

  async reserveCouponForUser(userId: string, code: string, amount: number) {
    const normalized = code.toUpperCase();
    const couponResult = await this.applyCoupon({ code: normalized, amount });
    await this.incrementUsage(normalized);

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalized },
    });
    if (coupon) {
      await this.prisma.userCoupon.upsert({
        where: { userId_couponId: { userId, couponId: coupon.id } },
        update: { isUsed: true, usedAt: new Date() },
        create: {
          userId,
          couponId: coupon.id,
          isUsed: true,
          usedAt: new Date(),
        },
      });
    }

    return couponResult;
  }

  async releaseReservationForBooking(booking: {
    id: string;
    customerId: string;
    couponCode: string | null;
    totalAmount: unknown;
    discountAmount?: unknown;
    payment?: { status: PaymentStatus } | null;
  }) {
    if (
      !booking.couponCode ||
      booking.payment?.status === PaymentStatus.COMPLETED
    ) {
      return;
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: booking.couponCode.toUpperCase() },
    });
    if (!coupon) return;

    if (coupon.usageCount > 0) {
      await this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { decrement: 1 } },
      });
    }

    const discountAmount = Number(booking.discountAmount ?? 0);
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        couponCode: null,
        discountAmount: null,
        totalAmount:
          discountAmount > 0
            ? Number(booking.totalAmount) + discountAmount
            : Number(booking.totalAmount),
      },
    });

    const completedUsage = await this.prisma.booking.count({
      where: {
        id: { not: booking.id },
        customerId: booking.customerId,
        couponCode: coupon.code,
        payment: { is: { status: PaymentStatus.COMPLETED } },
      },
    });

    if (completedUsage === 0) {
      await this.prisma.userCoupon.updateMany({
        where: { userId: booking.customerId, couponId: coupon.id },
        data: { isUsed: false, usedAt: null },
      });
    }
  }

  async getMyCoupons(userId: string) {
    return this.prisma.userCoupon.findMany({
      where: { userId },
      include: { coupon: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findActivePublic(userId?: string) {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!userId) return coupons.map((c) => ({ ...c, isClaimed: false }));
    const userCoupons = await this.prisma.userCoupon.findMany({
      where: { userId },
      select: { couponId: true },
    });
    const claimedIds = new Set(userCoupons.map((uc) => uc.couponId));
    return coupons.map((c) => ({ ...c, isClaimed: claimedIds.has(c.id) }));
  }

  async claimCoupon(userId: string, couponId: string) {
    const existing = await this.prisma.userCoupon.findUnique({
      where: { userId_couponId: { userId, couponId } },
    });
    if (existing) return existing;
    return this.prisma.userCoupon.create({
      data: { userId, couponId },
      include: { coupon: true },
    });
  }
}
