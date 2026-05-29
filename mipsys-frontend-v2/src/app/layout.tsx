import { SidebarProvider } from '@/src/components/layout/SidebarProvider';
import { AuthGuard } from '@/src/components/layout/AuthGuard';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/src/lib/auth-context';
import { IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from 'next/font/google';
import { ErrorBoundary } from '@/src/components/ui/error-boundary';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${fraunces.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'oklch(0.205 0.044 252 / 95%)',
                  color: 'oklch(0.94 0.034 88)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  border: '1px solid oklch(0.98 0.02 88 / 14%)',
                },
              }}
            />
            <SidebarProvider>
              <AuthGuard>
                <ErrorBoundary>
                  <main className="flex-1 overflow-y-auto planner-bg">
                    <div className="max-w-[1500px] mx-auto w-full px-4 py-6 md:px-8 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      {children}
                    </div>
                  </main>
                </ErrorBoundary>
              </AuthGuard>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
