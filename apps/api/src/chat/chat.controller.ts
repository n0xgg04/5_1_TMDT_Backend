import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Sse,
  MessageEvent,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { ChatService } from "./chat.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("Chat")
@ApiBearerAuth()
@Controller({ path: "chat", version: "1" })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Sse("stream")
  @ApiOperation({ summary: "Realtime stream tin nhắn chat" })
  stream(
    @CurrentUser() user: { id: string; role: Role },
  ): Observable<MessageEvent> {
    return this.chatService.streamForUser(user);
  }

  @Get("conversation")
  @ApiOperation({ summary: "Lấy hoặc tạo conversation của customer" })
  getOrCreateConversation(
    @CurrentUser() user: { id: string },
    @Query("subject") subject?: string,
  ) {
    return this.chatService.getOrCreateConversation(user.id, subject);
  }

  @Get("conversation/booking/:bookingId")
  @ApiOperation({ summary: "Lấy hoặc tạo conversation theo booking chờ duyệt" })
  getOrCreateBookingConversation(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.getOrCreateBookingConversation(user.id, bookingId);
  }

  @Post("conversation/:id/messages")
  @ApiOperation({ summary: "Gửi tin nhắn" })
  sendMessage(
    @Param("id") conversationId: string,
    @CurrentUser() user: { id: string; role: Role },
    @Body() dto: { content: string },
  ) {
    return this.chatService.sendMessage(conversationId, user, dto.content);
  }

  @Get("staff/conversations")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Lấy danh sách conversation (staff/admin)" })
  getConversationsForStaff(@Query("status") status?: string) {
    return this.chatService.getConversationsForStaff(status);
  }

  @Get("staff/conversations/:id")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Lấy chi tiết conversation (staff/admin)" })
  getConversation(@Param("id") id: string) {
    return this.chatService.getConversation(id);
  }

  @Post("staff/bookings/:bookingId/conversation")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Mở chat theo booking đang chờ duyệt" })
  getOrCreateStaffBookingConversation(
    @Param("bookingId") bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.getOrCreateStaffBookingConversation(
      user.id,
      bookingId,
    );
  }

  @Post("staff/conversations/:id/assign")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Assign staff vào conversation" })
  assignStaff(
    @Param("id") conversationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.chatService.assignStaff(conversationId, user.id);
  }

  @Post("staff/conversations/:id/resolve")
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiOperation({ summary: "Đánh dấu conversation đã giải quyết" })
  markAsResolved(@Param("id") conversationId: string) {
    return this.chatService.markAsResolved(conversationId);
  }
}
