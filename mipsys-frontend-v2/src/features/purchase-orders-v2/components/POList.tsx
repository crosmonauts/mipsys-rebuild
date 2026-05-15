'use client';

import { StatusBadge } from '@/src/components/layout/StatusBadge';
import { PurchaseOrder } from '../api/po-api';

const statusVariantMap: Record<string, any> = {
  DRAFT: 'draft',
  REQUESTED: 'requested',
  APPROVED: 'approved',
  ORDERED: 'ordered',
  SHIPPED: 'shipped',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
};

interface POListProps {
  orders: PurchaseOrder[];
  isLoading: boolean;
  onOrderClick: (order: PurchaseOrder) => void;
}

export function POList({ orders, isLoading, onOrderClick }: POListProps) {
  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data PO...</div>;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full" role="table" aria-label="Purchase orders list">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">PO Number</th>
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</th>
            <th scope="col" className="text-center py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="text-right py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
            <th scope="col" className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((po) => (
            <tr
              key={po.id}
              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
              onClick={() => onOrderClick(po)}
              role="row"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOrderClick(po)}
            >
              <td className="py-3 px-5 font-mono font-semibold text-slate-900">{po.poNumber}</td>
              <td className="py-3 px-5 text-slate-700">{po.supplierName}</td>
              <td className="py-3 px-5 text-center">
                <StatusBadge status={po.status} variant={statusVariantMap[po.status] || 'draft'} />
              </td>
              <td className="py-3 px-5 text-right font-semibold text-slate-900">
                Rp {Number(po.totalAmount).toLocaleString('id-ID')}
              </td>
              <td className="py-3 px-5 text-slate-500 text-sm">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('id-ID') : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="p-8 text-center text-slate-500">Belum ada purchase order.</div>
      )}
    </div>
  );
}
