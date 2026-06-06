import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CreateUserPaymentMethodDto,
  UpdateUserPaymentMethodDto,
} from "./user-payment-methods.dto";

@Injectable()
export class UserPaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.userPaymentMethod.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(userId: string, dto: CreateUserPaymentMethodDto) {
    if (dto.isDefault) {
      await this.prisma.userPaymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.userPaymentMethod.create({
      data: {
        userId,
        type: dto.type,
        label: dto.label,
        details: dto.details ?? {},
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateUserPaymentMethodDto) {
    const existing = await this.prisma.userPaymentMethod.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy phương thức");

    if (dto.isDefault) {
      await this.prisma.userPaymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.userPaymentMethod.update({
      where: { id },
      data: dto,
    });
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.userPaymentMethod.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy phương thức");
    return this.prisma.userPaymentMethod.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
