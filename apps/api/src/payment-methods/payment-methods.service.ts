import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from "./payment-methods.dto";

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.paymentMethodInfo.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAllAdmin() {
    return this.prisma.paymentMethodInfo.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethodInfo.create({ data: dto });
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    const exists = await this.prisma.paymentMethodInfo.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException("Không tìm thấy");
    return this.prisma.paymentMethodInfo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const exists = await this.prisma.paymentMethodInfo.findUnique({
      where: { id },
    });
    if (!exists) throw new NotFoundException("Không tìm thấy");
    return this.prisma.paymentMethodInfo.delete({ where: { id } });
  }
}
