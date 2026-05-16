'use client';

import { useState, useEffect } from 'react';
import { poApi } from '../api/po-api';
import { PO_STATUS_LABEL, PO_STATUS_BADGE } from '../types';
import type { PurchaseOrder, PoStatus } from '../types';
import { POReceivingModal } from './POReceivingModal';
import { toast } from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';

interface PODetailModalProps {
  poId: number;
  onClose: () => void;
  onRefresh: () => void;
}

export function PODetailModal({ poId, onClose, onRefresh }: PODetailModalProps) {
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceiving, setShowReceiving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  async function loadPO() {
    try {
      setIsLoading(true);
      const result = await poApi.getById(poId);
      setPo(result);
    } catch {
      toast.error('Gagal memuat detail PO');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadPO(); }, [poId]);

  async function handleStatusChange(newStatus: PoStatus) {
    setStatusLoading(true);
    try {
      await poApi.updateStatus(poId, newStatus);
      toast.success(`Status PO → ${PO_STATUS_LABEL[newStatus]}`);
      await loadPO();
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal update status');
    } finally {
      setStatusLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader2 className="animate-spin mx-auto" size={24} />
        </div>
      </div>
    );
  }

  if (!po) return null;

  const totalReceived = po.items?.reduce((sum, i) => sum + (i.receivedQty || 0), 0) ?? 0;
  const totalOrdered = po.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{po.poNumber}</h2>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tight ${PO_STATUS_BADGE[po.status]}`}>
                {PO_STATUS_LABEL[po.status]}
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Supplier:</span> <span className="font-semibold">{po.supplierName}</span></div>
              <div><span className="text-slate-500">Total:</span> <span className="font-semibold">Rp {parseFloat(po.totalAmount || '0').toLocaleString('id-ID')}</span></div>
              <div><span className="text-slate-500">Tanggal:</span> <span className="font-semibold">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('id-ID') : '-'}</span></div>
              <div><span className="text-slate-500">Diterima:</span> <span className="font-semibold">{totalReceived}/{totalOrdered}</span></div>
            </div>

            {po.notes && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">{po.notes}</div>
            )}

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left py-2 px-3 font-bold text-slate-500">Nama Part</th>
                    <th className="text-right py-2 px-3 font-bold text-slate-500">Qty</th>
                    <th className="text-right py-2 px-3 font-bold text-slate-500">Harga</th>
                    <th className="text-right py-2 px-3 font-bold text-slate-500">Diterima</th>
                    <th className="text-right py-2 px-3 font-bold text-slate-500">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items?.map((item) => {
                    const subtotal = item.quantity * parseFloat(item.unitPrice || '0');
                    return (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-medium">{item.partName || `Part #${item.sparePartId}`}</td>
                        <td className="py-2 px-3 text-right">{item.quantity}</td>
                        <td className="py-2 px-3 text-right">Rp {parseFloat(item.unitPrice || '0').toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right">{item.receivedQty || 0}</td>
                        <td className="py-2 px-3 text-right font-semibold">Rp {subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
              {po.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange('REQUESTED')}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Minta Approval
                </button>
              )}
              {po.status === 'REQUESTED' && (
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Setujui
                </button>
              )}
              {po.status === 'APPROVED' && (
                <button
                  onClick={() => handleStatusChange('ORDERED')}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Pesan ke Pusat
                </button>
              )}
              {po.status === 'ORDERED' && (
                <button
                  onClick={() => handleStatusChange('SHIPPED')}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Tandai Dikirim
                </button>
              )}
              {(po.status === 'SHIPPED' || po.status === 'PARTIALLY_RECEIVED') && (
                <button
                  onClick={() => setShowReceiving(true)}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Terima Barang
                </button>
              )}
              {!['RECEIVED', 'CANCELLED'].includes(po.status) && (
                <button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={statusLoading}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceiving && po.items && (
        <POReceivingModal
          poId={po.id}
          items={po.items}
          onClose={() => setShowReceiving(false)}
          onSuccess={() => { loadPO(); onRefresh(); }}
        />
      )}
    </>
  );
}
