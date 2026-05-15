'use client';

import { useState } from 'react';
import { PurchaseOrder } from '../api/po-api';
import { StatusBadge } from '@/src/components/layout/StatusBadge';
import { POApproval } from './POApproval';
import { POReceiving } from './POReceiving';
import { poApi } from '../api/po-api';
import { toast } from 'react-hot-toast';

const statusVariantMap: Record<string, any> = {
  DRAFT: 'draft', REQUESTED: 'requested', APPROVED: 'approved',
  ORDERED: 'ordered', SHIPPED: 'shipped', PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received', CANCELLED: 'cancelled',
};

interface PODetailProps {
  po: PurchaseOrder;
  onClose: () => void;
  onRefresh: () => void;
}

export function PODetail({ po, onClose, onRefresh }: PODetailProps) {
  const [showApproval, setShowApproval] = useState(false);
  const [showReceiving, setShowReceiving] = useState(false);

  async function handleStatusChange(newStatus: string) {
    try {
      await poApi.updateStatus(po.id, newStatus, 1);
      toast.success(`Status PO → ${newStatus}`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal update status');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{po.poNumber}</h2>
            <StatusBadge status={po.status} variant={statusVariantMap[po.status] || 'draft'} />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl" aria-label="Close PO detail">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Supplier:</span> <span className="font-semibold">{po.supplierName}</span></div>
            <div><span className="text-slate-500">Total:</span> <span className="font-semibold">Rp {Number(po.totalAmount).toLocaleString('id-ID')}</span></div>
            <div><span className="text-slate-500">Tanggal:</span> <span className="font-semibold">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('id-ID') : '-'}</span></div>
            <div><span className="text-slate-500">Expected:</span> <span className="font-semibold">{po.expectedDate || '-'}</span></div>
          </div>

          {po.notes && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700">{po.notes}</div>
          )}

          <div>
            <h3 className="font-bold text-slate-900 mb-2">Items</h3>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-2 px-3 font-bold text-slate-500">Part ID</th>
                  <th className="text-right py-2 px-3 font-bold text-slate-500">Qty</th>
                  <th className="text-right py-2 px-3 font-bold text-slate-500">Harga</th>
                  <th className="text-right py-2 px-3 font-bold text-slate-500">Diterima</th>
                  <th className="text-right py-2 px-3 font-bold text-slate-500">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {po.items?.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-mono">{item.sparePartId}</td>
                    <td className="py-2 px-3 text-right">{item.quantity}</td>
                    <td className="py-2 px-3 text-right">Rp {Number(item.unitPrice).toLocaleString('id-ID')}</td>
                    <td className="py-2 px-3 text-right">{item.receivedQty}</td>
                    <td className="py-2 px-3 text-right font-semibold">Rp {Number(item.subtotal).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 pt-4 border-t border-slate-200">
            {po.status === 'DRAFT' && (
              <>
                <button onClick={() => handleStatusChange('REQUESTED')} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">Submit untuk Approval</button>
                <button onClick={() => handleStatusChange('CANCELLED')} className="px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-lg">Cancel</button>
              </>
            )}
            {po.status === 'REQUESTED' && (
              <button onClick={() => setShowApproval(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg">Approve</button>
            )}
            {po.status === 'APPROVED' && (
              <button onClick={() => handleStatusChange('ORDERED')} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg">Mark Ordered</button>
            )}
            {po.status === 'ORDERED' && (
              <button onClick={() => handleStatusChange('SHIPPED')} className="px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg">Mark Shipped</button>
            )}
            {(po.status === 'SHIPPED' || po.status === 'PARTIALLY_RECEIVED') && (
              <button onClick={() => setShowReceiving(true)} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg">Mark Received</button>
            )}
          </div>
        </div>
      </div>

      {showApproval && (
        <POApproval
          po={po}
          onApprove={() => { handleStatusChange('APPROVED'); setShowApproval(false); }}
          onReject={() => { handleStatusChange('DRAFT'); setShowApproval(false); }}
          onClose={() => setShowApproval(false)}
        />
      )}

      {showReceiving && (
        <POReceiving
          poId={po.id}
          items={po.items || []}
          onClose={() => setShowReceiving(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
