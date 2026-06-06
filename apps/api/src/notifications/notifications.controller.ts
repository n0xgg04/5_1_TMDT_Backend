import { Controller, Get, Param, Patch, Query, Sse } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { MessageEvent } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller({ path: "notifications", version: "1" })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get("me")
  @ApiOperation({ summary: "Danh sách thông báo của tôi" })
  listMine(
    @CurrentUser() user: { id: string },
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.notifications.listMine(user.id, +page, +limit);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Đánh dấu thông báo đã đọc" })
  markRead(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.notifications.markRead(id, user.id);
  }

  @Sse("stream")
  @ApiOperation({ summary: "Realtime stream thông báo của tôi" })
  stream(@CurrentUser() user: { id: string }): Observable<MessageEvent> {
    return this.notifications.streamForUser(user.id);
  }
}
