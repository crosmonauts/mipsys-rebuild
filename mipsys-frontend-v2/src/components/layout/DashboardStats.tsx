import React from 'react';
import {
  ClipboardList,
  Package,
  Wallet,
  Activity,
  ShieldCheck,
  Users,
  TrendingUp,
} from 'lucide-react';

interface DashboardStats {
  total: number;
  pending: number;
  proses: number;
  selesai: number;
  customers: number;
  technicians: number;
  urgentParts: number;
  billingPercentage: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
      <ServiceCard stats={stats} />
      <InventoryCard urgentParts={stats.urgentParts} />
      <FinanceCard billingPercentage={stats.billingPercentage} />
      <SystemHealthCard />
    </section>
  );
}

function ServiceCard({ stats }: { stats: DashboardStats }) {
  return (
    <article className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:border-blue-400 transition-all group flex flex-col justify-between min-h-40">
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl group-hover:scale-105 transition-transform">
          <ClipboardList size={20} />
        </div>
        <span className="text-[9px] font-black bg-blue-700 text-white px-3 py-1 rounded-full uppercase tracking-widest">
          Servis
        </span>
      </div>
      <div className="mt-4">
        <p className="text-4xl font-black text-slate-950 tracking-tighter">
          {stats.total}
        </p>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Total Antrean
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-black uppercase">
        <span className="text-amber-700">Pending: {stats.pending}</span>
        <span className="text-blue-700">Proses: {stats.proses}</span>
        <span className="text-emerald-700">Selesai: {stats.selesai}</span>
      </div>
    </article>
  );
}

function InventoryCard({ urgentParts }: { urgentParts: number }) {
  return (
    <article className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm min-h-40 flex flex-col justify-between">
      <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl w-fit">
        <Package size={20} />
      </div>
      <div>
        <p className="text-4xl font-black text-slate-950 tracking-tighter">
          {String(urgentParts).padStart(2, '0')}
        </p>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Part Urgent
        </p>
      </div>
      <div className="mt-4 space-y-2">
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-amber-600 h-full w-[60%]" />
        </div>
        <p className="text-[9px] text-slate-700 font-black uppercase">
          3 Approval Manajer
        </p>
      </div>
    </article>
  );
}

function FinanceCard({ billingPercentage }: { billingPercentage: number }) {
  return (
    <article className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm min-h-40 flex flex-col justify-between">
      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl w-fit">
        <Wallet size={20} />
      </div>
      <div>
        <p className="text-4xl font-black text-slate-950 tracking-tighter">
          {billingPercentage}%
        </p>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Penagihan Selesai
        </p>
      </div>
      <p className="mt-4 text-[10px] font-black text-emerald-800 flex items-center gap-1 uppercase tracking-tight bg-emerald-50 w-fit px-2 py-0.5 rounded">
        <TrendingUp size={12} /> +5.2%
      </p>
    </article>
  );
}

function SystemHealthCard() {
  return (
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
  );
}

interface PageHeaderProps {
  pending: number;
}

export function PageHeader({ pending }: PageHeaderProps) {
  return (
    <section className="space-y-1.5 text-left">
      <SecurityBadge />
      <WelcomeTitle />
      <TaskQuote pending={pending} />
    </section>
  );
}

function SecurityBadge() {
  return (
    <div className="flex items-center gap-2 w-fit px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded text-[9px] font-black uppercase tracking-widest border border-blue-200">
      <ShieldCheck size={10} /> Keamanan Terverifikasi
    </div>
  );
}

function WelcomeTitle() {
  return (
    <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
      Selamat Datang, <span className="text-blue-700">Mas Nanda.</span>
    </h2>
  );
}

function TaskQuote({ pending }: { pending: number }) {
  return (
    <p className="text-xs md:text-sm text-slate-600 font-bold italic tracking-tight">
      "Sistem optimal. {pending} tugas prioritas terdeteksi."
    </p>
  );
}

interface DatabaseOverviewProps {
  customers: number;
  technicians: number;
}

export function DatabaseOverview({
  customers,
  technicians,
}: DatabaseOverviewProps) {
  return (
    <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-7 flex flex-col justify-center items-center text-center">
      <IconBox />
      <h3 className="text-sm font-black text-slate-950 uppercase tracking-tighter mb-1">
        Database Overview
      </h3>
      <p className="text-[9px] text-slate-600 font-black mb-6 uppercase tracking-widest">
        Data Terpusat
      </p>

      <div className="grid grid-cols-2 gap-4 w-full">
        <StatBox value={customers} label="Pelanggan" />
        <StatBox value={technicians} label="Teknisi" />
      </div>

      <ManageButton />
    </div>
  );
}

function IconBox() {
  return (
    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-200 mb-5">
      <Users size={24} className="text-blue-800" />
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <p className="text-2xl font-black text-slate-950 tracking-tighter">
        {value}
      </p>
      <p className="text-[9px] font-black text-slate-500 uppercase mt-1">
        {label}
      </p>
    </div>
  );
}

function ManageButton() {
  return (
    <button className="mt-8 w-full py-3.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition-all shadow-lg active:scale-95">
      Kelola Database
    </button>
  );
}

export function PageFooter() {
  const { Globe } = require('lucide-react');
  return (
    <footer className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] text-center md:text-left">
      <div className="flex items-center gap-2">
        <Globe size={12} className="text-blue-800" /> Semarang, Indonesia
      </div>
      <p className="text-slate-400">
        © 2026 PT Mitrainfoparama — V2.1.0-AAA
      </p>
    </footer>
  );
}
