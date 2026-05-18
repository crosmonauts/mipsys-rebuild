# Feature Integration Blueprint: Service Request Flow Restructuring

## 1. Ringkasan Fitur & Batasan

**Tujuan:** Memisahkan diagnosis teknisi (pencatatan part) dari pemotongan stok gudang. Pemotongan stok hanya terjadi setelah:
- Admin membuat penawaran biaya
- Pelanggan menyetujui
- Sistem memverifikasi ketersediaan stok

**Batasan tegas (TIDAK termasuk):**
- ❌ Notifikasi WhatsApp/Email ke pelanggan
- ❌ Manajemen lampiran/upload foto
- ❌ Payment gateway integration
- ❌ Multi-warehouse / branch management

---

## 2. Perubahan yang Diperlukan

### 2a. State Machine (`sr-state-machine.guard.ts`)

Tambah status baru `AWAITING_PARTS` — untuk tiket yang part-nya tidak tersedia dan perlu PO:

```
WAITING_CHECK → CHECK → WAITING_APPROVE → SERVICE → DONE
                    ↘         ↓              ↑         ↑
                      CANCEL  AWAITING_PARTS ─╯         │
                                   ↓                    │
                              (PO → RECEIVED) ──────────╯
```

Transitions:
```
WAITING_APPROVE: ['SERVICE', 'AWAITING_PARTS', 'CANCEL']
AWAITING_PARTS:  ['SERVICE', 'CANCEL']   # setelah PO diterima & stok dicukupi
```

### 2b. Schema

`orderParts` table — tambah value `PROPOSED` pada enum `status`:
```
status: IN_STOCK | OUT_OF_STOCK | MANUAL_NEW | CANCELLED | PROPOSED
```

### 2c. Service Logic

| Langkah | Endpoint | Perubahan |
|---|---|---|
| **Diagnosis** | `POST /:ticketNumber/diagnose` | Hanya catat part sebagai `PROPOSED`. Hapus panggilan `reserveStock()`. Transisi → `WAITING_APPROVE`. |
| **Approve Quote** (baru) | `POST /:ticketNumber/approve-quote` | Admin set serviceFee, shippingFee. Sistem cek stok semua part PROPOSED: jika semua cukup → potong stok, set → `IN_STOCK`, transisi → `SERVICE`. Jika ada yang kurang → set → `OUT_OF_STOCK`, transisi → `AWAITING_PARTS`. |
| **PO Received Hook** (baru) | Di `purchase-orders` receipt | Saat PO diterima, cek apakah PO terkait SR tertentu. Jika ya → cek semua part SR: jika semua cukup → potong stok, transisi → `SERVICE`. |

### 2d. Frontend

| Komponen | Perubahan |
|---|---|
| `DiagnosisModal` | Status selector diubah: hanya `CHECK → WAITING_APPROVE`. Bagian stok berubah jadi informasi (bukan validasi keras). Part ditambah sebagai "usulan". |
| `ServiceRequestDetail` | Tambah tombol **"Buat Penawaran"** (muncul saat status WAITING_APPROVE). Buka modal quotation. |
| **Modal Quotation** (baru) | Input service fee, shipping fee. Tampilkan daftar part PROPOSED dengan harga. Tombol "Setujui → Proses" memanggil `approve-quote`. |
| Status badge & timeline | Tambah penanganan untuk `AWAITING_PARTS`. |

---

## 3. Defect & Risk Analysis

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Race condition stok** — 2 SR approve bersamaan untuk part yang sama, stok cuma cukup untuk 1 | Over-selling stok | Semua operasi stock cut harus dalam `db.transaction()` dengan `.for('update')` pada baris `spareParts` |
| **Part ditambah/dihapus setelah quotation** — Admin ubah part setelah penawaran dikirim | Harga tidak sesuai, stok berubah | Setelah WAITING_APPROVE, kunci daftar part (atau buat versi snapshot `price_locked`). Hanya admin yang bisa unlock. |
| **Illegal state bypass** — Teknisi langsung set SERVICE tanpa approval | Bypass flow entirely | State machine guard (`validateSrTransition`) WAJIB dipanggil. WAITING_APPROVE hanya bisa ke SERVICE atau AWAITING_PARTS via `approve-quote`. |
| **PO diterima sebagian** — PO dengan 5 item baru terima 3 | Stok belum penuh, SERVICE prematur | Cek `sum(receivedQty) < sum(quantity)` untuk semua part SR. Jika ada partial, tetap di AWAITING_PARTS. |
| **Kalkulasi finansial** — partFee di SR tidak sinkron dengan order_parts setelah price lock | Invoice salah | `approve-quote` harus mengunci `priceAtAction` di order_parts dan menghitung ulang `partFee` di SR dalam 1 transaksi. |

---

## 4. Fase Implementasi (Build Phases)

### Phase 1 — Schema & State Machine (estimasi: 0.5 jam)
1. Tambah `AWAITING_PARTS` ke enum `status_service` di schema
2. Tambah `PROPOSED` ke enum `status` di `orderParts` schema
3. Update `sr-state-machine.guard.ts` dengan transisi baru
4. `npm run db:push`

### Phase 2 — Backend API Refactor (estimasi: 1.5 jam)
1. Ubah `diagnose()` — hapus `reserveStock()`, set part status → `PROPOSED`, transisi → hanya `WAITING_APPROVE`
2. Buat `approveQuote()` method baru — serviceFee + shippingFee input, stock check loop, cut stock, transisi
3. Update controller — endpoint `POST /:ticketNumber/approve-quote`
4. Buat hook di `PurchaseOrdersService.receive()` — deteksi SR terkait, cek stok, transisi ke SERVICE
5. Update e2e tests

### Phase 3 — Frontend Refactor (estimasi: 1.5 jam)
1. Update `DiagnosisModal` — batasi status ke CHECK/WAITING_APPROVE, part sebagai usulan
2. Buat `ApproveQuoteModal` komponen baru — service fee, shipping fee, daftar part + harga, tombol setujui
3. Update `ServiceRequestDetail` — tampilkan tombol "Buat Penawaran" sesuai status
4. Update status rendering — handle `AWAITING_PARTS` di badge/timeline

### Phase 4 — Integrasi & UAT (estimasi: 0.5 jam)
1. Tes end-to-end: WAITING_CHECK → CHECK → WAITING_APPROVE → approve → SERVICE → DONE
2. Tes path stok kosong: WAITING_APPROVE → AWAITING_PARTS → PO → receive → SERVICE
3. Tes race condition: 2 SR approve simultan untuk part yang sama
4. `npm run lint` + `npm run test:e2e`
