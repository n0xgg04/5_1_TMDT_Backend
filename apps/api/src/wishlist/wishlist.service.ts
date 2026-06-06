import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    userId: string | undefined,
    sessionId: string | undefined,
    roomTypeId: string,
  ) {
    if (!userId && !sessionId) {
      throw new NotFoundException("Thiếu userId hoặc sessionId");
    }
    const rt = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!rt) throw new NotFoundException("Loại phòng không tồn tại");

    if (userId) {
      return this.prisma.wishlist.upsert({
        where: { userId_roomTypeId: { userId, roomTypeId } },
        create: { userId, roomTypeId },
        update: {},
      });
    }
    return this.prisma.wishlist.upsert({
      where: { sessionId_roomTypeId: { sessionId: sessionId!, roomTypeId } },
      create: { sessionId: sessionId!, roomTypeId },
      update: {},
    });
  }

  async remove(
    userId: string | undefined,
    sessionId: string | undefined,
    roomTypeId: string,
  ) {
    if (userId) {
      await this.prisma.wishlist.deleteMany({
        where: { userId, roomTypeId },
      });
    } else if (sessionId) {
      await this.prisma.wishlist.deleteMany({
        where: { sessionId, roomTypeId },
      });
    }
    return { message: "Đã xóa" };
  }

  async list(userId: string | undefined, sessionId: string | undefined) {
    const where = userId ? { userId } : { sessionId: sessionId! };
    const items = await this.prisma.wishlist.findMany({
      where: where as any,
      include: {
        roomType: {
          include: {
            rooms: { include: { branch: true } },
            pricingRules: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return items.map((w) => ({
      id: w.id,
      roomTypeId: w.roomTypeId,
      roomType: {
        id: w.roomType.id,
        name: w.roomType.name,
        images: (w.roomType as any).images,
        starRating: (w.roomType as any).starRating ?? 3,
        maxGuests: w.roomType.maxGuests,
        bedType: w.roomType.bedType,
        amenities: (w.roomType as any).amenities,
        pricePerNight: (w.roomType as any).pricingRules[0]?.pricePerNight ?? 0,
        branch: w.roomType.rooms[0]?.branch,
      },
    }));
  }

  async sync(sessionId: string, userId: string) {
    const sessionItems = await this.prisma.wishlist.findMany({
      where: { sessionId },
    });
    for (const item of sessionItems) {
      await this.prisma.wishlist.upsert({
        where: { userId_roomTypeId: { userId, roomTypeId: item.roomTypeId } },
        create: { userId, roomTypeId: item.roomTypeId },
        update: {},
      });
    }
    await this.prisma.wishlist.deleteMany({ where: { sessionId } });
    return { message: "Đã đồng bộ" };
  }
}
