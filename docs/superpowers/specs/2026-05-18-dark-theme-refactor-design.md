# Dark Theme Refactor & Dashboard SR

## Overview

Full dark-first visual overhaul of MiPSys frontend to match DESIGN.md ("founder war-room / blueprint desk" system), starting with a new SR dashboard with stats + status filtering, then systematically refactoring all existing pages.

## Scope

All pages in `mipsys-frontend-v2/src/app/`:
- `/` — Homepage
- `/service-request` — SR Dashboard (new: stats + filtered table)
- `/service-request/new` — Create SR form
- `/service-request/[id]` — SR Detail
- `/part-order` — Part Order list
- `/part-order/new` — Create PO
- `/inventory` — Inventory list
- `/finance` — Finance list
- `/master-data` — Master data

## Approach

**Single rewrite phase**: Update foundation, then implement each page. All pages are independent once foundation is done, allowing parallel sub-agent execution.

---

## Phase 1: Foundation

### globals.css — Token & Theme

Set `:root` = dark as default:

```
--background: oklch(0.15 0.038 252)
--foreground: oklch(0.94 0.034 88)
--card: oklch(0.205 0.044 252 / 78%)
--primary: oklch(0.78 0.16 61)        // amber
--accent: oklch(0.77 0.134 178)        // teal
--secondary: oklch(0.25 0.06 244 / 74%)
--muted: oklch(0.26 0.052 252 / 64%)
--muted-foreground: oklch(0.73 0.042 88)
--border: oklch(0.98 0.02 88 / 14%)
--ring: oklch(0.8 0.15 178)            // teal focus
--destructive: oklch(0.68 0.21 31)
```

Light mode via `.light` class overrides.

All tokens bridged to Tailwind via `@theme inline`.

### Utility Classes

- `.planner-bg`: layered blueprint grid, amber orb (radial gradient top-right), teal orb (bottom-left), violet depth glow
- `.glass-panel`: translucent bg with backdrop-blur, inner highlight via pseudo-element, deep shadow
- `.paper-card`: translucent surface, rounded-3xl, subtle border, deep shadow
- `.blueprint-surface`: compact grid pattern background, for graphs and tables
- `.command-strip`: amber-to-teal-to-violet gradient horizontal strip
- `.micro-label`: `font-mono text-[10px] uppercase tracking-[0.3em] font-bold`

### Layout Pattern

```tsx
<main className="planner-bg min-h-screen">
  <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
```

### Font Setup

- `--font-body`: IBM Plex Sans (body, controls, forms)
- `--font-display-family`: Fraunces (hero headings, card titles, empty states)
- `--font-code`: IBM Plex Mono (labels, metadata, badges)
- Tailwind extend: `font-display` → Fraunces, `font-mono` → IBM Plex Mono

### Root Layout

- Add `<body className="dark">` default
- Import fonts via next/font
- Wrap with `<ThemeProvider>` (next-themes, attribute="class", defaultTheme="dark")
- `planner-bg` on main wrapper

---

## Phase 2: SR Dashboard (Halaman List)

### Location

`/service-request/page.tsx` → `/service-request/page.tsx` (replaces current, uses new component)

### Components

**`SrDashboard`** (new, in `features/service-request/components/SrDashboard.tsx`):
- Header: Fraunces "Service Request" display + subtitle
- Stats row (`SrStatsCards`): 5x `paper-card` grid:
  - Total, Pending (WAITING_CHECK), In Service (SERVICE), Ready (DONE), Closed (CLOSED)
  - Masing-masing: icon + count + label, fetched from a new `/service-requests/stats` endpoint or computed from full list
- Search + filter bar (`SrFilterBar`):
  - Search input (left) + "Buat SR Baru" button (right)
  - Filter pill row: Semua | Pending | In Service | Menunggu Part | Ready | Closed | Cancelled
  - Active pill: `command-strip` or amber bg
- Table (`SrTable`):
  - Same columns: No SR, Pelanggan, Model, Serial Number, Type, Status, Tanggal Masuk, Aksi
  - `paper-card` container, header rows with `micro-label`
  - Row hover effect, status badges color-coded pills
  - Pagination: dark pill buttons

### Status Filter Logic

Filter pills update a `statusFilter` state. When active, pass to API. Backend already supports `searchTerm` + `page` + `limit` — need to add `statusFilter` query param. Or do client-side filter if data size is small.

Preference: **backend filtering** — add `status` param to `srApi.getAll()`.

### Stats Data

Add a new API endpoint `GET /service-requests/stats` returning:
```json
{
  "total": 42,
  "pending": 10,
  "inService": 8,
  "awaitingParts": 3,
  "ready": 5,
  "closed": 16,
  "cancelled": 0
}
```

### Backend Changes

- `ServiceRequestsController`: add `@Get('stats')` endpoint
- `ServiceRequestsService`: add `getStats()` method — `GROUP BY statusService` query
- `srApi.getAll()`: add optional `status` parameter

---

## Phase 3: SR Detail

### Layout

Dark-themed version of current `ServiceRequestDetail.tsx`:
- `planner-bg` background, `max-w-[1500px]` container
- Header: `paper-card` or inline with Fraunces ticket number, `micro-label` type/date badges
- Sticky right sidebar: status card with Live Progress + timeline + action buttons

### Components to refactor

| Component | Changes |
|---|---|
| `ServiceRequestDetail.tsx` | Replace bg/color tokens with design system tokens, use `paper-card`, `micro-label`, `glass-panel` |
| `DetailHeader.tsx` | Dark theme buttons, Fraunces heading, `micro-label` badges |
| `RepairTimeline.tsx` | Dark colors, amber active step |
| `PartsUsedList.tsx` | Dark card, mono labels |
| `ClientProfile.tsx` | Dark field labels |
| `UnitSpecs.tsx` | Dark table/card |
| `ProblemDescription.tsx` | `glass-panel` with amber accent bar |
| `DiagnosisModal.tsx` | Dark modal overlay, `paper-card`, dark inputs |
| `ApproveQuoteModal.tsx` | Dark modal, print-friendly tetap light |

---

## Phase 4: Create SR

- `planner-bg` + `glass-panel` form container
- 2-column grid: left = fields, right = summary/guidance
- Inputs: dark translucent, teal focus ring, inner shadow
- Submit: `command-strip` pill button
- All form sections: `micro-label` amber headings

---

## Phase 5: Other Pages

Each existing page gets a consistent refactor:
- Replace `bg-[#f8fafc]` / `bg-white` / `text-slate-*` with design system tokens
- Wrap in `planner-bg` main container
- Use `paper-card`, `glass-panel`, `micro-label` where applicable
- Status badges → dark-themed pills

---

## Error & Loading States

- Loading: animated pulse with `micro-label` text + spinner on `paper-card`
- Empty: Fraunces display message + icon on `paper-card` centered
- Error: `paper-card` with amber/destructive accent

---

## Files to Create

| File | Purpose |
|---|---|
| `features/service-request/components/SrDashboard.tsx` | Main dashboard component |
| `features/service-request/components/SrStatsCards.tsx` | Stats row (5 cards) |
| `features/service-request/components/SrFilterBar.tsx` | Search + filter pills |
| `features/service-request/components/SrTable.tsx` | Filtered SR table |

## Files to Modify

| File | Changes |
|---|---|
| `app/globals.css` | Full DESIGN.md tokens + utility classes |
| `app/layout.tsx` | Add fonts, dark default, ThemeProvider |
| `app/page.tsx` | Dark refactor |
| `app/service-request/page.tsx` | Replace DashboardTable with SrDashboard |
| `app/service-request/[id]/page.tsx` | Dark refactor (uses existing ServiceRequestDetail) |
| `app/service-request/new/page.tsx` | Dark refactor |
| `app/part-order/page.tsx` | Dark refactor |
| `app/part-order/new/page.tsx` | Dark refactor |
| `app/inventory/page.tsx` | Dark refactor |
| `app/finance/page.tsx` | Dark refactor |
| `app/master-data/page.tsx` | Dark refactor |
| `features/service-request/components/ServiceRequestDetail.tsx` | Dark refactor |
| `features/service-request/components/DetailHeader.tsx` | Dark refactor |
| `features/service-request/components/RepairTimeline.tsx` | Dark refactor |
| `features/service-request/components/PartsUsedList.tsx` | Dark refactor |
| `features/service-request/components/CreateSRForm.tsx` | Dark refactor |
| `features/service-request/components/ClientProfile.tsx` | Dark refactor |
| `features/service-request/components/UnitSpecs.tsx` | Dark refactor |
| `features/service-request/components/ProblemDescription.tsx` | Dark refactor |
| `features/service-request/components/DeviceSection.tsx` | Dark refactor |
| `features/service-request/components/CustomerSection.tsx` | Dark refactor |
| `components/layout/DiagnosisModal.tsx` | Dark refactor |
| `components/layout/ApproveQuoteModal.tsx` | Dark refactor |
| `features/service-request/api/sr-api.ts` | Add stats endpoint, status filter param |
| `features/service-request/hooks/useServiceRequest.ts` | Add stats hook |

### Backend

| File | Changes |
|---|---|
| `src/service-requests/service-requests.controller.ts` | Add `GET /stats` route |
| `src/service-requests/service-requests.service.ts` | Add `getStats()` method |
