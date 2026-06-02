'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { inventoryApi, InventoryPart } from '../api/inventory-api';

export function LowStockAlert() {
  const [alerts, setAlerts] = useState<InventoryPart[]>([]);

  useEffect(() => {
    const fetch = () => {
      inventoryApi.getLowStockAlert()
        .then(setAlerts)
        .catch(() => setAlerts([]));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) return null;

  const emptyParts = alerts.filter((p) => p.stock === 0);

  return (
    <div
      className="bg-destructive/10 border border-destructive/30 border-l-4 border-l-destructive rounded-lg p-4 mb-5 flex items-center gap-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300"
      role="alert"
    >
      <div className="p-1.5 bg-destructive/10 rounded-lg">
        <AlertTriangle size={20} className="text-destructive" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-destructive">
          {alerts.length} part membutuhkan pemesanan
        </div>
        {emptyParts.length > 0 && (
          <div className="text-xs text-destructive/80 mt-0.5 truncate">
            {emptyParts.map((p) => p.partName).join(', ')} — stok habis
          </div>
        )}
      </div>
      <Link
        href="/part-order/new"
        className="shrink-0 px-4 py-2 bg-destructive text-destructive-foreground border-none rounded-md text-sm font-semibold hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 transition-all"
      >
        Buat PO Sekarang
      </Link>
    </div>
  );
}
