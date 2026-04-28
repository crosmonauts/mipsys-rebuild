'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import {
  ClipboardList,
  Users,
  Package,
  Wallet,
  LayoutDashboard,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Printer,
  Globe,
  TrendingUp,
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';

export default function MipsysAAALayout() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, link: '/' },
    {
      title: 'Service Request',
      icon: <ClipboardList size={20} />,
      link: '/service-request',
      count: '24',
    },
    {
      title: 'Inventory & Parts',
      icon: <Package size={20} />,
      link: '/inventory',
      count: '5',
    },
    {
      title: 'Finance & Billing',
      icon: <Wallet size={20} />,
      link: '/finance',
    },
    {
      title: 'Master Database',
      icon: <Users size={20} />,
      link: '/master-data',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-[#121212] font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-60 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col w-full min-w-0">
        <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
          <section className="space-y-1">
            <div className="flex items-center gap-2 w-fit px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">
              <ShieldCheck size={10} /> Keamanan Terverifikasi
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Selamat Datang, <span className="text-blue-600">Mas Nanda.</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium italic">
              "Sistem berjalan optimal. Ada 12 tugas prioritas hari ini."
            </p>
          </section>

          {/* --- STATS GRID (KEMBALI DENGAN DETAIL) --- */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Service Card */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                  <ClipboardList size={18} />
                </div>
                <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                  Servis
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900">24</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Antrean
              </p>
              {/* RESTORASI: Breakdown Antrean */}
              <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between text-[9px] font-bold">
                <span className="text-amber-600">12 Pending</span>
                <span className="text-blue-600">8 Proses</span>
                <span className="text-emerald-600">4 Selesai</span>
              </div>
            </article>

            {/* Inventory Card */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition-all">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit mb-2">
                <Package size={18} />
              </div>
              <p className="text-3xl font-black text-slate-900">05</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Part Urgent
              </p>
              {/* RESTORASI: Progress Bar & Info */}
              <div className="mt-3 space-y-1">
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[60%] transition-all" />
                </div>
                <p className="text-[9px] text-slate-400 font-medium tracking-tight">
                  3 Menunggu approval manager
                </p>
              </div>
            </article>

            {/* Finance Card */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition-all">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-2">
                <Wallet size={18} />
              </div>
              <p className="text-3xl font-black text-slate-900">82%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Penagihan Selesai
              </p>
              {/* RESTORASI: Trend Indicator */}
              <p className="mt-3 text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp size={10} /> +5.2% dari bulan lalu
              </p>
            </article>

            {/* System Health Card */}
            <article className="bg-[#020617] text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <Activity size={18} className="text-blue-400" />
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <div>
                <p className="text-2xl font-black italic tracking-tighter">
                  99.9%
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Uptime System
                </p>
              </div>
              <p className="mt-2 text-[9px] text-blue-300 font-medium">
                Database: Terhubung
              </p>
            </article>
          </section>

          {/* --- DETAILED SECTION (AKTIVITAS & DATABASE) --- */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-slate-400" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                    Aktivitas Terkini
                  </h3>
                </div>
                <button className="text-[10px] font-bold text-blue-600 hover:underline transition-all">
                  Log Lengkap
                </button>
              </div>
              <div className="space-y-4">
                {[
                  {
                    time: '10:24',
                    user: 'Admin',
                    task: 'Update Status Tiket #EPS-2024-001',
                    icon: (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    ),
                  },
                  {
                    time: '09:15',
                    user: 'Finance',
                    task: 'Invoice #INV-992 dikirim ke pelanggan',
                    icon: <History size={12} className="text-blue-500" />,
                  },
                  {
                    time: '08:45',
                    user: 'System',
                    task: 'Stok Tinta L3210 kritis (< 5 unit)',
                    icon: <AlertCircle size={12} className="text-red-500" />,
                  },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start md:items-center gap-4 text-[11px] group transition-all"
                  >
                    <span className="text-slate-400 font-mono w-10 text-[10px] pt-0.5 md:pt-0">
                      {log.time}
                    </span>
                    <div className="p-1.5 bg-slate-50 rounded-md group-hover:bg-slate-100 transition-colors">
                      {log.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* RESTORASI: Nama User muncul kembali */}
                      <span className="font-bold text-slate-800 mr-2">
                        {log.user}
                      </span>
                      <span className="text-slate-500 italic truncate block md:inline">
                        "{log.task}"
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                <Users size={22} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Database Overview
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xl font-black text-slate-900">120</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                    Pelanggan
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-xl font-black text-slate-900">12</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                    Teknisi
                  </p>
                </div>
              </div>
              <button className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                Kelola Database
              </button>
            </div>
          </section>

          <footer className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center md:text-left">
            <div className="flex items-center gap-2">
              <Globe size={10} /> Central Java, Indonesia
            </div>
            <p>© 2026 PT Mitrainfoparama - V2.1.0-Stable</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
