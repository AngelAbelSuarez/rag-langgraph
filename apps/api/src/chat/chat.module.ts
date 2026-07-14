import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ConversationService } from './conversation.service.js';

@Module({
  imports: [RagModule],
  controllers: [ChatController],
  providers: [ChatService, ConversationService],
  exports: [ChatService],
})
export class ChatModule {}
