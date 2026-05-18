'use client';
import React from 'react';
import { ProfitLossChart } from './ProfitLossChart';
import { PpnReportView } from './PpnReport';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
        Laporan <span className="text-blue-800">Keuangan</span>
      </h2>
      <ProfitLossChart />
      <PpnReportView />
    </div>
  );
}
