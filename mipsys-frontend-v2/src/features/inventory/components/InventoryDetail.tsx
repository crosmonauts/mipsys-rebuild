'use client';

import { InventoryPart } from '../api/inventory-api';
import { StockMovementHistory } from './StockMovementHistory';

interface InventoryDetailProps {
  part: InventoryPart;
  onClose: () => void;
}

export function InventoryDetail({ part, onClose }: InventoryDetailProps) {
  const stockPercent = part.minStock > 0 ? Math.min((part.stock / (part.minStock * 2)) * 100, 100) : 0;
  const stockColor = part.stock === 0 ? 'bg-red-500' : part.stock < part.minStock ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{part.partCode}</h2>
            <p className="text-sm text-slate-600">{part.partName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl" aria-label="Close detail">×</button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Lokasi:</span> <span className="font-semibold">{part.location || '-'}</span></div>
            <div><span className="text-slate-500">Harga:</span> <span className="font-semibold">Rp {Number(part.price).toLocaleString('id-ID')}</span></div>
            <div><span className="text-slate-500">Stok:</span> <span className="font-semibold">{part.stock}</span></div>
            <div><span className="text-slate-500">Min Stock:</span> <span className="font-semibold">{part.minStock}</span></div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Stok vs Min Stock</span>
              <span>{part.stock} / {part.minStock}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full ${stockColor} transition-all`} style={{ width: `${stockPercent}%` }} />
            </div>
            {part.stock === 0 && <p className="text-xs text-red-600 font-bold mt-1">EMPTY — Stok habis</p>}
            {part.stock > 0 && part.stock < part.minStock && <p className="text-xs text-amber-600 font-bold mt-1">LOW — Stok menipis</p>}
          </div>

          <div>
            <h3 className="font-bold text-slate-900 mb-3">Riwayat Pergerakan Stok</h3>
            <StockMovementHistory partId={part.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
