import React from 'react';
import { AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';
import { SparePart } from '../types';

interface PartTableRowProps {
  part: SparePart;
  onOpenRestock: (part: SparePart) => void;
}

export function PartTableRow({ part, onOpenRestock }: PartTableRowProps) {
  const isLowStock = part.stock <= 3;

  return (
    <tr className="border-b-2 border-slate-300 hover:bg-slate-50/80 transition-colors duration-150">
      <td
        className="p-4 font-mono text-xs font-black text-blue-900 select-all"
        aria-label={`Kode Part: ${part.partCode}`}
      >
        {part.partCode || 'N/A'}
      </td>
      <td className="p-4 text-xs font-black text-slate-950">{part.partName}</td>
      <td className="p-4 text-xs font-bold text-slate-800">
        {part.modelName || 'N/A'}
      </td>
      <td className="p-4 text-center">
        <span
          className={`px-3 py-1.5 rounded-md text-xs font-black border-2 inline-block min-w-18.75 text-center ${
            isLowStock
              ? 'bg-red-50 text-red-950 border-red-800'
              : 'bg-slate-100 text-slate-950 border-slate-400'
          }`}
          aria-label={`Stok saat ini: ${part.stock} unit`}
        >
          {part.stock} Unit
        </span>
      </td>
      <td className="p-4 text-xs font-black text-slate-950">
        IDR {Number(part.price || 0).toLocaleString('id-ID')}
      </td>
      <td className="p-4">
        {isLowStock ? (
          <span className="flex items-center gap-1.5 text-xs font-black text-red-950 bg-red-50 border-2 border-red-800 px-3 py-1 rounded-md w-fit">
            <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />{' '}
            RESTOCK
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-950 bg-emerald-50 border-2 border-emerald-800 px-3 py-1 rounded-md w-fit">
            <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />{' '}
            AMAN
          </span>
        )}
      </td>
      <td className="p-4 text-center">
        <button
          onClick={() => onOpenRestock(part)}
          className="px-4 py-2 bg-slate-950 hover:bg-blue-900 text-white font-black text-[11px] uppercase rounded-lg border-2 border-slate-950 transition-all focus-visible:ring-4 focus-visible:ring-blue-700 focus-visible:outline-none flex items-center justify-center gap-1.5 mx-auto"
          aria-label={`Tambah stok untuk ${part.partName}`}
        >
          <PackagePlus size={14} aria-hidden="true" /> + Stok
        </button>
      </td>
    </tr>
  );
}
