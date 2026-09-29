'use client';

import React, { useEffect, useState } from 'react';
import { X, MapPin, DollarSign, Package, AlertTriangle, Tags, Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { InventoryPart, inventoryApi, categoryModelsApi, CategoryModel } from '../api/inventory-api';
import { StockMovementHistory } from './StockMovementHistory';
import { useAuth } from '@/src/lib/auth-context';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

interface InventoryDetailProps {
  part: InventoryPart;
  onClose: () => void;
  onSaved?: () => void;
}

export function InventoryDetail({ part, onClose, onSaved }: InventoryDetailProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [models, setModels] = useState<CategoryModel[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [universal, setUniversal] = useState(false);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const [savingCompat, setSavingCompat] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingCompat(true);
    Promise.all([
      categoryModelsApi.getAll().catch(() => [] as CategoryModel[]),
      inventoryApi.getCompatibility(part.id).catch(() => [] as { id: number; name: string }[]),
    ])
      .then(([all, compat]) => {
        setModels(all);
        setSelected(compat.map((c) => c.id));
        setUniversal(!!part.isUniversal);
      })
      .finally(() => setLoadingCompat(false));
  }, [isAdmin, part.id, part.isUniversal]);
  const stockPercent = part.minStock > 0 ? Math.min((part.stock / (part.minStock * 2)) * 100, 100) : 0;
  const isCritical = part.stock === 0;
  const isLow = part.stock > 0 && part.stock < part.minStock;
  const stockColor = isCritical ? 'bg-[var(--destructive)]' : isLow ? 'bg-amber-500' : 'bg-[var(--accent)]';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'bg-background rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-border/30',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200',
        )}
      >
        <div className="p-6 border-b border-border flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              'p-2.5 rounded-xl shrink-0',
              isCritical ? 'bg-[var(--destructive)]/10' : isLow ? 'bg-amber-500/10' : 'bg-[var(--accent)]/10',
            )}>
              <Package size={18} className={cn(isCritical ? 'text-[var(--destructive)]' : isLow ? 'text-amber-400' : 'text-[var(--accent)]')} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--foreground)] truncate">{part.partCode}</h2>
              <p className="text-sm text-[var(--muted-foreground)] truncate">{part.partName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-all shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Tutup detail"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-[var(--muted-foreground)] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Lokasi</p>
                <p className="font-semibold text-[var(--foreground)] truncate">{part.location || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign size={14} className="text-[var(--muted-foreground)] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Harga</p>
                <p className="font-semibold text-[var(--foreground)]">Rp {Number(part.price).toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package size={14} className="text-[var(--muted-foreground)] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Stok</p>
                <p className="font-semibold text-[var(--foreground)]">{part.stock}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle size={14} className="text-[var(--muted-foreground)] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Min Stock</p>
                <p className="font-semibold text-[var(--foreground)]">{part.minStock}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span className="font-bold uppercase tracking-wider">Stok vs Min Stock</span>
              <span className="font-mono font-bold">{part.stock} / {part.minStock}</span>
            </div>
            <div className="w-full h-4 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all motion-safe:duration-500 motion-safe:ease-out rounded-full',
                  stockColor,
                  isCritical && 'motion-safe:animate-pulse',
                )}
                style={{ width: `${Math.max(stockPercent, 2)}%` }}
              />
            </div>
            {isCritical && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--destructive)] font-bold mt-1">
                <AlertTriangle size={12} aria-hidden="true" />
                <span>EMPTY — Stok habis, segera lakukan pemesanan</span>
              </div>
            )}
            {isLow && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-1">
                <AlertTriangle size={12} aria-hidden="true" />
                <span>LOW — Stok menipis, perlu di-restock</span>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-border/30 p-4 space-y-3">
              <h3 className="font-bold text-[var(--foreground)] flex items-center gap-2 text-sm">
                <Tags size={14} aria-hidden="true" /> Kompatibilitas Model
              </h3>
              {loadingCompat ? (
                <p className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" /> Memuat…
                </p>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={universal}
                      onChange={(e) => setUniversal(e.target.checked)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    Universal (cocok semua model)
                  </label>
                  {!universal && (
                    <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto">
                      {models.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer rounded-lg px-2 py-1.5 hover:bg-[var(--muted)]/50">
                          <input
                            type="checkbox"
                            checked={selected.includes(m.id)}
                            onChange={(e) =>
                              setSelected((prev) =>
                                e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)
                              )
                            }
                            className="h-4 w-4 accent-[var(--primary)]"
                          />
                          <span className="font-medium">{m.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    disabled={savingCompat}
                    onClick={async () => {
                      setSavingCompat(true);
                      try {
                        await inventoryApi.updatePart(part.id, {
                          isUniversal: universal,
                          compatibleModelIds: universal ? [] : selected,
                        });
                        toast.success('Kompatibilitas tersimpan');
                        onSaved?.();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Gagal menyimpan kompatibilitas');
                      } finally {
                        setSavingCompat(false);
                      }
                    }}
                    className="h-10 rounded-xl text-xs font-black uppercase gap-2"
                  >
                    {savingCompat ? (
                      <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />
                    ) : (
                      <Check size={14} aria-hidden="true" />
                    )}
                    Simpan Kompatibilitas
                  </Button>
                </>
              )}
            </div>
          )}

          <div>
            <h3 className="font-bold text-[var(--foreground)] mb-3">Riwayat Pergerakan Stok</h3>
            <StockMovementHistory partId={part.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
