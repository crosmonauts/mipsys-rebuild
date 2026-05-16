import React from 'react';
import { Package, Trash2 } from 'lucide-react';
import { OrderPart } from '../api/order-parts-api';

interface PartsUsedListProps {
  parts: OrderPart[];
  totalFee: number;
  isLoading: boolean;
  onRemove?: (id: number) => void;
}

export function PartsUsedList({
  parts,
  totalFee,
  isLoading,
  onRemove,
}: PartsUsedListProps) {
  if (isLoading) return <LoadingState />;
  if (parts.length === 0) return null;

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
    <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.5em] flex items-center gap-6">
      <Package size={14} /> Part Digunakan{' '}
      <span className="h-[1px] flex-1 bg-stone-100"></span>
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

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-100 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="font-bold text-stone-900 text-sm truncate">
          {part.partName}
        </p>
        <p className="text-[10px] text-stone-400">
          {part.partCode ?? 'Manual'} × {part.quantity}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <p className="font-black text-stone-900 text-sm">
          Rp {lineTotal.toLocaleString('id-ID')}
        </p>
        <StatusBadge status={part.status} />
        {onRemove && (
          <button
            onClick={() => onRemove(part.id)}
            className="p-1.5 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IN_STOCK: 'bg-emerald-100 text-emerald-700',
    OUT_OF_STOCK: 'bg-red-100 text-red-700',
    MANUAL_NEW: 'bg-amber-100 text-amber-700',
  };

  const labels: Record<string, string> = {
    IN_STOCK: 'Stok',
    OUT_OF_STOCK: 'PO',
    MANUAL_NEW: 'Baru',
  };

  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function TotalRow({ totalFee }: { totalFee: number }) {
  return (
    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
      <span className="text-[10px] font-black uppercase text-blue-600">
        Total Biaya Part
      </span>
      <span className="text-lg font-black text-blue-800">
        Rp {totalFee.toLocaleString('id-ID')}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-xs text-stone-400 py-4">
      <div className="w-4 h-4 border-2 border-stone-200 border-t-blue-600 rounded-full animate-spin" />
      Memuat part...
    </div>
  );
}
