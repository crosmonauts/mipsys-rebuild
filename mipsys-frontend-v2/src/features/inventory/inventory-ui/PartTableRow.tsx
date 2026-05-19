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
    <tr className="border-b border-border hover:bg-muted/30 transition-colors duration-150">
      <td className="p-4 font-mono text-xs font-black text-foreground select-all" aria-label={`Kode Part: ${part.partCode}`}>
        {part.partCode || 'N/A'}
      </td>
      <td className="p-4 text-xs font-black text-foreground">{part.partName}</td>
      <td className="p-4 text-xs font-bold text-muted-foreground">
        {part.modelName || 'N/A'}
      </td>
      <td className="p-4 text-center">
        <span
          className={`px-3 py-1.5 rounded-md text-xs font-black border inline-block min-w-18 text-center ${
            isLowStock
              ? 'bg-destructive/10 text-destructive border-destructive/30'
              : 'bg-muted text-foreground border-border'
          }`}
          aria-label={`Stok saat ini: ${part.stock} unit`}
        >
          {part.stock} Unit
        </span>
      </td>
      <td className="p-4 text-xs font-black text-foreground">
        IDR {Number(part.price || 0).toLocaleString('id-ID')}
      </td>
      <td className="p-4">
        {isLowStock ? (
          <span className="flex items-center gap-1.5 text-xs font-black text-destructive bg-destructive/10 border border-destructive/30 px-3 py-1 rounded-md w-fit">
            <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
            RESTOCK
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-black text-accent bg-accent/10 border border-accent/30 px-3 py-1 rounded-md w-fit">
            <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
            AMAN
          </span>
        )}
      </td>
      <td className="p-4 text-center">
        <button
          onClick={() => onOpenRestock(part)}
          className="px-4 py-2 bg-foreground/10 hover:bg-primary/20 text-foreground hover:text-primary font-black text-[11px] uppercase rounded-lg border border-border transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none flex items-center justify-center gap-1.5 mx-auto"
          aria-label={`Tambah stok untuk ${part.partName}`}
        >
          <PackagePlus size={14} aria-hidden="true" /> + Stok
        </button>
      </td>
    </tr>
  );
}
