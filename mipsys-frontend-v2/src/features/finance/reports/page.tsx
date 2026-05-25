'use client';
import React from 'react';
import { ProfitLossChart } from './ProfitLossChart';
import { PpnReportView } from './PpnReport';
import { PageHeader } from '@/src/components/ui/page-header';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan Keuangan"
      />
      <ProfitLossChart />
      <PpnReportView />
    </div>
  );
}
