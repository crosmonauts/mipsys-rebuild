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
import { srApi } from '@/src/features/service-request/services/sr-api';
import { toast } from 'react-hot-toast';
import { LoadingSkeleton } from '@/src/components/ui/loading-skeleton';

export default function DashboardPage() {
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
      console.error('Dashboard fetch error:', error.response?.data || error.message);
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
        return <CheckCircle2 size={14} className="text-accent" aria-label="Status: Selesai" />;
      case 'SERVICE':
        return <Clock size={14} className="text-primary" aria-label="Status: Dalam Servis" />;
      default:
        return <AlertCircle size={14} className="text-amber-400" aria-label="Status: Pending" />;
    }
  };

  return (
    /* Container dikurangi paddingnya agar tidak terlalu banyak whitespace terbuang */
    <main className="planner-bg min-h-screen">
    <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER: COMPACT & PROFESSIONAL --- */}
      <section className="space-y-1.5 text-left">
        <div className="flex items-center gap-2 w-fit px-2.5 py-0.5 bg-primary/20 text-primary rounded text-[9px] font-black uppercase tracking-widest border border-primary/30">
          <ShieldCheck size={10} /> Keamanan Terverifikasi
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
          Selamat Datang, <span className="text-primary">Mas Nanda.</span>
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground font-bold italic tracking-tight">
          "Sistem optimal. {stats.pending} tugas prioritas terdeteksi."
        </p>
      </section>

      {/* --- STATS GRID: TIGHTER CARDS --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
        {/* Service Card - Rounding dikurangi ke 2xl agar lebih formal */}
        <article className="paper-card p-6 hover:border-primary/40 transition-all group flex flex-col justify-between min-h-40">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:scale-105 transition-transform">
              <ClipboardList size={20} />
            </div>
            <span className="text-[9px] font-black bg-primary text-primary-foreground px-3 py-1 rounded-full uppercase tracking-widest">
              Servis
            </span>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-black text-foreground tracking-tighter">
              {stats.total}
            </p>
            <p className="micro-label text-muted-foreground">
              Total Antrean
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-border/10 flex justify-between text-[10px] font-black uppercase">
            <span className="text-amber-400">Pending: {stats.pending}</span>
            <span className="text-blue-400">Proses: {stats.inService}</span>
            <span className="text-emerald-400">Selesai: {stats.ready}</span>
          </div>
        </article>

        {/* Inventory Card */}
        <article className="paper-card p-6 min-h-40 flex flex-col justify-between">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl w-fit">
            <Package size={20} />
          </div>
          <div>
            <p className="text-4xl font-black text-foreground tracking-tighter">
              05
            </p>
            <p className="micro-label text-muted-foreground">
              Part Urgent
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full w-[60%]" />
            </div>
            <p className="text-[9px] text-muted-foreground font-black uppercase">
              3 Approval Manajer
            </p>
          </div>
        </article>

        {/* Finance Card */}
        <article className="paper-card p-6 min-h-40 flex flex-col justify-between">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl w-fit">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-4xl font-black text-foreground tracking-tighter">
              82%
            </p>
            <p className="micro-label text-muted-foreground">
              Penagihan Selesai
            </p>
          </div>
          <p className="mt-4 text-[10px] font-black text-emerald-400 flex items-center gap-1 uppercase tracking-tight bg-primary/10 w-fit px-2 py-0.5 rounded">
            <TrendingUp size={12} /> +5.2%
          </p>
        </article>

        {/* System Health Card */}
        <article className="bg-[#020617] text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden border border-blue-900/30">
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-blue-400" />
            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
          </div>
          <div>
            <p className="text-3xl font-black italic tracking-tighter">99.9%</p>
            <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest">
              Uptime
            </p>
          </div>
          <p className="mt-4 text-[9px] text-emerald-400 font-black uppercase tracking-widest border border-emerald-400/30 w-fit px-2 py-0.5 rounded bg-emerald-400/5">
            DB: Terhubung
          </p>
        </article>
      </section>

      {/* --- LOWER SECTION: BALANCED SPACING --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* AKTIVITAS TERKINI */}
        <div className="lg:col-span-2 bg-card border border-border/20 rounded-2xl p-7">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <History size={20} className="text-foreground" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
                Aktivitas Terkini
              </h3>
            </div>
            <button className="text-[10px] font-black text-primary hover:text-primary/80 underline uppercase tracking-widest">
              Log Lengkap
            </button>
          </div>

          <div className="space-y-5">
            {loadingLogs ? (
              <div className="space-y-5 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-5">
                    <LoadingSkeleton variant="text" className="w-12 h-4" />
                    <LoadingSkeleton variant="avatar" className="w-10 h-10" />
                    <LoadingSkeleton variant="text" className="flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              activities.map((log: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-5 group animate-in slide-in-from-left-4 duration-500"
                >
                  <span className="text-foreground font-mono w-12 text-[10px] font-black border-r border-border/10">
                    {log.time}
                  </span>
                  <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 transition-colors border border-transparent">
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-foreground mr-2 uppercase tracking-tight text-[11px]">
                      {log.user}
                    </span>
                    <span className="text-muted-foreground italic truncate block md:inline font-bold text-[11px]">
                      "{log.task}"
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DATABASE OVERVIEW */}
        <div className="bg-muted/30 border border-border/20 border-dashed rounded-2xl p-7 flex flex-col justify-center items-center text-center">
          <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center border border-border/20 mb-5">
            <Users size={24} className="text-primary" />
          </div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-tighter mb-1">
            Database Overview
          </h3>
          <p className="text-[9px] text-muted-foreground font-black mb-6 uppercase tracking-widest">
            Data Terpusat
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-card p-4 rounded-xl border border-border/20">
              <p className="text-2xl font-black text-foreground tracking-tighter">
                {stats.customers}
              </p>
              <p className="text-[9px] font-black text-muted-foreground uppercase mt-1">
                Pelanggan
              </p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border/20">
              <p className="text-2xl font-black text-foreground tracking-tighter">
                {stats.technicians}
              </p>
              <p className="text-[9px] font-black text-muted-foreground uppercase mt-1">
                Teknisi
              </p>
            </div>
          </div>

          <button className="mt-8 w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-lg active:scale-95">
            Kelola Database
          </button>
        </div>
      </section>

      {/* --- FOOTER: MINIMALIST --- */}
      <footer className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center md:text-left">
        <div className="flex items-center gap-2">
          <Globe size={12} className="text-primary" /> Semarang, Indonesia
        </div>
        <p className="text-muted-foreground">© 2026 PT Mitrainfoparama — V2.1.0-AAA</p>
      </footer>
    </div>
    </main>
  );
}
