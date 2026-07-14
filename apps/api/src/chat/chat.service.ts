import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RagService } from '../rag/rag.service.js';
import { ConversationService } from './conversation.service.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly ragService: RagService,
    private readonly conversationService: ConversationService,
  ) {}

  handleMessage(question: string, conversationId?: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          const convId = conversationId ?? this.conversationService.createConversation();

          const history = this.conversationService.getHistory(convId);
          const contextQuestion = history.length > 0
            ? this.buildContextualQuestion(question, history)
            : question;

          let lastAnswer = '';

          for await (const chunk of this.ragService.answerStream(contextQuestion, convId)) {
            const token = chunk.answer.slice(lastAnswer.length);
            if (token) {
              lastAnswer = chunk.answer;
              subscriber.next({ data: { token }, type: 'token' } as MessageEvent);
            }
          }

          this.conversationService.addMessage(convId, {
            role: 'user',
            content: question,
            timestamp: new Date().toISOString(),
          });

          this.conversationService.addMessage(convId, {
            role: 'assistant',
            content: lastAnswer,
            timestamp: new Date().toISOString(),
          });

          subscriber.next({ data: { type: 'done', conversationId: convId }, type: 'done' } as MessageEvent);
          subscriber.complete();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          subscriber.next({ data: { type: 'error', message }, type: 'error' } as MessageEvent);
          subscriber.error(error);
        }
      })();
    });
  }

  private buildContextualQuestion(question: string, history: { role: string; content: string }[]): string {
    const context = history
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    return `[Context]\n${context}\n\n[Question]\n${question}`;
  }
}
