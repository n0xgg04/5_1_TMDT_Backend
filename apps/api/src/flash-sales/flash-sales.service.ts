import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class FlashSalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    const now = new Date();
    return this.prisma.flashSale.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        quantity: { gt: this.prisma.flashSale.fields.soldCount },
      },
      include: { roomType: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async calculateFlashSalePrice(roomTypeId: string, basePrice: number) {
    const now = new Date();
    const flashSale = await this.prisma.flashSale.findFirst({
      where: {
        roomTypeId: roomTypeId ?? null,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!flashSale) return { price: basePrice, flashSaleId: null };

    const discount = (basePrice * Number(flashSale.discount)) / 100;
    return {
      price: Math.max(0, basePrice - discount),
      flashSaleId: flashSale.id,
      discount: flashSale.discount,
    };
  }

  async incrementSold(flashSaleId: string) {
    return this.prisma.flashSale.update({
      where: { id: flashSaleId },
      data: { soldCount: { increment: 1 } },
    });
  }
}
