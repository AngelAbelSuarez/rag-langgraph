import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '../ui/scroll-area';
import type { ChatMessage } from '@rag/shared';

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageSquareIcon />
          <p className="text-sm mt-3">No hay mensajes todavía.</p>
          <p className="text-xs mt-1">Hacé una pregunta sobre tus documentos.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg, i) => (
          <MessageBubble key={`${msg.timestamp}-${i}`} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

function MessageSquareIcon() {
  return (
    <svg className="w-12 h-12 mx-auto text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}