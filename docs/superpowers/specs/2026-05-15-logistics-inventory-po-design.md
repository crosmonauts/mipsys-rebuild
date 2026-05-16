# Design Spec: Fase Logistik — Master Inventory & Purchase Order

**Date:** 2026-05-15
**Status:** Approved
**Author:** Mipsys V2 Team

## Overview

Fase Logistik adalah fondasi ekosistem Mipsys V2. Modul ini mengelola Master Inventory suku cadang Epson dan Purchase Order lifecycle, memastikan integritas stok sebelum unit servis dapat diproses. Sistem memastikan tidak ada barang keluar tanpa tiket servis yang sah, dan stok yang menipis otomatis memicu proses pemesanan.

## Architecture

### Backend Structure

```
mipsys-backend/src/
├── inventory/
│   ├── dto/
│   ├── inventory.controller.ts
│   ├── inventory.service.ts
│   └── inventory.module.ts
├── purchase-orders/
│   ├── dto/
│   ├── po.controller.ts
│   ├── po.service.ts
│   └── po.module.ts
└── database/schema/
    ├── inventory.schema.ts
    └── purchase-orders.schema.ts
```

### Frontend Structure

```
mipsys-frontend-v2/src/features/
├── inventory/
│   ├── api/inventory-api.ts
│   ├── hooks/useInventory.ts
│   ├── components/
│   │   ├── InventoryList.tsx
│   │   ├── InventoryDetail.tsx
│   │   ├── StockMovementHistory.tsx
│   │   └── LowStockAlert.tsx
│   └── pages/InventoryPage.tsx
└── purchase-orders/
    ├── api/po-api.ts
    ├── hooks/usePurchaseOrders.ts
    ├── components/
    │   ├── POList.tsx
    │   ├── POCreate.tsx
    │   ├── PODetail.tsx
    │   ├── POApproval.tsx
    │   └── POReceiving.tsx
    └── pages/PurchaseOrdersPage.tsx
```

## Data Model

### spare_parts (extend existing)

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Already exists |
| partName | VARCHAR(255) | Already exists |
| partCode | VARCHAR(100) | Unique, not null |
| stock | INT | Default 0, NOT NULL |
| minStock | INT | Threshold untuk trigger PO, default 5 |
| unitPrice | DECIMAL(12,2) | Harga satuan saat ini |
| location | VARCHAR(100) | Lokasi rak di gudang |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### stock_movements

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Auto increment |
| sparePartId | INT FK | → spareParts.id |
| quantity | INT | Positif = in, negatif = out |
| movementType | ENUM | PO_RECEIVE, SERVICE_USE, ADJUSTMENT, SERVICE_RETURN |
| referenceType | VARCHAR(50) | PO_TICKET, SR_TICKET |
| referenceId | VARCHAR(100) | Nomor PO atau tiket SR |
| performedBy | INT FK | → staff.id |
| notes | TEXT | |
| createdAt | TIMESTAMP | |

**Tidak ada adjustment manual.** Stok hanya berubah melalui PO_RECEIVE atau SERVICE_USE.

### purchase_orders

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Auto increment |
| poNumber | VARCHAR(100) | Unique, format: PO-YYYYMMDD-XXXX |
| supplierName | VARCHAR(50) | Default 'EPSON' |
| status | ENUM | DRAFT, REQUESTED, APPROVED, ORDERED, SHIPPED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| requestedBy | INT FK | → staff.id |
| approvedBy | INT FK | → staff.id, nullable |
| orderDate | DATE | |
| expectedDate | DATE | |
| receivedDate | DATE | |
| totalAmount | DECIMAL(14,2) | Calculated |
| notes | TEXT | |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

### po_items

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK | Auto increment |
| purchaseOrderId | INT FK | → purchaseOrders.id |
| sparePartId | INT FK | → spareParts.id |
| quantity | INT | Not null |
| unitPrice | DECIMAL(12,2) | Harga dari supplier saat order |
| receivedQty | INT | Default 0 |
| subtotal | DECIMAL(14,2) | Generated: qty × unitPrice |

## Business Logic

### Stock Movement Rules

Setiap perubahan stok HARUS melalui `stock_movements`:

| movementType | Direction | Trigger |
|---|---|---|
| PO_RECEIVE | IN (+) | PO diterima di gudang |
| SERVICE_USE | OUT (-) | Part digunakan di servis |
| ADJUSTMENT | +/- | Koreksi stok oleh admin gudang (dengan catatan wajib) |
| SERVICE_RETURN | IN (+) | Part bekas servis dikembalikan ke gudang (refurbished/unused) |

Stock di `spare_parts.stock` diupdate dalam transaction yang sama. Jika movement gagal, stock rollback. **ADJUSTMENT** wajib menyertakan `notes` yang menjelaskan alasan koreksi. **SERVICE_RETURN** mencatat part yang dikembalikan dari servis (refurbished atau tidak terpakai).

### Low Stock Detection & Auto-PO Trigger

Setelah setiap stock movement yang mengurangi stok:
- Cek: `IF newStock < minStock → trigger auto-PO`
- Auto-PO membuat PO dengan status `DRAFT`, berisi part yang low stock, quantity = `minStock * 2`
- PO status `DRAFT` muncul di notifikasi admin untuk di-review dan submit untuk approval

### Soft Block di Service Request

Ketika teknisi memilih part di DiagnosisModal:
- Jika `stock <= 0`: part tetap bisa dipilih tapi ditandai "Low Stock — akan trigger PO"
- Jika `stock > 0` tapi `< minStock`: ditandai "Stock menipis"
- Tidak ada hard block — servis bisa lanjut dengan status "Menunggu Part"

### Purchase Order State Machine

```
DRAFT → REQUESTED → APPROVED → ORDERED → SHIPPED → PARTIALLY_RECEIVED → RECEIVED
  ↓         ↓          ↓                        ↓            ↓
CANCEL   CANCEL     CANCEL                   CANCEL       CANCEL
```

| From | To | Role | Action |
|------|-----|------|--------|
| DRAFT | REQUESTED | Admin | Submit untuk approval |
| DRAFT | CANCEL | Admin | Batalkan |
| REQUESTED | APPROVED | Manager/Admin | Approve PO |
| REQUESTED | CANCEL | Manager/Admin | Tolak/batalkan |
| APPROVED | ORDERED | Admin | Kirim ke Epson |
| ORDERED | SHIPPED | Admin | Update status |
| SHIPPED | PARTIALLY_RECEIVED | Admin/Gudang | Terima sebagian barang (qty terima < qty order) |
| SHIPPED | RECEIVED | Admin/Gudang | Terima seluruh barang |
| PARTIALLY_RECEIVED | PARTIALLY_RECEIVED | Admin/Gudang | Terima sisa barang bertahap |
| PARTIALLY_RECEIVED | RECEIVED | Admin/Gudang | Terima sisa terakhir — semua item lengkap |
| RECEIVED | - | - | Terminal |

### PO Approval Workflow

1. PO dibuat → status `DRAFT`
2. Admin klik "Submit for Approval" → status `REQUESTED`
3. PO muncul di approval queue
4. Approver klik "Approve" → status `APPROVED`, tercatat `approvedBy` dan timestamp
5. Approver bisa "Reject" → status kembali ke `DRAFT` dengan catatan penolakan

### Atomic Transaction saat PO RECEIVED

```
BEGIN TRANSACTION
  1. UPDATE purchase_orders SET status = 'RECEIVED' | 'PARTIALLY_RECEIVED', receivedDate = NOW()
  2. FOR EACH po_item:
     a. UPDATE spare_parts SET stock = stock + receivedQty WHERE id = sparePartId
     b. UPDATE spare_parts SET unitPrice = po_item.unitPrice WHERE id = sparePartId  // harga beli terbaru
     c. INSERT INTO stock_movements (sparePartId, quantity, movementType='PO_RECEIVE', referenceId=poNumber)
  3. INSERT service_log (action='PO_RECEIVED', description='PO xxx received, stock updated')
COMMIT
```

Jika salah satu step gagal, seluruh transaction rollback.

## Frontend UI/UX Design

### Design System

- **Layout:** Top Nav Only (no sidebar) — navigation di atas, konten langsung di bawah
- **Color palette:** Slate (#0f172a) primary, white cards dengan subtle borders
- **Typography:** System font stack, 14px minimum body, 12px uppercase labels dengan letter-spacing
- **Spacing:** 32px page padding, 16-20px cell padding
- **WCAG AA compliance:** Contrast ratio ≥ 4.5:1, visible focus states, semantic HTML + ARIA, readable typography

### Status Badge Colors (WCAG AA compliant)

| Status | Background | Text | Ratio |
|--------|-----------|------|-------|
| OK | #dcfce7 | #166534 | ≥ 4.5:1 |
| LOW | #fef3c7 | #92400e | ≥ 4.5:1 |
| EMPTY | #fee2e2 | #991b1b | ≥ 4.5:1 |

### PO Status Badge Colors

| Status | Color |
|--------|-------|
| DRAFT | Gray (#6b7280) |
| REQUESTED | Yellow (#d97706) |
| APPROVED | Blue (#2563eb) |
| ORDERED | Purple (#7c3aed) |
| SHIPPED | Cyan (#0891b2) |
| PARTIALLY_RECEIVED | Orange (#ea580c) |
| RECEIVED | Green (#16a34a) |
| CANCELLED | Red (#dc2626) |

### InventoryList Page

- Tabel utama: Part Code, Nama, Stok, Min Stock, Harga, Lokasi, Status
- Status badge: OK (hijau), LOW (kuning), EMPTY (merah)
- Search bar untuk filter by nama/part code
- Tombol "Buat PO" di header
- Klik bar → navigasi ke InventoryDetail
- LowStockAlert banner di atas halaman: daftar part yang perlu diorder

### InventoryDetail Page

- Header: info lengkap part (nama, code, lokasi, harga, stok, min stock)
- Visual indicator: progress bar stok vs min stock
- Tombol "Buat PO untuk part ini"
- StockMovementHistory embedded: tabel riwayat pergerakan (tanggal, tipe, qty, referensi)
- View-only untuk integritas data — tidak ada form edit stok

### LowStockAlert Component (reusable)

- Badge di navbar menampilkan jumlah part low stock
- Dropdown/modal menampilkan daftar part: nama, stok saat ini, min stock, selisih
- Tombol "Buat PO" langsung ke POCreate dengan part sudah ter-pre-filled

### POList Page

- Tabel: PO Number, Tanggal, Supplier (Epson), Status, Total Amount, Requested By
- Status badge dengan warna sesuai tabel di atas
- Filter by status
- Tombol "Buat PO Baru"
- Klik bar → PODetail
- Approval badge di baris yang statusnya `REQUESTED`

### POCreate Page

- Form 2 section:
  1. **Header PO**: auto-fill supplier = "Epson", order date = today, expected date = date picker
  2. **Item List**: Search part, tambah ke list dengan qty dan harga, tabel item dengan subtotal
- Total amount auto-sum
- Tombol "Simpan Draft" (DRAFT) dan "Submit untuk Approval" (REQUESTED)
- Validasi: minimal 1 item, qty > 0, harga > 0

### PODetail Page

- Header: PO info + status badge + timeline progress
- Tabel item PO dengan received qty
- Section actions berdasarkan status:
  - `DRAFT`: Edit, Submit, Cancel
  - `REQUESTED`: Approve, Reject (hanya approver)
  - `APPROVED`: Mark Ordered, Cancel
  - `ORDERED`: Mark Shipped
  - `SHIPPED`: Mark Received → buka POReceiving modal
  - `PARTIALLY_RECEIVED`: Mark Received → buka POReceiving modal (untuk sisa item)
  - `RECEIVED`: View only

### POApproval Modal

- Summary PO: items, total, requested by, tanggal
- Textarea catatan approval (opsional)
- Tombol "Approve" dan "Reject"

### POReceiving Modal

- Daftar item PO dengan qty yang diorder
- Input field untuk qty received per item (default = qty order, bisa dikurangi)
- **Logika status otomatis:**
  - Jika semua item qty terima = qty order → status `RECEIVED`
  - Jika ada item qty terima < qty order → status `PARTIALLY_RECEIVED`
- Tombol "Konfirmasi Penerimaan" → trigger atomic transaction
- Loading state + success toast setelah selesai

## API Endpoints

### Inventory

```
GET    /inventory/parts?search=xxx&status=all|ok|low|empty
GET    /inventory/parts/:id
GET    /inventory/parts/:id/movements
POST   /inventory/parts/:id/reserve        { quantity, srTicketNumber }
GET    /inventory/low-stock-alert
```

### Purchase Orders

```
GET    /purchase-orders
POST   /purchase-orders
GET    /purchase-orders/:id
PATCH  /purchase-orders/:id/status         { action: 'submit'|'approve'|'reject'|'order'|'ship'|'receive' }
```

### Integration dengan Service Request

Existing endpoint `GET /spare-parts/search` di `service-requests` module akan di-proxy ke `/inventory/parts`. `DiagnosisModal` tetap pakai `srApi.searchSpareParts` — implementasi backend diarahkan ke inventory module tanpa mengubah frontend.

## Error Handling

### Inventory Errors

| Scenario | Response | User Feedback |
|---|---|---|
| Part not found | 404 | "Part tidak ditemukan" |
| Stock insufficient untuk reservasi | 409 Conflict | "Stok tidak mencukupi — part akan masuk antrian PO" |
| Duplicate part code | 409 Conflict | "Part code sudah terdaftar" |
| DB connection fail | 500 | "Gagal terhubung ke database — coba lagi" |

### PO Errors

| Scenario | Response | User Feedback |
|---|---|---|
| Approve PO bukan REQUESTED | 400 Bad Request | "PO tidak dalam status menunggu approval" |
| Receive PO bukan SHIPPED atau PARTIALLY_RECEIVED | 400 Bad Request | "PO belum ditandai sebagai dikirim" |
| PO tanpa items | 400 Bad Request | "PO harus memiliki minimal 1 item" |

### Global Error Format

```json
{
  "statusCode": 400,
  "message": "PO harus memiliki minimal 1 item",
  "timestamp": "2026-05-15T10:30:00.000Z"
}
```

## Testing Strategy

### Unit Tests
- `inventory.service.ts`: stock movement calculation, low stock detection
- `po.service.ts`: state machine transitions, approval workflow
- Atomic transaction: verify stock update + movement insert dalam satu transaction

### Integration Tests
- PO receive → verify stock updated, movement recorded
- Reserve stock → verify stock decreased, movement recorded
- State machine: coba invalid transition → verify rejected

### E2E Tests (frontend)
- Inventory list: search, filter, pagination
- PO create → submit → approve → receive → verify stock increased
- Low stock alert → click "Buat PO" → pre-filled form

## System Integrity Guarantees

1. **Integritas Stok:** Tidak ada barang keluar tanpa tiket servis yang sah. Setiap pergerakan tercatat di `stock_movements`.
2. **Integritas Prosedur:** PO status mengalir linier melalui state machine. Invalid transitions ditolak di service layer dengan SELECT FOR UPDATE lock untuk mencegah race condition.
3. **Integritas Finansial:** Harga part di PO menggunakan snapshot (`unitPrice` saat order), konsisten meskipun harga pasar berubah.
