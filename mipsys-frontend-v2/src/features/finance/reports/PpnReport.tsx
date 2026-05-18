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
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-sm">
      <h3 className="font-black text-sm mb-4">Laporan PPN Bulanan</h3>
      <div className="flex gap-2 mb-4">
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
          className="p-2 border-2 border-slate-300 rounded-xl text-sm font-bold">
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
          className="p-2 border-2 border-slate-300 rounded-xl text-sm font-bold">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
        <button onClick={handleSearch} disabled={loading}
          className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-all">
          {loading ? 'Memuat...' : 'Cari'}
        </button>
      </div>
      {report && (
        <div className="space-y-2 text-sm">
          <p><span className="font-bold">Periode:</span> {report.period}</p>
          <p><span className="font-bold">Jumlah Invoice:</span> {report.totalInvoices}</p>
          <p><span className="font-bold">DPP:</span> Rp {report.totalDpp.toLocaleString('id-ID')}</p>
          <p><span className="font-bold">PPN:</span> Rp {report.totalPpn.toLocaleString('id-ID')}</p>
          <p><span className="font-bold">Rate PPN:</span> {report.ppnRate}%</p>
        </div>
      )}
    </div>
  );
}
