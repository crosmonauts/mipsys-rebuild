'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Menu } from 'lucide-react';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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

      {children}
    </div>
  );
}
