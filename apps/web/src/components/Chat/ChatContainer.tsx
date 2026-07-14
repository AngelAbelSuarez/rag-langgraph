import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '../../hooks/useChat';

export function ChatContainer() {
  const { messages, isStreaming, sendMessage } = useChat();

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b px-6 py-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Chat</h2>
      </header>
      <MessageList messages={messages} isStreaming={isStreaming} />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}