import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, FileText, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat.store';

export function Layout() {
  const clearMessages = useChatStore((s) => s.clearMessages);

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold tracking-tight">RAG System</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Document Q&A</p>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </NavLink>
          <NavLink
            to="/documents"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <FileText className="w-4 h-4" />
            Documentos
          </NavLink>
        </nav>

        <div className="p-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={clearMessages}
          >
            <Plus className="w-4 h-4" />
            Nueva conversación
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}