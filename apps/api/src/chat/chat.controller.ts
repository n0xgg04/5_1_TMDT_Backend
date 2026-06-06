import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("Chat")
@ApiBearerAuth()
@Controller({ path: "chat", version: "1" })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("conversation")
  @ApiOperation({ summary: "Lấy hoặc tạo conversation của customer" })
  getOrCreateConversation(
    @CurrentUser() user: { id: string },
    @Query("subject") subject?: string,
  ) {
    return this.chatService.getOrCreateConversation(user.id, subject);
  }

  @Post("conversation/:id/messages")
  @ApiOperation({ summary: "Gửi tin nhắn" })
  sendMessage(
    @Param("id") conversationId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: { content: string },
  ) {
    return this.chatService.sendMessage(conversationId, user.id, dto.content);
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
