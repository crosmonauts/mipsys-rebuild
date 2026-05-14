'use client';

import { useState } from 'react';
import { Sidebar } from '@/src/components/layout/Sidebar';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="id">
      <body>
        <Toaster
          position="top-right" // Posisi notifikasi
          reverseOrder={false}
          toastOptions={{
            // Styling standar agar sesuai brand MIPSYS
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
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
