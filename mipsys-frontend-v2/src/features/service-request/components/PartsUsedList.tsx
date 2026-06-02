import React from 'react';
import { Package, Trash2 } from 'lucide-react';
import { OrderPart } from '../api/order-parts-api';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Badge } from '@/src/components/ui/badge';

interface PartsUsedListProps {
  parts: OrderPart[];
  totalFee: number;
  isLoading: boolean;
  onRemove?: (id: number) => void;
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  IN_STOCK: { label: 'Stok', variant: 'default' },
  OUT_OF_STOCK: { label: 'PO', variant: 'destructive' },
  MANUAL_NEW: { label: 'Baru', variant: 'outline' },
  PROPOSED: { label: 'Usulan', variant: 'secondary' },
  CANCELLED: { label: 'Batal', variant: 'destructive' },
};

export function PartsUsedList({
  parts,
  totalFee,
  isLoading,
  onRemove,
}: PartsUsedListProps) {
  if (isLoading) return <LoadingState />;
  if (parts.length === 0) return (
    <div className="text-center py-8">
      <EmptyState
        title="Belum ada part yang digunakan"
        description="Tambahkan part yang digunakan saat melakukan servis."
      />
    </div>
  );

  return (
    <section className="space-y-4">
      <SectionHeader />

      <div className="space-y-2">
        {parts.map((part) => (
          <PartItem
            key={part.id}
            part={part}
            onRemove={onRemove}
          />
        ))}
      </div>

      <TotalRow totalFee={totalFee} />
    </section>
  );
}

function SectionHeader() {
  return (
    <h3 className="micro-label text-primary flex items-center gap-6">
      <Package size={14} aria-hidden="true" /> Part Digunakan{' '}
      <span className="h-[1px] flex-1 bg-border/20"></span>
    </h3>
  );
}

function PartItem({
  part,
  onRemove,
}: {
  part: OrderPart;
  onRemove?: (id: number) => void;
}) {
  const unitPrice = Number(part.priceAtAction ?? 0);
  const lineTotal = unitPrice * part.quantity;
  const badge = statusBadge[part.status] || { label: part.status, variant: 'secondary' as const };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/20 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm truncate font-bold">
          {part.partName}
        </p>
        <p className="micro-label text-muted-foreground">
          {part.partCode ?? 'Manual'} × {part.quantity}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="font-bold text-foreground text-sm">
          Rp {lineTotal.toLocaleString('id-ID')}
        </p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {onRemove && (
          <button
            onClick={() => onRemove(part.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            aria-label={`Hapus ${part.partName || 'part'}`}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function TotalRow({ totalFee }: { totalFee: number }) {
  return (
    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/30">
      <span className="text-[10px] font-black uppercase text-primary">
        Total Biaya Part
      </span>
      <span className="text-lg font-black text-primary">
        Rp {totalFee.toLocaleString('id-ID')}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
      <div className="w-4 h-4 border-2 border-border/30 border-t-primary rounded-full motion-safe:animate-spin" />
      Memuat part…
    </div>
  );
}
