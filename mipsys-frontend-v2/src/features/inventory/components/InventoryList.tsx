'use client';

import { StatusBadge } from '@/src/components/layout/StatusBadge';
import { InventoryPart } from '../api/inventory-api';

interface InventoryListProps {
  parts: InventoryPart[];
  isLoading: boolean;
  onPartClick: (part: InventoryPart) => void;
}

function getStockStatus(part: InventoryPart): { label: string; variant: 'ok' | 'low' | 'empty' } {
  if (part.stock === 0) return { label: 'EMPTY', variant: 'empty' };
  if (part.stock < part.minStock) return { label: 'LOW', variant: 'low' };
  return { label: 'OK', variant: 'ok' };
}

export function InventoryList({ parts, isLoading, onPartClick }: InventoryListProps) {
  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data inventory...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full" role="table" aria-label="Inventory parts list">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Part Code</th>
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Part</th>
            <th scope="col" className="text-right py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Stok</th>
            <th scope="col" className="text-right py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Harga</th>
            <th scope="col" className="text-center py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
            <th scope="col" className="text-center py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => {
            const status = getStockStatus(part);
            return (
              <tr
                key={part.id}
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => onPartClick(part)}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onPartClick(part)}
              >
                <td className="py-3 px-5 font-mono font-semibold text-slate-900">{part.partCode}</td>
                <td className="py-3 px-5 text-slate-700">{part.partName}</td>
                <td className={`py-3 px-5 text-right font-bold ${part.stock === 0 ? 'text-red-600' : part.stock < part.minStock ? 'text-amber-600' : 'text-slate-900'}`}>
                  {part.stock}
                </td>
                <td className="py-3 px-5 text-right text-slate-700">Rp {Number(part.price).toLocaleString('id-ID')}</td>
                <td className="py-3 px-5 text-center text-slate-500 text-sm">{part.location || '-'}</td>
                <td className="py-3 px-5 text-center">
                  <StatusBadge status={status.label} variant={status.variant} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {parts.length === 0 && (
        <div className="p-8 text-center text-slate-500">Tidak ada data part.</div>
      )}
    </div>
  );
}
