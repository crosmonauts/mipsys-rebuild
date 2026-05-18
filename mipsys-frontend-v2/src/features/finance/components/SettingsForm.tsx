'use client';
import React, { useEffect, useState } from 'react';
import { financeApi } from '../api/finance-api';
import { toast } from 'react-hot-toast';
import { Settings } from 'lucide-react';

export function SettingsForm() {
  const [ppnRate, setPpnRate] = useState('11');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getSettings().then((settings) => {
      if (settings.ppn_rate) setPpnRate(settings.ppn_rate);
      if (settings.invoice_prefix) setInvoicePrefix(settings.invoice_prefix);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSavePpn() {
    try {
      await financeApi.updatePpnRate(parseFloat(ppnRate));
      toast.success('PPN rate berhasil diupdate');
    } catch {
      toast.error('Gagal update PPN rate');
    }
  }

  async function handleSavePrefix() {
    try {
      await financeApi.updateInvoicePrefix(invoicePrefix);
      toast.success('Prefix invoice berhasil diupdate');
    } catch {
      toast.error('Gagal update prefix');
    }
  }

  if (loading) return <div className="p-8 text-center text-xs font-bold text-slate-500">Memuat...</div>;

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 shadow-sm">
      <h3 className="font-black text-sm mb-4 flex items-center gap-2"><Settings size={16} /> Pengaturan Finance</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs font-bold block mb-1">PPN Rate (%)</label>
          <div className="flex gap-2">
            <input type="number" step="0.25" min="0" max="100" value={ppnRate} onChange={(e) => setPpnRate(e.target.value)}
              className="flex-1 p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none" />
            <button onClick={handleSavePpn} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all">Simpan</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold block mb-1">Prefix Invoice</label>
          <div className="flex gap-2">
            <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)}
              className="flex-1 p-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold focus:border-blue-700 focus:ring-4 focus:ring-blue-100 outline-none" />
            <button onClick={handleSavePrefix} className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}
