'use client';

import { useEffect, useState } from 'react';
import { inventoryApi, InventoryPart } from '../api/inventory-api';
import { toast } from 'react-hot-toast';

export function LowStockAlert() {
  const [alerts, setAlerts] = useState<InventoryPart[]>([]);

  useEffect(() => {
    inventoryApi.getLowStockAlert()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div
      className="bg-red-50 border border-red-200 border-l-4 border-l-red-600 rounded-lg p-4 mb-5 flex items-center gap-3"
      role="alert"
    >
      <span className="text-xl" aria-hidden="true">⚠️</span>
      <div className="flex-1">
        <div className="text-sm font-bold text-red-900">
          {alerts.length} part membutuhkan pemesanan
        </div>
        <div className="text-xs text-red-800 mt-1">
          {alerts.filter((p) => p.stock === 0).map((p) => p.partName).join(', ')} — stok habis
        </div>
      </div>
      <button
        className="px-4 py-2 bg-red-600 text-white border-none rounded-md text-sm font-semibold cursor-pointer hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        onClick={() => toast.success('Navigasi ke Buat PO')}
      >
        Buat PO Sekarang
      </button>
    </div>
  );
}
