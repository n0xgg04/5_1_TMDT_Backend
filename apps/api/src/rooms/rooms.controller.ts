import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { RoomsService } from "./rooms.service";
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  CreateRoomDto,
  UpdateRoomDto,
  CreatePricingRuleDto,
} from "./dto/rooms.dto";
import { Roles } from "../common/decorators/roles.decorator";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Rooms")
@ApiBearerAuth()
@Controller({ path: "rooms", version: "1" })
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get("types")
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: "Danh sách loại phòng" })
  listRoomTypes(@Query("includeInactive") includeInactive?: string) {
    return this.roomsService.listRoomTypes(includeInactive === "true");
  }

  @Post("types")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Tạo loại phòng (Admin)" })
  createRoomType(@Body() dto: CreateRoomTypeDto) {
    return this.roomsService.createRoomType(dto);
  }

  @Get("types/:id")
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: "Chi tiết loại phòng" })
  getRoomType(@Param("id") id: string) {
    return this.roomsService.getRoomType(id);
  }

  @Public()
  @Get("types/:id/public")
  @ApiOperation({ summary: "Chi tiết loại phòng (public)" })
  getRoomTypePublic(
    @Param("id") id: string,
    @CurrentUser() user?: { id: string },
    @Headers("x-session-id") sessionId?: string,
  ) {
    return this.roomsService.getRoomTypePublic(id, user?.id, sessionId);
  }

  @Public()
  @Get("types/:id/reviews")
  @ApiOperation({ summary: "Đánh giá phòng" })
  getRoomTypeReviews(@Param("id") id: string) {
    return this.roomsService.getRoomTypeReviews(id);
  }

  @Patch("types/:id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Cập nhật loại phòng (Admin)" })
  updateRoomType(@Param("id") id: string, @Body() dto: UpdateRoomTypeDto) {
    return this.roomsService.updateRoomType(id, dto);
  }

  @Delete("types/:id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Xóa loại phòng (Admin)" })
  deleteRoomType(@Param("id") id: string) {
    return this.roomsService.deleteRoomType(id);
  }

  @Get("branches")
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: "Danh sách chi nhánh" })
  listBranches() {
    return this.roomsService.listBranches();
  }

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.HOUSEKEEPING)
  @ApiOperation({ summary: "Danh sách phòng" })
  listRooms(
    @Query("roomTypeId") roomTypeId?: string,
    @Query("floor") floor?: string,
    @Query("branchId") branchId?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.roomsService.listRooms(
      roomTypeId,
      floor !== undefined ? +floor : undefined,
      branchId,
      page !== undefined ? +page : undefined,
      limit !== undefined ? +limit : undefined,
    );
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Tạo phòng (Admin)" })
  createRoom(@Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(dto);
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.HOUSEKEEPING)
  @ApiOperation({ summary: "Cập nhật trạng thái phòng" })
  updateRoom(@Param("id") id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.updateRoom(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Xóa phòng (Admin)" })
  deleteRoom(@Param("id") id: string) {
    return this.roomsService.deleteRoom(id);
  }

  @Post("pricing")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Tạo quy tắc giá (Admin)" })
  createPricingRule(@Body() dto: CreatePricingRuleDto) {
    return this.roomsService.createPricingRule(dto);
  }

  @Delete("pricing/:id")
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Xóa quy tắc giá (Admin)" })
  deletePricingRule(@Param("id") id: string) {
    return this.roomsService.deletePricingRule(id);
  }
}
