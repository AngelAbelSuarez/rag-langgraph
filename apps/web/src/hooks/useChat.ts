import { useCallback } from 'react';
import { useChatStore } from '../store/chat.store';
import { streamChat } from '../api/client';
import type { ChatMessage, SourceCitation } from '@rag/shared';

export function useChat() {
  const {
    messages,
    isStreaming,
    conversationId,
    addMessage,
    updateLastMessage,
    setLastMessageSources,
    setStreaming,
    setConversationId,
    clearMessages,
  } = useChatStore();

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        role: 'user',
        content: question,
        timestamp: new Date().toISOString(),
      };

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      addMessage(userMsg);
      setStreaming(true);

      // Delay adding assistant message so the store has user message first
      setTimeout(() => {
        addMessage(assistantMsg);
      }, 0);

      await streamChat(question, conversationId ?? undefined, {
        onToken: (token: string) => {
          updateLastMessage(token);
        },
        onSources: (sources: SourceCitation[]) => {
          setLastMessageSources(sources);
        },
        onDone: (newConversationId: string) => {
          setConversationId(newConversationId);
          setStreaming(false);
        },
        onError: (message: string) => {
          updateLastMessage(`Error: ${message}`);
          setStreaming(false);
        },
      });
    },
    [conversationId, isStreaming, addMessage, updateLastMessage, setLastMessageSources, setStreaming, setConversationId],
  );

  const newChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  return { messages, isStreaming, conversationId, sendMessage, newChat };
}
