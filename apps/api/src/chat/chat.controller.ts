import { Controller, Post, Body, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatService } from './chat.service.js';
import { ChatRequestDto } from './dto/chat-request.dto.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @Sse()
  stream(@Body() body: ChatRequestDto): Observable<MessageEvent> {
    return this.chatService.handleMessage(body.question, body.conversationId);
  }
}
