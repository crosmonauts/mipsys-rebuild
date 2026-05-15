'use client';

import { useState } from 'react';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { POList } from '../components/POList';
import { PODetail } from '../components/PODetail';
import { POCreate } from '../components/POCreate';
import { PurchaseOrder } from '../api/po-api';

export default function PurchaseOrdersPage() {
  const { orders, isLoading, refetch } = usePurchaseOrders();
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-slate-600 mt-1">Kelola pemesanan suku cadang ke Epson</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          + Buat PO Baru
        </button>
      </div>

      <POList orders={orders} isLoading={isLoading} onOrderClick={setSelectedPO} />

      {selectedPO && (
        <PODetail po={selectedPO} onClose={() => setSelectedPO(null)} onRefresh={refetch} />
      )}

      {showCreate && (
        <POCreate onClose={() => setShowCreate(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
