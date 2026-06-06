import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { AvailabilityService } from "./availability.service";

@ApiTags("Availability")
@Controller({ path: "availability", version: "1" })
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Public()
  @Get("room")
  @ApiOperation({ summary: "Lịch trống/bận public theo phòng" })
  @ApiQuery({ name: "roomId", required: true })
  @ApiQuery({ name: "from", required: true, example: "2026-06-01" })
  @ApiQuery({ name: "to", required: true, example: "2026-06-30" })
  getRoomAvailability(
    @Query("roomId") roomId: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    if (!roomId) throw new BadRequestException("Thiếu mã phòng");
    if (!from || !to) throw new BadRequestException("Thiếu khoảng ngày");
    return this.availability.getRoomCalendar(roomId, from, to);
  }

  @Public()
  @Get("room-type")
  @ApiOperation({ summary: "Lịch trống/bận public theo loại phòng" })
  @ApiQuery({ name: "roomTypeId", required: true })
  @ApiQuery({ name: "from", required: true, example: "2026-06-01" })
  @ApiQuery({ name: "to", required: true, example: "2026-06-30" })
  getRoomTypeAvailability(
    @Query("roomTypeId") roomTypeId: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    if (!roomTypeId) throw new BadRequestException("Thiếu mã loại phòng");
    if (!from || !to) throw new BadRequestException("Thiếu khoảng ngày");
    return this.availability.getRoomTypeCalendar(roomTypeId, from, to);
  }

  @Public()
  @Get("check")
  @ApiOperation({ summary: "Kiểm tra khoảng ngày có thể đặt cho phòng" })
  @ApiQuery({ name: "roomId", required: true })
  @ApiQuery({ name: "from", required: true, example: "2026-06-01" })
  @ApiQuery({ name: "to", required: true, example: "2026-06-04" })
  checkRange(
    @Query("roomId") roomId: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    if (!roomId) throw new BadRequestException("Thiếu mã phòng");
    if (!from || !to) throw new BadRequestException("Thiếu khoảng ngày");
    return this.availability.checkRoomRange(roomId, from, to);
  }
}
