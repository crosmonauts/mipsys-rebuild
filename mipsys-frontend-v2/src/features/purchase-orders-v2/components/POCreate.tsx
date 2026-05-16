'use client';

import { useState } from 'react';
import { poApi } from '../api/po-api';
import { inventoryApi, InventoryPart } from '@/src/features/inventory/api/inventory-api';
import { toast } from 'react-hot-toast';

interface POCreateProps {
  onClose: () => void;
  onSuccess: () => void;
  preFilledParts?: InventoryPart[];
}

interface PoItemInput {
  part: InventoryPart;
  quantity: number;
  unitPrice: number;
}

export function POCreate({ onClose, onSuccess, preFilledParts = [] }: POCreateProps) {
  const [items, setItems] = useState<PoItemInput[]>(
    preFilledParts.map((p) => ({ part: p, quantity: p.minStock * 2, unitPrice: Number(p.price) }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryPart[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearch(query: string) {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const results = await inventoryApi.searchParts(query);
      setSearchResults(results);
    } catch { setSearchResults([]); }
  }

  function addPart(part: InventoryPart) {
    if (items.find((i) => i.part.id === part.id)) {
      toast.error('Part sudah ditambahkan');
      return;
    }
    setItems([...items, { part, quantity: part.minStock * 2, unitPrice: Number(part.price) }]);
    setSearchQuery('');
    setSearchResults([]);
  }

  async function handleSubmit(asDraft: boolean) {
    if (items.length === 0) { toast.error('PO harus memiliki minimal 1 item'); return; }

    setIsSubmitting(true);
    try {
      await poApi.create({
        items: items.map((i) => ({ sparePartId: i.part.id, quantity: i.quantity, unitPrice: i.unitPrice })),
        requestedBy: 1,
      });

      toast.success(asDraft ? 'PO Draft berhasil disimpan' : 'PO berhasil diajukan untuk approval');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat PO');
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Buat Purchase Order Baru</h2>
          <p className="text-sm text-slate-500 mt-1">Supplier: Epson (default)</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari part untuk ditambahkan..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              aria-label="Search parts to add to PO"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-lg">
                {searchResults.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => addPart(part)}
                    className="w-full px-4 py-3 flex justify-between items-center hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{part.partName}</div>
                      <div className="text-xs text-slate-500">{part.partCode} | Stok: {part.stock}</div>
                    </div>
                    <div className="text-sm font-bold text-slate-900">Rp {Number(part.price).toLocaleString('id-ID')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.part.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-slate-900">{item.part.partName}</div>
                    <div className="text-xs text-slate-500">{item.part.partCode}</div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].quantity = parseInt(e.target.value) || 1;
                      setItems(newItems);
                    }}
                    className="w-20 h-8 text-center text-sm border border-slate-300 rounded-md"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].unitPrice = parseInt(e.target.value) || 0;
                      setItems(newItems);
                    }}
                    className="w-28 h-8 text-center text-sm border border-slate-300 rounded-md"
                  />
                  <button
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
            <span className="font-bold text-slate-900">Total</span>
            <span className="text-lg font-extrabold text-slate-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-white hover:bg-slate-100 text-slate-500 font-bold text-sm uppercase rounded-xl border border-slate-300"
          >
            Batal
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || items.length === 0}
            className="flex-1 h-12 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm uppercase rounded-xl disabled:opacity-50"
          >
            Simpan Draft
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting || items.length === 0}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase rounded-xl shadow-lg disabled:opacity-50"
          >
            Submit untuk Approval
          </button>
        </div>
      </div>
    </div>
  );
}
