'use client';

import { useState } from 'react';
import { Sidebar } from '@/src/components/layout/Sidebar';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen planner-bg text-foreground overflow-x-hidden">
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
