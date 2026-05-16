import { SidebarProvider } from '@/src/components/layout/SidebarProvider';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
