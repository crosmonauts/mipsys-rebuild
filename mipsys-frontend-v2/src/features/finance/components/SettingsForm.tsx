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
    financeApi.getSettings()
      .then((settings) => {
        if (settings.ppn_rate) setPpnRate(settings.ppn_rate);
        if (settings.invoice_prefix) setInvoicePrefix(settings.invoice_prefix);
      })
      .catch(() => toast.error('Gagal memuat pengaturan'))
      .finally(() => setLoading(false));
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

  if (loading) return <div className="p-8 text-center text-xs font-bold text-muted-foreground">Memuat…</div>;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-foreground"><Settings size={16} aria-hidden="true" /> Pengaturan Finance</h3>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-xs font-bold block mb-1 text-foreground/80">PPN Rate (%)</label>
          <div className="flex gap-2">
            <input type="number" step="0.25" min="0" max="100" value={ppnRate} onChange={(e) => setPpnRate(e.target.value)}
              className="flex-1 p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-foreground" />
            <button onClick={handleSavePpn} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all motion-safe:active:scale-95">Simpan</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold block mb-1 text-foreground/80">Prefix Invoice</label>
          <div className="flex gap-2">
            <input type="text" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)}
              className="flex-1 p-2.5 border border-border rounded-xl text-sm font-bold focus:border-primary focus:ring-2 focus:ring-ring outline-none bg-background text-foreground" />
            <button onClick={handleSavePrefix} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all motion-safe:active:scale-95">Simpan</button>
          </div>
        </div>
      </div>
    </div>
  );
}
