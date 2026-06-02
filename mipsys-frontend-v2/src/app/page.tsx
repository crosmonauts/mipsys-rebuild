'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Users,
  Package,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth-context';
import { srApi } from '@/src/features/service-request/api/sr-api';
import { toast } from 'react-hot-toast';
import { LoadingSkeleton } from '@/src/components/ui/loading-skeleton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inService: 0,
    awaitingParts: 0,
    ready: 0,
    closed: 0,
    cancelled: 0,
    customers: 0,
    technicians: 0,
  });

  const fetchData = async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        srApi.getActivities(),
        srApi.getDashboardStats(),
      ]);
      setActivities(logsData);
      setStats(statsData);
    } catch (error: any) {
      console.error(
        'Dashboard fetch error:',
        error.response?.data || error.message,
      );
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
        return (
          <CheckCircle2
            size={14}
            className="text-[var(--accent-foreground)]"
            aria-label="Status: Selesai"
          />
        );
      case 'SERVICE':
        return (
          <Clock
            size={14}
            className="text-[var(--primary-foreground)]"
            aria-label="Status: Dalam Servis"
          />
        );
      default:
        return (
          <AlertCircle
            size={14}
            className="text-[var(--chart-4)]"
            aria-label="Status: Pending"
          />
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="space-y-1.5 text-left">
        <h2 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">
          Selamat Datang, <span className="text-[var(--primary-foreground)]">{user?.username ?? 'User'}.</span>
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Sistem optimal. {stats.pending} tugas prioritas terdeteksi.
        </p>
      </section>

      {/* --- STATS GRID: TIGHTER CARDS --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
        <Card className="hover:border-[var(--primary)]/40 transition-all">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary-foreground)] rounded-xl group-hover/card:scale-105 transition-transform">
              <ClipboardList size={20} />
            </div>
            <span className="text-[9px] font-black bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1 rounded-full uppercase tracking-widest">
              Servis
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[var(--foreground)] tracking-tighter">
              {stats.total}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Total Antrean</p>
          </CardContent>
          <CardFooter className="justify-between text-[10px] font-black uppercase">
            <span className="text-[var(--chart-4)]">Pending: {stats.pending}</span>
            <span className="text-[var(--primary)]">Proses: {stats.inService}</span>
            <span className="text-[var(--accent)]">Selesai: {stats.ready}</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary-foreground)] rounded-xl w-fit">
              <Package size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[var(--foreground)] tracking-tighter">
              05
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Part Urgent</p>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2">
            <div className="w-full bg-[var(--muted)]/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full w-[60%]" />
            </div>
            <p className="text-[9px] text-[var(--muted-foreground)] font-black uppercase">
              3 Approval Manajer
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="p-2.5 bg-[var(--primary)]/10 text-[var(--primary-foreground)] rounded-xl w-fit">
              <Wallet size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-[var(--foreground)] tracking-tighter">
              82%
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Penagihan Selesai</p>
          </CardContent>
          <CardFooter>
            <p className="text-[10px] font-black text-[var(--accent)] flex items-center gap-1 uppercase tracking-tight bg-[var(--primary)]/10 w-fit px-2 py-0.5 rounded">
              <TrendingUp size={12} /> +5.2%
            </p>
          </CardFooter>
        </Card>

        <Card className="border-[var(--primary)]/30">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <Activity size={20} className="text-[var(--primary)]" />
            <div className="h-2 w-2 bg-[var(--accent)] rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--foreground)] tracking-tighter">
              99.9%
            </p>
            <p className="text-[10px] text-[var(--primary)]/40 font-black uppercase tracking-widest">
              Uptime
            </p>
          </CardContent>
          <CardFooter>
            <p className="text-[9px] text-[var(--accent)] font-black uppercase tracking-widest border border-[var(--accent)]/30 w-fit px-2 py-0.5 rounded bg-[var(--accent)]/5">
              DB: Terhubung
            </p>
          </CardFooter>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <History size={16} />
              Aktivitas Terkini
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled
              onClick={() => console.log('Fitur menyusul')}
            >
              Log Lengkap
            </Button>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <LoadingSkeleton variant="text" className="w-12 h-4" />
                    <LoadingSkeleton variant="avatar" className="w-8 h-8" />
                    <LoadingSkeleton variant="text" className="flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Tugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((log: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-[10px] font-bold">
                        {log.time}
                      </TableCell>
                      <TableCell>{getIcon(log.status)}</TableCell>
                      <TableCell className="font-bold text-xs uppercase tracking-tight">
                        {log.user}
                      </TableCell>
                      <TableCell className="text-[var(--muted-foreground)] italic text-xs">
                        {log.task}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-[var(--muted)]/50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users size={20} className="text-[var(--primary-foreground)]" />
            </div>
            <CardTitle>Database Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--muted)]/30 p-3 rounded-xl text-center">
                <p className="text-2xl font-bold text-[var(--foreground)] tracking-tighter">
                  {stats.customers}
                </p>
                <p className="text-[9px] font-black text-[var(--muted-foreground)] uppercase mt-1">
                  Pelanggan
                </p>
              </div>
              <div className="bg-[var(--muted)]/30 p-3 rounded-xl text-center">
                <p className="text-2xl font-bold text-[var(--foreground)] tracking-tighter">
                  {stats.technicians}
                </p>
                <p className="text-[9px] font-black text-[var(--muted-foreground)] uppercase mt-1">
                  Teknisi
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled
              onClick={() => console.log('Fitur menyusul')}
            >
              Kelola Database
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* --- FOOTER: MINIMALIST --- */}
      <footer className="pt-8 border-[var(--border)] border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center md:text-left">
        <div className="flex items-center gap-2">
          <Globe size={12} className="text-[var(--primary-foreground)]" /> Semarang, Indonesia
        </div>
        <p className="text-[var(--muted-foreground)]">
          © 2026 PT Mitrainfoparama — V2.1.0-AAA
        </p>
      </footer>
    </div>
  );
}
