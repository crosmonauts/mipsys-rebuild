'use client';

import { useState } from 'react';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Search, Bell, Menu } from 'lucide-react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="id">
      <body>
        <div className="flex min-h-screen bg-[#f8fafc] text-[#121212] overflow-x-hidden">
          {/* Sidebar Global */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col w-full min-w-0">
            {/* Konten Halaman */}
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
