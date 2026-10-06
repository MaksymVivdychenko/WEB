import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AutoBroadcastService } from './auto-broadcast.service';

@Module({
  providers: [ChatGateway, ChatService, AutoBroadcastService],
  exports: [ChatService, AutoBroadcastService],
})
export class ChatModule {}
