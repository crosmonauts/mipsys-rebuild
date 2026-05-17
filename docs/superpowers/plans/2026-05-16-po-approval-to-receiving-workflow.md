# PO Approval-to-Receiving Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add detail modal and receiving modal to Part Order page so admin can transition PO through ORDERED → SHIPPED → RECEIVED workflow.

**Architecture:** Add a detail modal (triggered by clicking a PO row) that shows full PO info + action buttons per status, and a receiving modal (triggered from detail modal) for goods receipt with per-item quantity input. Backend already supports all needed endpoints and state machine transitions.

**Tech Stack:** Next.js, React, Tailwind, NestJS, Drizzle, MySQL

---

### Task 1: Add `receivePO` to part-order API & types

**Files:**
- Modify: `mipsys-frontend-v2/src/features/part-order/api/po-api.ts`
- Modify: `mipsys-frontend-v2/src/features/part-order/types/index.ts`

- [ ] **Step 1: Add `ReceivePoItem` and `ReceivePoDto` types to `types/index.ts`**

Add after `CreatePurchaseOrderDto`:
```typescript
export interface ReceivePoItem {
  poItemId: number;
  receivedQty: number;
}
```

- [ ] **Step 2: Add `receivePO` method to `po-api.ts`**

Add after `updateStatus`:
```typescript
  receivePO: async (id: number, items: { poItemId: number; receivedQty: number }[]) => {
    const response = await apiClient.patch(`/purchase-orders/${id}/receive`, { items, performedBy: 1 });
    return response.data;
  },
```

- [ ] **Step 3: Verify**

Run `npx tsc --noEmit` (or check that imports resolve in the IDE)

---

### Task 2: Create `POReceivingModal` component

**Files:**
- Create: `mipsys-frontend-v2/src/features/part-order/components/POReceivingModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client';

import { useState } from 'react';
import { poApi } from '../api/po-api';
import type { PurchaseOrderItem } from '../types';
import { toast } from 'react-hot-toast';

interface POReceivingModalProps {
  poId: number;
  items: PurchaseOrderItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export function POReceivingModal({ poId, items, onClose, onSuccess }: POReceivingModalProps) {
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

      await poApi.receivePO(poId, payload);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Konfirmasi Penerimaan Barang</h2>
        </div>

        <div className="p-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <div className="font-semibold text-sm text-slate-900">{item.partName || `Part #${item.sparePartId}`}</div>
                <div className="text-xs text-slate-500">Order: {item.quantity} | Sudah diterima: {item.receivedQty || 0}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Terima:</label>
                <input
                  type="number"
                  min={0}
                  max={item.quantity - (item.receivedQty || 0)}
                  value={receivedQtys[item.id!] || 0}
                  onChange={(e) =>
                    setReceivedQtys((prev) => ({ ...prev, [item.id!]: parseInt(e.target.value) || 0 }))
                  }
                  className="w-20 h-8 text-center text-sm font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 bg-white hover:bg-slate-100 text-slate-500 font-bold text-sm uppercase rounded-xl border border-slate-300 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : 'Konfirmasi Penerimaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the component file**

Write the above code to `src/features/part-order/components/POReceivingModal.tsx`.

---

### Task 3: Create `PODetailModal` component

**Files:**
- Create: `mipsys-frontend-v2/src/features/part-order/components/PODetailModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
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
```

- [ ] **Step 2: Create the component file**

Write the above code to `src/features/part-order/components/PODetailModal.tsx`.

---

### Task 4: Wire modal into Part Order page

**Files:**
- Modify: `mipsys-frontend-v2/src/app/part-order/page.tsx`

- [ ] **Step 1: Add imports for modal + new icons**

Add to the existing imports:
```typescript
import { PODetailModal } from '@/src/features/part-order/components/PODetailModal';
```

Add `Eye` to the `lucide-react` imports.

- [ ] **Step 2: Add state for selected PO**

After `const [statusFilter, setStatusFilter]` line, add:
```typescript
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
```

- [ ] **Step 3: Remove inline approve/cancel buttons, add row click + eye icon**

Replace the table row (`<tr key={order.id} ...>`) section with:
```typescript
                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedPoId(order.id)}>
```

Replace the pencil edit button link `<Link href={`/part-order/new?id=${order.id}`}>` with the eye icon for viewing detail, keeping the edit link as a separate icon:

Replace the action cells content (`<td className="p-5 text-center pr-8">`) with:
```typescript
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/part-order/new?id=${order.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl hover:bg-blue-600 hover:text-white transition-all border-2 border-transparent hover:border-blue-700"
                            >
                              <Pencil size={18} />
                            </Button>
                          </Link>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPoId(order.id); }}
                            className="h-10 w-10 rounded-xl hover:bg-slate-600 hover:text-white transition-all border-2 border-transparent hover:border-slate-700 bg-slate-50 text-slate-500"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
```

Remove the old approve button block and cancel button block (lines `(order.status === 'DRAFT' || order.status === 'REQUESTED') && (` through the cancel button closing `)}`).

- [ ] **Step 4: Add the modal rendering**

Before the closing `</div>` of the page component, add:
```typescript
      {selectedPoId && (
        <PODetailModal
          poId={selectedPoId}
          onClose={() => setSelectedPoId(null)}
          onRefresh={refetch}
        />
      )}
```

---

### Task 5: Verify

**Files:** none

- [ ] **Step 1: Check TypeScript compilation**

Run: `npx tsc --noEmit` (if the environment supports it) or manually verify imports resolve.

- [ ] **Step 2: Verify flow end-to-end**

1. Open `/part-order` → see PO list with eye icon on each row
2. Click row or eye icon → modal opens with PO details
3. For APPROVED PO → click "Pesan ke Pusat" → status changes to ORDERED
4. For ORDERED PO → click "Tandai Dikirim" → status changes to SHIPPED
5. For SHIPPED PO → click "Terima Barang" → receiving modal opens
6. Enter qty → submit → status changes to RECEIVED (or PARTIALLY_RECEIVED)
7. Close modal → list refreshes with new status
