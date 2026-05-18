'use client';
import React from 'react';
import { ProfitLossChart } from '@/src/features/finance/reports/ProfitLossChart';
import { PpnReportView } from '@/src/features/finance/reports/PpnReport';

export default function ReportsPage() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
          Laporan <span className="text-blue-800">Keuangan</span>
        </h2>
        <ProfitLossChart />
        <PpnReportView />
      </div>
    </main>
  );
}
