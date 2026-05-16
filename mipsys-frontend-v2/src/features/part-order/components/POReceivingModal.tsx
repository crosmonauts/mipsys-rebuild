'use client';

import { useState } from 'react';
import { poApi } from '../api/po-api';
import type { PurchaseOrderItem } from '../types';
import { toast } from 'react-hot-toast';

interface POReceivingModalProps {
  poId: number;
  items: PurchaseOrderItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export function POReceivingModal({ poId, items, onClose, onSuccess }: POReceivingModalProps) {
  const [receivedQtys, setReceivedQtys] = useState<Record<number, number>>(
    () => Object.fromEntries(items.map((item) => [item.id!, item.quantity - (item.receivedQty || 0)]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const payload = items.map((item) => ({
        poItemId: item.id!,
        receivedQty: receivedQtys[item.id!] || 0,
      }));

      await poApi.receivePO(poId, payload);
      toast.success('Penerimaan barang berhasil dicatat');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat penerimaan');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Konfirmasi Penerimaan Barang</h2>
        </div>

        <div className="p-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-semibold text-sm text-slate-900">{item.partName || `Part #${item.sparePartId}`}</div>
                <div className="text-xs text-slate-500">Order: {item.quantity} | Sudah diterima: {item.receivedQty || 0}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Terima:</label>
                <input
                  type="number"
                  min={0}
                  max={item.quantity - (item.receivedQty || 0)}
                  value={receivedQtys[item.id!] || 0}
                  onChange={(e) =>
                    setReceivedQtys((prev) => ({ ...prev, [item.id!]: parseInt(e.target.value) || 0 }))
                  }
                  className="w-20 h-8 text-center text-sm font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-white hover:bg-slate-100 text-slate-500 font-bold text-sm uppercase rounded-xl border border-slate-300 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Penerimaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
