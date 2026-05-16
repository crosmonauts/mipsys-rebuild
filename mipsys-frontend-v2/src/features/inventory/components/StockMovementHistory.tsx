'use client';

import { useEffect, useState } from 'react';
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

const movementTypeLabels: Record<string, string> = {
  PO_RECEIVE: 'PO Diterima',
  SERVICE_USE: 'Digunakan Servis',
  ADJUSTMENT: 'Penyesuaian',
  SERVICE_RETURN: 'Dikembalikan',
};

const movementTypeColors: Record<string, string> = {
  PO_RECEIVE: 'text-green-700 bg-green-100',
  SERVICE_USE: 'text-red-700 bg-red-100',
  ADJUSTMENT: 'text-amber-700 bg-amber-100',
  SERVICE_RETURN: 'text-blue-700 bg-blue-100',
};

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

  if (isLoading) return <div className="p-4 text-center text-slate-500 text-sm">Memuat riwayat...</div>;
  if (movements.length === 0) return <div className="p-4 text-center text-slate-500 text-sm">Belum ada pergerakan stok.</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm" role="table" aria-label="Stock movement history">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
            <th scope="col" className="text-left py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
            <th scope="col" className="text-right py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
            <th scope="col" className="text-left py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Referensi</th>
            <th scope="col" className="text-left py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-b border-slate-100">
              <td className="py-2 px-4 text-slate-600">{new Date(m.createdAt).toLocaleDateString('id-ID')}</td>
              <td className="py-2 px-4">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${movementTypeColors[m.movementType]}`}>
                  {movementTypeLabels[m.movementType]}
                </span>
              </td>
              <td className={`py-2 px-4 text-right font-bold ${m.quantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
                {m.quantity > 0 ? '+' : ''}{m.quantity}
              </td>
              <td className="py-2 px-4 text-slate-600 font-mono text-xs">{m.referenceId || '-'}</td>
              <td className="py-2 px-4 text-slate-500 text-xs">{m.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
