import { ConversationService } from './conversation.service';
import type { ChatMessage } from '@rag/shared';

describe('ConversationService', () => {
  let service: ConversationService;

  beforeEach(() => {
    service = new ConversationService();
  });

  it('should return empty history for unknown conversation', () => {
    expect(service.getHistory('nonexistent')).toEqual([]);
  });

  it('should create a conversation and return a uuid', () => {
    const id = service.createConversation();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should return empty history for newly created conversation', () => {
    const id = service.createConversation();
    expect(service.getHistory(id)).toEqual([]);
  });

  it('should add a message to an existing conversation', () => {
    const id = service.createConversation();
    const msg: ChatMessage = { role: 'user', content: 'Hello', timestamp: new Date().toISOString() };
    service.addMessage(id, msg);
    expect(service.getHistory(id)).toEqual([msg]);
  });

  it('should append messages to existing history', () => {
    const id = service.createConversation();
    const msg1: ChatMessage = { role: 'user', content: 'Hi', timestamp: 't1' };
    const msg2: ChatMessage = { role: 'assistant', content: 'Hello!', timestamp: 't2' };
    service.addMessage(id, msg1);
    service.addMessage(id, msg2);
    expect(service.getHistory(id)).toEqual([msg1, msg2]);
  });

  it('should create a new conversation when addMessage receives unknown id', () => {
    const msg: ChatMessage = { role: 'user', content: 'Test', timestamp: 't' };
    service.addMessage('unknown-id', msg);
    expect(service.getHistory('unknown-id')).toEqual([msg]);
  });
});
