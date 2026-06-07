import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { RedisService } from "../common/redis/redis.service";
import { PricingService } from "../rooms/pricing.service";
import { AvailabilityService } from "../availability/availability.service";

export interface SearchParams {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomTypeId?: string;
  province?: string;
  maxPrice?: number;
  minPrice?: number;
  amenities?: string[];
  starRating?: number;
  sortBy?: "price_asc" | "price_desc" | "rating_desc";
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly pricingService: PricingService,
    private readonly availability: AvailabilityService,
  ) {}

  async searchAvailableRooms(params: SearchParams) {
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* stale cache, refetch */ }
    }

    const checkIn = new Date(params.checkIn);
    const checkOut = new Date(params.checkOut);

    const bookedRoomIds = await this.availability.getBookedRoomIds(
      checkIn,
      checkOut,
    );

    const rooms = await this.prisma.room.findMany({
      where: {
        status: { in: ["AVAILABLE", "DIRTY"] },
        id: { notIn: bookedRoomIds },
        ...(params.province && {
          branch: {
            province: { equals: params.province, mode: "insensitive" },
          },
        }),
        roomType: {
          isActive: true,
          maxGuests: { gte: params.guests },
          ...(params.roomTypeId && { id: params.roomTypeId }),
        },
      },
      include: {
        roomType: true,
        branch: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true,
            address: true,
          },
        },
      },
    });

    const priceCache = new Map<
      string,
      { totalPrice: number; nights: number; pricePerNight: number }
    >();
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    const results = [];

    for (const room of rooms) {
      const roomType = room.roomType;

      if (params.amenities && params.amenities.length > 0) {
        const rtAmenities = (roomType.amenities as string[]) ?? [];
        const hasAll = params.amenities.every((a) =>
          rtAmenities.some((ra) => ra.toLowerCase().includes(a.toLowerCase())),
        );
        if (!hasAll) continue;
      }

      if (
        params.starRating !== undefined &&
        (roomType as any).starRating !== params.starRating
      ) {
        continue;
      }

      let priceInfo = priceCache.get(roomType.id);
      if (!priceInfo) {
        try {
          const totalPrice = await this.pricingService.calculateTotalPrice(
            roomType.id,
            checkIn,
            checkOut,
          );
          priceInfo = {
            totalPrice,
            nights,
            pricePerNight: totalPrice / nights,
          };
          priceCache.set(roomType.id, priceInfo);
        } catch {
          continue;
        }
      }

      if (
        params.minPrice !== undefined &&
        priceInfo.pricePerNight < params.minPrice
      )
        continue;
      if (
        params.maxPrice !== undefined &&
        priceInfo.pricePerNight > params.maxPrice
      )
        continue;

      results.push({
        room: {
          id: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
        },
        roomType: {
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          maxGuests: roomType.maxGuests,
          areaSqm: roomType.areaSqm,
          bedType: roomType.bedType,
          amenities: roomType.amenities,
          images: roomType.images,
          starRating: (roomType as any).starRating ?? 3,
        },
        branch: room.branch,
        pricePerNight: priceInfo.pricePerNight,
        totalPrice: priceInfo.totalPrice,
        nights: priceInfo.nights,
      });
    }

    if (params.sortBy) {
      const [field, dir] = params.sortBy.split("_") as [string, string];
      results.sort((a: any, b: any) => {
        let diff = 0;
        if (field === "price") diff = a.pricePerNight - b.pricePerNight;
        if (field === "rating")
          diff = (a.roomType.starRating ?? 3) - (b.roomType.starRating ?? 3);
        return dir === "asc" ? diff : -diff;
      });
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const total = results.length;
    const paginated = results.slice((page - 1) * limit, page * limit);

    const output = { data: paginated, total, page, limit };
    await this.redis.set(cacheKey, JSON.stringify(output), 60);
    return output;
  }

  async getProvinces() {
    const cacheKey = "provinces";
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* stale cache, refetch */ }
    }

    const branches = await this.prisma.hotelBranch.findMany({
      where: { isActive: true },
      orderBy: { province: "asc" },
    });
    const seen = new Set<string>();
    const result: string[] = [];
    for (const b of branches) {
      if (!seen.has(b.province)) {
        seen.add(b.province);
        result.push(b.province);
      }
    }
    await this.redis.set(cacheKey, JSON.stringify(result), 3600);
    return result;
  }

  async getFeaturedRooms() {
    const cacheKey = "featured-rooms";
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* stale cache, refetch */ }
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: { isActive: true },
      include: {
        rooms: { include: { branch: true } },
        pricingRules: {
          where: { isActive: true },
          orderBy: { priority: "desc" },
        },
        _count: { select: { rooms: true } },
      },
      take: 6,
    });
    const result = roomTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      description: rt.description,
      images: rt.images,
      areaSqm: rt.areaSqm,
      bedType: rt.bedType,
      maxGuests: rt.maxGuests,
      pricePerNight: rt.pricingRules[0]?.pricePerNight ?? 0,
      branch: rt.rooms[0]?.branch,
    }));
    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getFlashSales() {
    const cacheKey = "flash-sales";
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* stale cache, refetch */ }
    }

    const now = new Date();
    const flashSales = await this.prisma.flashSale.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      include: { roomType: true },
      take: 4,
    });
    const result = flashSales.map((fs) => ({
      id: fs.id,
      roomTypeId: fs.roomTypeId,
      roomTypeName: fs.roomType?.name,
      roomTypeImages: fs.roomType?.images,
      discount: fs.discount,
      startDate: fs.startDate,
      endDate: fs.endDate,
      quantity: fs.quantity,
      soldCount: fs.soldCount,
    }));
    await this.redis.set(cacheKey, JSON.stringify(result), 60);
    return result;
  }

}
