'use client';

import { useState } from 'react';
import { PurchaseOrder } from '../api/po-api';

interface POApprovalProps {
  po: PurchaseOrder;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function POApproval({ po, onApprove, onReject, onClose }: POApprovalProps) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Approval PO: {po.poNumber}</h2>
        </div>

        <div className="p-6 space-y-3">
          <div className="text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total:</span>
              <span className="font-semibold">Rp {Number(po.totalAmount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Items:</span>
              <span className="font-semibold">{po.items?.length || 0} part</span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan approval (opsional)..."
            className="w-full p-3 border border-slate-300 rounded-lg text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label="Approval notes"
          />
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 bg-white text-slate-500 font-bold text-sm uppercase rounded-xl border border-slate-300">Batal</button>
          <button onClick={onReject} className="flex-1 h-12 bg-red-100 text-red-700 font-bold text-sm uppercase rounded-xl">Reject</button>
          <button onClick={onApprove} className="flex-1 h-12 bg-green-600 text-white font-bold text-sm uppercase rounded-xl">Approve</button>
        </div>
      </div>
    </div>
  );
}
