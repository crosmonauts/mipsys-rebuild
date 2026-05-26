'use client';

import { useState } from 'react';
import { poApi } from '../api/po-api';
import type { PurchaseOrderItem } from '../types';
import { useAuth } from '@/src/lib/auth-context';
import { toast } from 'react-hot-toast';

interface POReceivingModalProps {
  poId: number;
  items: PurchaseOrderItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export function POReceivingModal({ poId, items, onClose, onSuccess }: POReceivingModalProps) {
  const { user } = useAuth();
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

      await poApi.receivePO(poId, payload, user?.staffId);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" role="dialog" aria-modal="true">
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Konfirmasi Penerimaan Barang</h2>
        </div>

        <div className="p-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="font-semibold text-sm text-foreground">{item.partName || `Part #${item.sparePartId}`}</div>
                <div className="text-xs text-muted-foreground">Order: {item.quantity} | Sudah diterima: {item.receivedQty || 0}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Terima:</label>
                <input
                  type="number"
                  min={0}
                  max={item.quantity - (item.receivedQty || 0)}
                  value={receivedQtys[item.id!] || 0}
                  onChange={(e) =>
                    setReceivedQtys((prev) => ({ ...prev, [item.id!]: parseInt(e.target.value) || 0 }))
                  }
                  className="w-20 h-8 text-center text-sm font-bold border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-background hover:bg-muted/50 text-muted-foreground font-bold text-sm uppercase rounded-xl border border-border transition-all motion-safe:active:scale-98"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm uppercase rounded-xl shadow-lg transition-all disabled:opacity-50 motion-safe:active:scale-98"
          >
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Penerimaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
