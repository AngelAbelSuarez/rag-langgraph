import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ChatMessage } from '@rag/shared';

@Injectable()
export class ConversationService {
  private readonly conversations = new Map<string, ChatMessage[]>();

  getHistory(conversationId: string): ChatMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  addMessage(conversationId: string, message: ChatMessage): void {
    const history = this.conversations.get(conversationId);
    if (history) {
      history.push(message);
    } else {
      this.conversations.set(conversationId, [message]);
    }
  }

  createConversation(): string {
    const id = randomUUID();
    this.conversations.set(id, []);
    return id;
  }
}
