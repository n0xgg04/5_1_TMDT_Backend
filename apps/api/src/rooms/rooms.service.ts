import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreatePricingRuleDto,
} from "./dto/rooms.dto";

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoomType(dto: CreateRoomTypeDto) {
    return this.prisma.roomType.create({ data: dto });
  }

  async updateRoomType(id: string, dto: UpdateRoomTypeDto) {
    await this.findRoomTypeOrFail(id);
    return this.prisma.roomType.update({ where: { id }, data: dto });
  }

  async deleteRoomType(id: string) {
    await this.findRoomTypeOrFail(id);
    const activeBookings = await this.prisma.booking.count({
      where: {
        room: { roomTypeId: id },
        status: {
          in: [
            "PENDING_HOST_APPROVAL",
            "PENDING_PAYMENT",
            "PAYING",
            "PENDING_APPROVAL",
            "CONFIRMED",
            "CHECKED_IN",
          ],
        },
      },
    });
    if (activeBookings > 0) {
      throw new BadRequestException(
        "Không thể xóa loại phòng đang có đơn đặt phòng hoạt động",
      );
    }
    await this.prisma.roomType.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: "Đã vô hiệu hóa loại phòng" };
  }

  async listRoomTypes(includeInactive = false) {
    return this.prisma.roomType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        pricingRules: {
          where: { isActive: true },
          orderBy: { priority: "desc" },
        },
        _count: { select: { rooms: true } },
      },
    });
  }

  async getRoomType(id: string) {
    const rt = await this.prisma.roomType.findUnique({
      where: { id },
      include: { pricingRules: { where: { isActive: true } }, rooms: true },
    });
    if (!rt) throw new NotFoundException("Loại phòng không tồn tại");
    return rt;
  }

  async getRoomTypePublic(id: string, userId?: string, sessionId?: string) {
    const rt = await this.prisma.roomType.findUnique({
      where: { id, isActive: true },
      include: {
        pricingRules: { where: { isActive: true } },
        rooms: { include: { branch: true } },
        _count: { select: { rooms: true } },
      },
    });
    if (!rt) throw new NotFoundException("Loại phòng không tồn tại");

    const reviews = await this.prisma.review.findMany({
      where: { roomTypeId: id, isApproved: true },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const avgRating = await this.prisma.review.aggregate({
      where: { roomTypeId: id, isApproved: true },
      _avg: { rating: true },
    });

    const similar = await this.prisma.roomType.findMany({
      where: {
        id: { not: id },
        isActive: true,
        OR: [
          { starRating: (rt as any).starRating },
          {
            rooms: {
              some: {
                branch: {
                  province: rt.rooms[0]?.branch?.province,
                },
              },
            },
          },
        ],
      },
      include: {
        rooms: { include: { branch: true } },
        pricingRules: { where: { isActive: true } },
      },
      take: 3,
    });

    const isSaved = userId
      ? !!(await this.prisma.wishlist.findUnique({
          where: { userId_roomTypeId: { userId, roomTypeId: id } },
        }))
      : sessionId
        ? !!(await this.prisma.wishlist.findUnique({
            where: { sessionId_roomTypeId: { sessionId, roomTypeId: id } },
          }))
        : false;

    return {
      ...rt,
      reviews,
      avgRating: avgRating._avg.rating ?? 0,
      reviewCount: reviews.length,
      similarRooms: similar.map((s) => ({
        id: s.id,
        name: s.name,
        images: (s as any).images,
        pricePerNight: (s as any).pricingRules[0]?.pricePerNight ?? 0,
        branch: s.rooms[0]?.branch,
        starRating: (s as any).starRating ?? 3,
      })),
      isSaved,
    };
  }

  async getRoomTypeReviews(id: string) {
    const rt = await this.prisma.roomType.findUnique({ where: { id } });
    if (!rt) throw new NotFoundException("Loại phòng không tồn tại");
    const reviews = await this.prisma.review.findMany({
      where: { roomTypeId: id, isApproved: true },
      include: { customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
    const avgRating = await this.prisma.review.aggregate({
      where: { roomTypeId: id, isApproved: true },
      _avg: { rating: true },
    });
    return { reviews, avgRating: avgRating._avg.rating ?? 0 };
  }

  async createRoom(dto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({
      where: { roomNumber: dto.roomNumber },
    });
    if (existing) throw new ConflictException("Số phòng đã tồn tại");
    await this.findRoomTypeOrFail(dto.roomTypeId);
    return this.prisma.room.create({
      data: dto,
      include: { roomType: true, branch: true },
    });
  }

  async updateRoom(id: string, dto: UpdateRoomDto) {
    await this.findRoomOrFail(id);
    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: { roomType: true, branch: true },
    });
  }

  async deleteRoom(id: string) {
    await this.findRoomOrFail(id);
    const active = await this.prisma.booking.count({
      where: { roomId: id, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
    });
    if (active > 0)
      throw new BadRequestException("Phòng đang có khách, không thể xóa");
    await this.prisma.room.delete({ where: { id } });
    return { message: "Đã xóa phòng" };
  }

  async listRooms(
    roomTypeId?: string,
    floor?: number,
    branchId?: string,
    page?: number,
    limit?: number,
  ) {
    const where = {
      ...(roomTypeId && { roomTypeId }),
      ...(floor !== undefined && { floor }),
      ...(branchId && { branchId }),
    };

    if (page && limit) {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.prisma.room.findMany({
          where,
          skip,
          take: limit,
          include: { roomType: true, branch: true },
          orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
        }),
        this.prisma.room.count({ where }),
      ]);
      return { data: items, total, page, limit };
    }

    return this.prisma.room.findMany({
      where,
      include: { roomType: true, branch: true },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    });
  }

  async listBranches() {
    return this.prisma.hotelBranch.findMany({
      where: { isActive: true },
      orderBy: { province: "asc" },
    });
  }

  async createPricingRule(dto: CreatePricingRuleDto) {
    await this.findRoomTypeOrFail(dto.roomTypeId);
    return this.prisma.pricingRule.create({
      data: {
        roomTypeId: dto.roomTypeId,
        type: dto.type,
        pricePerNight: dto.pricePerNight,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        priority: dto.priority ?? 0,
      },
    });
  }

  async deletePricingRule(id: string) {
    const rule = await this.prisma.pricingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException("Quy tắc giá không tồn tại");
    await this.prisma.pricingRule.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: "Đã vô hiệu hóa quy tắc giá" };
  }

  private async findRoomTypeOrFail(id: string) {
    const rt = await this.prisma.roomType.findUnique({ where: { id } });
    if (!rt) throw new NotFoundException("Loại phòng không tồn tại");
    return rt;
  }

  private async findRoomOrFail(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException("Phòng không tồn tại");
    return room;
  }
}
