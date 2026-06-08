'use client';
import React, { useState } from 'react';
import { financeApi } from '../api/finance-api';
import { PpnReport as PpnReportType } from '../types';
import { toast } from 'react-hot-toast';

export function PpnReportView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<PpnReportType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const result = await financeApi.getPpnReport(year, month);
      setReport(result);
    } catch {
      toast.error('Gagal memuat laporan PPN');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--card)] border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="font-black text-sm mb-4 text-[var(--foreground)]">Laporan PPN Bulanan</h3>
      <div className="flex gap-2 mb-4">
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
          className="p-2 border border-border rounded-xl text-sm font-bold bg-background text-[var(--foreground)]">
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
          className="p-2 border border-border rounded-xl text-sm font-bold bg-background text-[var(--foreground)]">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <button onClick={handleSearch} disabled={loading}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-bold hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all motion-safe:active:scale-95">
          {loading ? 'Memuat…' : 'Cari'}
        </button>
      </div>
      {report && (
        <div className="space-y-2 text-sm">
          <p className="text-[var(--foreground)]/80"><span className="font-bold text-[var(--foreground)]">Periode:</span> {report.period}</p>
          <p className="text-[var(--foreground)]/80"><span className="font-bold text-[var(--foreground)]">Jumlah Invoice:</span> {report.totalInvoices}</p>
          <p className="text-[var(--foreground)]/80"><span className="font-bold text-[var(--foreground)]">DPP:</span> Rp {report.totalDpp.toLocaleString('id-ID')}</p>
          <p className="text-[var(--foreground)]/80"><span className="font-bold text-[var(--foreground)]">PPN:</span> Rp {report.totalPpn.toLocaleString('id-ID')}</p>
          <p className="text-[var(--foreground)]/80"><span className="font-bold text-[var(--foreground)]">Rate PPN:</span> {report.ppnRate}%</p>
        </div>
      )}
    </div>
  );
}
