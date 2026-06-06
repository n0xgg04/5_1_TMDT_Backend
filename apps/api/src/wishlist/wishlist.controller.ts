import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { WishlistService } from "./wishlist.service";
import { SaveWishlistDto, SyncWishlistDto } from "./wishlist.dto";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Wishlist")
@ApiBearerAuth()
@Controller({ path: "wishlist", version: "1" })
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Danh sách phòng đã lưu" })
  list(
    @CurrentUser() user?: { id: string },
    @Headers("x-session-id") sessionId?: string,
  ) {
    return this.wishlistService.list(user?.id, sessionId);
  }

  @Post()
  @ApiOperation({ summary: "Lưu phòng" })
  save(
    @Body() dto: SaveWishlistDto,
    @CurrentUser() user?: { id: string },
    @Headers("x-session-id") sessionId?: string,
  ) {
    return this.wishlistService.save(user?.id, sessionId, dto.roomTypeId);
  }

  @Delete(":roomTypeId")
  @ApiOperation({ summary: "Xóa phòng đã lưu" })
  remove(
    @Param("roomTypeId") roomTypeId: string,
    @CurrentUser() user?: { id: string },
    @Headers("x-session-id") sessionId?: string,
  ) {
    return this.wishlistService.remove(user?.id, sessionId, roomTypeId);
  }

  @Post("sync")
  @ApiOperation({ summary: "Đồng bộ wishlist từ session vào user" })
  sync(@Body() dto: SyncWishlistDto, @CurrentUser() user: { id: string }) {
    return this.wishlistService.sync(dto.sessionId, user.id);
  }
}
