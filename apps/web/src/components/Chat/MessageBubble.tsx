import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@rag/shared';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card text-card-foreground border rounded-bl-md',
        )}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderContent(message.content)}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <button
              onClick={() => setShowSources(!showSources)}
              className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
            >
              Sources ({message.sources.length})
              <ChevronDown className={cn('w-3 h-3 transition-transform', showSources && 'rotate-180')} />
            </button>

            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((src, i) => (
                  <Card key={i} className="p-2.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground truncate">{src.documentName}</span>
                      <Badge variant="outline" className="shrink-0 ml-2 text-[10px]">
                        {Math.round(src.relevance * 100)}%
                      </Badge>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">&ldquo;{src.content}&rdquo;</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function renderContent(content: string) {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const withBreaks = escaped.replace(/\n/g, '<br/>');
  const withBold = withBreaks.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  return <span dangerouslySetInnerHTML={{ __html: withBold }} />;
}