import { create } from 'zustand';
import type { ChatMessage } from '@rag/shared';

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  conversationId: string | null;
  addMessage: (msg: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  setLastMessageSources: (sources: ChatMessage['sources']) => void;
  setStreaming: (v: boolean) => void;
  setConversationId: (id: string) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  conversationId: null,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') last.content = content;
      return { messages: msgs };
    }),

  setLastMessageSources: (sources) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant') last.sources = sources;
      return { messages: msgs };
    }),

  setStreaming: (v) => set({ isStreaming: v }),

  setConversationId: (id) => set({ conversationId: id }),

  clearMessages: () => set({ messages: [], conversationId: null }),
}));
