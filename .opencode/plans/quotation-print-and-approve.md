# Implementation Plan: Quotation Print & Approve Flow

## Summary
Split WAITING_APPROVE into 2 steps: (1) Save quote + print, (2) Approve or Cancel.

## Phase 1 — Backend (3 changes)

### 1a. New: `POST /:ticketNumber/save-quote`
- File: `service-requests.controller.ts` — add route
- File: `service-requests.service.ts` — add `saveQuote()` method
  - Validate status = WAITING_APPROVE
  - Calculate partFee from PROPOSED parts
  - Update SR: serviceFee, shippingFee, partFee, updatedAt
  - Do NOT change status
  - Log: `QUOTE_SAVED`
- File: `dto/save-quote.dto.ts` — new DTO (serviceFee, shippingFee optional, performedBy optional)

### 1b. New: `POST /:ticketNumber/cancel-quote`
- File: `service-requests.controller.ts` — add route
- File: `service-requests.service.ts` — add `cancelQuote()` method
  - Validate status = WAITING_APPROVE
  - Transition to CANCEL
  - Log: `QUOTE_REJECTED`
- File: `dto/cancel-quote.dto.ts` — new DTO (performedBy optional)

### 1c. Modify: `approveQuote()`
- Remove fee-saving logic (serviceFee, shippingFee, partFee update)
- Add validation: reject if quote not yet saved (serviceFee = 0 AND partFee = 0)
- Use existing SR values for fee display

## Phase 2 — Frontend (4 changes)

### 2a. `ApproveQuoteModal.tsx` — rewrite
- On mount: fetch serviceFee/shippingFee from SR if already saved
- Step 1: Fee input form (serviceFee, shippingFee) with parts list
- Step 2: On save success → show print preview (read-only, clean layout)
- Buttons: "Simpan Penawaran" → "Cetak" (window.print) + "Tutup"

### 2b. `sr-api.ts` — add methods
- `saveQuote(ticketNumber, { serviceFee, shippingFee, performedBy })`
- `cancelQuote(ticketNumber, { performedBy })`

### 2c. `ServiceRequestDetail.tsx` — conditional buttons
- WAITING_APPROVE + no quote → "Buat Penawaran" (existing)
- WAITING_APPROVE + quote saved → "Setujui" + "Batalkan" + "Cetak Penawaran"
- "Setujui" → call approveQuote API
- "Batalkan" → call cancelQuote API
- Also: add "DIAGNOSA" button (existing)

### 2d. `useServiceRequest.ts` — add fee fields
- Map: serviceFee, partFee, shippingFee

## Phase 3 — Verify
- `npx tsc --noEmit --skipLibCheck` (backend)
- `npx eslint` (backend & frontend)
