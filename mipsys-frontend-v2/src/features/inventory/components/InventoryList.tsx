'use client';

import { SearchX } from 'lucide-react';
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

function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border/50 motion-safe:animate-in motion-safe:fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="py-3 px-5">
              <div className="h-4 bg-muted rounded motion-safe:animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function InventoryList({ parts, isLoading, onPartClick }: InventoryListProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full" role="table" aria-label="Inventory parts list">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th scope="col" className="w-10 text-center py-3 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">#</th>
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Part Code</th>
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Part</th>
            <th scope="col" className="text-right py-3 px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Stok</th>
            <th scope="col" className="text-right py-3 px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Harga</th>
            <th scope="col" className="text-center py-3 px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Lokasi</th>
            <th scope="col" className="text-center py-3 px-5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        {isLoading ? (
          <SkeletonRows />
        ) : parts.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={7}>
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <SearchX size={32} className="text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="text-base font-bold text-foreground mb-1">Tidak ada data part</p>
                  <p className="text-sm text-muted-foreground">Coba ubah kata kunci pencarian atau filter status</p>
                </div>
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody>
            {parts.map((part, idx) => {
              const status = getStockStatus(part);
              return (
                <tr
                  key={part.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors motion-safe:animate-in motion-safe:fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => onPartClick(part)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onPartClick(part)}
                >
                  <td className="py-3 px-2 text-center text-xs font-mono text-muted-foreground/50">{idx + 1}</td>
                  <td className="py-3 px-5 font-mono font-semibold text-foreground">{part.partCode}</td>
                  <td className="py-3 px-5 text-foreground/80">{part.partName}</td>
                  <td className={`py-3 px-5 text-right font-bold ${part.stock === 0 ? 'text-destructive' : part.stock < part.minStock ? 'text-amber-400' : 'text-foreground'}`}>
                    {part.stock}
                  </td>
                  <td className="py-3 px-5 text-right text-foreground/80">Rp {Number(part.price).toLocaleString('id-ID')}</td>
                  <td className="py-3 px-5 text-center text-muted-foreground text-sm">{part.location || '-'}</td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={status.label} variant={status.variant} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
    </div>
  );
}
