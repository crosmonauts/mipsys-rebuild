'use client';

import React, { useEffect, useState } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { orderPartsApi } from '../api/order-parts-api';

/** Bentuk hasil pencarian katalog (inventory/parts/search). */
interface CatalogPart {
  id: number;
  partName: string;
  partCode: string | null;
  stock: number;
  price: number;
}

interface SubstitutePartPanelProps {
  serviceRequestId: number;
  modelName: string;
  onAdded: () => void | Promise<void>;
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

/**
 * Part model lain yang tidak kompatibel. Hanya admin yang boleh
 * menyetujuinya, dan alasan wajib diisi agar tercatat di cetakan
 * penawaran serta dapat diaudit.
 */
export function SubstitutePartPanel({
  serviceRequestId,
  modelName,
  onAdded,
}: SubstitutePartPanelProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [selected, setSelected] = useState<CatalogPart | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !query.trim()) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await orderPartsApi.searchParts(query);
        if (active) setParts(Array.isArray(result) ? (result as CatalogPart[]) : []);
      } catch {
        if (active) setParts([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  // Daftar hasil pencarian diturunkan, bukan ditulis lewat efek, agar
  // menutup panel atau mengosongkan kata kunci langsung membersihkannya.
  const visibleParts = open && query.trim() ? parts : [];

  async function handleSubmit() {
    if (!selected) {
      toast.error('Pilih part substitusi terlebih dahulu');
      return;
    }
    if (!reason.trim()) {
      toast.error('Alasan substitusi wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await orderPartsApi.addSubstitute({
        serviceRequestId,
        sparePartId: selected.id,
        quantity,
        substituteReason: reason.trim(),
      });
      toast.success('Part substitusi ditambahkan dan tercatat');
      setOpen(false);
      setQuery('');
      setSelected(null);
      setReason('');
      setQuantity(1);
      await onAdded();
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? 'Gagal menambahkan part substitusi';
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 transition-all hover:bg-amber-500/20 motion-safe:active:scale-95"
      >
        <ArrowsLeftRight size={14} aria-hidden="true" />
        Part tidak kompatibel? Ajukan substitusi
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-4">
      <header className="space-y-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">
          Substitusi Part (Persetujuan Admin)
        </h4>
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Part yang terdaftar tidak tersedia atau tidak kompatibel dengan model{' '}
          <span className="font-bold">{modelName || '—'}</span>. Part substitusi
          akan ditandai di surat penawaran beserta alasannya.
        </p>
      </header>

      <div className="space-y-1.5">
        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
          Cari part pengganti
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ketik nama atau kode part…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-[var(--foreground)]"
        />
        {searching && (
          <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />
        )}
        {visibleParts.length > 0 && (
          <ul className="max-h-40 overflow-y-auto rounded-lg border border-border/40 divide-y divide-border/20">
            {visibleParts.map((part) => (
              <li key={part.id}>
                <button
                  type="button"
                  onClick={() => setSelected(part)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                    selected?.id === part.id
                      ? 'bg-amber-500/20 font-bold'
                      : 'hover:bg-border/30'
                  }`}
                >
                  <span className="truncate text-[var(--foreground)]">
                    {part.partName}
                    {part.partCode ? (
                      <span className="ml-2 text-[10px] text-[var(--muted-foreground)]">
                        {part.partCode}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    Stok {part.stock} · {rupiah.format(Number(part.price ?? 0))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="rounded-lg border border-border/40 bg-[var(--card)] p-3 text-xs">
          <p className="font-bold text-[var(--foreground)]">
            {selected.partName}
          </p>
          <label className="mt-2 flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
              Qty
            </span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs"
            />
          </label>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[9px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
          Alasan substitusi (wajib)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="mis. Part asli habis, pelanggan menyetujui pemakaian part ini"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-[var(--foreground)]"
        />
        <p className="text-[10px] text-[var(--muted-foreground)]">
          {reason.length}/500
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !selected || !reason.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-amber-700 disabled:opacity-40 motion-safe:active:scale-95"
        >
          {saving ? 'Menyimpan…' : 'Setujui & Tambahkan'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] transition-all hover:text-[var(--foreground)]"
        >
          Batal
        </button>
      </div>
    </section>
  );
}
