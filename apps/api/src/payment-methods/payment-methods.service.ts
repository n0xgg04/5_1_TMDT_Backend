import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from "./payment-methods.dto";

const CACHE_KEY = "payment-methods";
const CACHE_TTL = 300;

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    const result = await this.prisma.paymentMethodInfo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    await this.redis.set(CACHE_KEY, JSON.stringify(result), CACHE_TTL);
    return result;
  }

  async findAllAdmin() {
    return this.prisma.paymentMethodInfo.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreatePaymentMethodDto) {
    const result = await this.prisma.paymentMethodInfo.create({ data: dto });
    await this.redis.del(CACHE_KEY);
    return result;
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    const exists = await this.prisma.paymentMethodInfo.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException("Không tìm thấy");
    const result = await this.prisma.paymentMethodInfo.update({ where: { id }, data: dto });
    await this.redis.del(CACHE_KEY);
    return result;
  }

  async remove(id: string) {
    const exists = await this.prisma.paymentMethodInfo.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException("Không tìm thấy");
    const result = await this.prisma.paymentMethodInfo.delete({ where: { id } });
    await this.redis.del(CACHE_KEY);
    return result;
  }
}
