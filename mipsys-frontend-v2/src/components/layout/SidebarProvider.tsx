'use client';

import { useState } from 'react';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Menu } from 'lucide-react';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen planner-bg text-foreground overflow-x-hidden">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-sidebar-bg text-sidebar-foreground shadow-lg border border-white/5"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? 'Tutup menu' : 'Buka menu'}
      >
        <Menu size={20} />
      </button>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col w-full min-w-0">
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
