'use client';

import { X, MapPin, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { InventoryPart } from '../api/inventory-api';
import { StockMovementHistory } from './StockMovementHistory';
import { cn } from '@/src/lib/utils';

interface InventoryDetailProps {
  part: InventoryPart;
  onClose: () => void;
}

export function InventoryDetail({ part, onClose }: InventoryDetailProps) {
  const stockPercent = part.minStock > 0 ? Math.min((part.stock / (part.minStock * 2)) * 100, 100) : 0;
  const isCritical = part.stock === 0;
  const isLow = part.stock > 0 && part.stock < part.minStock;
  const stockColor = isCritical ? 'bg-destructive' : isLow ? 'bg-amber-500' : 'bg-accent';

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
              isCritical ? 'bg-destructive/10' : isLow ? 'bg-amber-500/10' : 'bg-accent/10',
            )}>
              <Package size={18} className={cn(isCritical ? 'text-destructive' : isLow ? 'text-amber-400' : 'text-accent')} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{part.partCode}</h2>
              <p className="text-sm text-muted-foreground truncate">{part.partName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Tutup detail"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Lokasi</p>
                <p className="font-semibold text-foreground truncate">{part.location || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Harga</p>
                <p className="font-semibold text-foreground">Rp {Number(part.price).toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Stok</p>
                <p className="font-semibold text-foreground">{part.stock}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Min Stock</p>
                <p className="font-semibold text-foreground">{part.minStock}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider">Stok vs Min Stock</span>
              <span className="font-mono font-bold">{part.stock} / {part.minStock}</span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
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
              <div className="flex items-center gap-1.5 text-xs text-destructive font-bold mt-1">
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

          <div>
            <h3 className="font-bold text-foreground mb-3">Riwayat Pergerakan Stok</h3>
            <StockMovementHistory partId={part.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
