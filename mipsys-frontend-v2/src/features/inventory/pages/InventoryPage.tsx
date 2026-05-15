'use client';

import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { InventoryList } from '../components/InventoryList';
import { LowStockAlert } from '../components/LowStockAlert';
import { InventoryPart } from '../api/inventory-api';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ok' | 'low' | 'empty' | undefined>();
  const { parts, isLoading } = useInventory(search, statusFilter);
  const [selectedPart, setSelectedPart] = useState<InventoryPart | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-600 mt-1">Kelola stok suku cadang Epson</p>
        </div>
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Cari part..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label="Search parts"
          />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value as any || undefined)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label="Filter by status"
          >
            <option value="">Semua Status</option>
            <option value="ok">OK</option>
            <option value="low">Low Stock</option>
            <option value="empty">Empty</option>
          </select>
        </div>
      </div>

      <LowStockAlert />
      <InventoryList parts={parts} isLoading={isLoading} onPartClick={setSelectedPart} />
    </div>
  );
}
