import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { MessageSquare, FileText, Plus, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat.store';

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const clearMessages = useChatStore((s) => s.clearMessages);

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-bold tracking-tight">RAG System</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Document Q&A</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="p-3 space-y-1 flex-1">
        <NavLink
          to="/chat"
          onClick={onClose}
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
          onClick={onClose}
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

      <div className="p-3 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => { clearMessages(); onClose?.(); }}
        >
          <Plus className="w-4 h-4" />
          Nueva conversación
        </Button>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r bg-card flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/50 transition-opacity duration-200',
            sidebarOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-60 bg-card border-r flex flex-col transition-transform duration-200',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </aside>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-2 border-b px-3 py-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="-ml-1.5"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold">RAG System</span>
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
