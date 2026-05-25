'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/auth-context';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      toast.success('Login berhasil');
      router.push('/');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Username atau password salah';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen planner-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-primary rounded-2xl mb-4" aria-hidden="true">
            <Printer className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            MiPSys
          </h1>
          <p className="text-muted-foreground mt-2 font-medium text-sm">
            Manajemen Inventory & Service Printer
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="paper-card p-8 space-y-6"
        >
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="micro-label text-muted-foreground block"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-all"
              placeholder="admin"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="micro-label text-muted-foreground block"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-all"
              placeholder="admin123"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full h-12 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              'MASUK'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          Demo: admin / admin123
        </p>
      </div>
    </div>
  );
}
