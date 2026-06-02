'use client';

import { useEffect, useState } from 'react';
import { Package, Wrench, SlidersHorizontal, Undo2, ArrowDown, ArrowUp } from 'lucide-react';
import { apiClient } from '@/src/lib/api-client';

interface Movement {
  id: number;
  sparePartId: number;
  quantity: number;
  movementType: 'PO_RECEIVE' | 'SERVICE_USE' | 'ADJUSTMENT' | 'SERVICE_RETURN';
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

interface StockMovementHistoryProps {
  partId: number;
}

const movementTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PO_RECEIVE: {
    label: 'PO Diterima',
    icon: <Package size={12} aria-hidden="true" />,
    className: 'text-green-400 bg-green-500/10',
  },
  SERVICE_USE: {
    label: 'Digunakan Servis',
    icon: <Wrench size={12} aria-hidden="true" />,
    className: 'text-red-400 bg-red-500/10',
  },
  ADJUSTMENT: {
    label: 'Penyesuaian',
    icon: <SlidersHorizontal size={12} aria-hidden="true" />,
    className: 'text-amber-400 bg-amber-500/10',
  },
  SERVICE_RETURN: {
    label: 'Dikembalikan',
    icon: <Undo2 size={12} aria-hidden="true" />,
    className: 'text-blue-400 bg-blue-500/10',
  },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID');
}

export function StockMovementHistory({ partId }: StockMovementHistoryProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!partId) return;
    apiClient
      .get(`/inventory/parts/${partId}/movements`)
      .then((r) => setMovements(r.data))
      .catch(() => setMovements([]))
      .finally(() => setIsLoading(false));
  }, [partId]);

  if (isLoading) return (
    <div className="space-y-2">
      {[55, 45, 60].map((w, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--muted)] motion-safe:animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-[var(--muted)] rounded motion-safe:animate-pulse" style={{ width: `${w}%` }} />
            <div className="h-2.5 bg-[var(--muted)]/50 rounded motion-safe:animate-pulse" style={{ width: `${w * 0.5}%` }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (movements.length === 0) return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="p-3 bg-[var(--muted)]/50 rounded-full mb-3">
        <Package size={20} className="text-[var(--muted-foreground)]" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-[var(--foreground)]">Belum ada pergerakan stok</p>
    </div>
  );

  return (
    <div className="divide-y divide-border/50">
      {movements.map((m) => {
        const config = movementTypeConfig[m.movementType];
        return (
          <div
            key={m.id}
            className="flex items-start gap-3 py-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300"
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${config?.className || 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
              {config?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--foreground)]">{config?.label || m.movementType}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black font-mono ${m.quantity > 0 ? 'text-green-400' : 'text-[var(--destructive)]'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </span>
                  {m.quantity > 0 ? (
                    <ArrowDown size={10} className="text-green-400" aria-hidden="true" />
                  ) : (
                    <ArrowUp size={10} className="text-[var(--destructive)]" aria-hidden="true" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[var(--muted-foreground)]/60">{formatRelativeTime(m.createdAt)}</span>
                {m.referenceId && (
                  <>
                    <span className="text-[10px] text-[var(--muted-foreground)]/30">•</span>
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]/60">{m.referenceId}</span>
                  </>
                )}
              </div>
              {m.notes && (
                <p className="text-[10px] text-[var(--muted-foreground)]/70 mt-0.5 line-clamp-1">{m.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
