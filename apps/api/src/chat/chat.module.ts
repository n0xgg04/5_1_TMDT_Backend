import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatRealtimeService } from "./chat-realtime.service";

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRealtimeService],
})
export class ChatModule {}
