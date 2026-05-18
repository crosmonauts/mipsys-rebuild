# Dark Theme Refactor & SR Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full dark-first visual overhaul of MiPSys frontend per DESIGN.md + new SR dashboard with stats and status filtering

**Architecture:** Phase 0 = foundation (globals.css, fonts, layout). Then pages refactored in parallel: Phase 1 = SR Dashboard (new component), Phase 2 = SR Detail dark refactor, Phase 3 = Create SR dark refactor, Phase 4 = other pages refactor. Backend changes (stats + findAll filtering) done in parallel with Phase 1.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Lucide, next-themes, IBM Plex fonts, Fraunces display font

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `mipsys-frontend-v2/public/fonts/` | Add | Font files (IBM Plex Sans/Mono, Fraunces) or load via next/font CDN |
| `mipsys-frontend-v2/src/app/globals.css` | Modify | DESIGN.md tokens, `@theme inline`, utility classes, planner-bg, glass-panel, etc. |
| `mipsys-frontend-v2/src/app/layout.tsx` | Modify | Fonts, dark default, ThemeProvider |
| `mipsys-frontend-v2/src/components/layout/Sidebar.tsx` | Modify | Dark theme refactor |
| `mipsys-frontend-v2/src/features/service-request/components/SrDashboard.tsx` | Create | Main dashboard with stats + filter + table |
| `mipsys-frontend-v2/src/features/service-request/api/sr-api.ts` | Modify | Add `status` param to `getAll` |
| `mipsys-frontend-v2/src/app/service-request/page.tsx` | Modify | Use SrDashboard instead of DashboardTable |
| `mipsys-frontend-v2/src/app/service-request/[id]/page.tsx` | Modify | Wrap in dark layout |
| `mipsys-frontend-v2/src/features/service-request/components/ServiceRequestDetail.tsx` | Modify | Dark refactor (bg, cards, text, buttons) |
| `mipsys-frontend-v2/src/features/service-request/components/DetailHeader.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/RepairTimeline.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/PartsUsedList.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/CreateSRForm.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/ClientProfile.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/UnitSpecs.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/ProblemDescription.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/DeviceSection.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/features/service-request/components/CustomerSection.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/components/layout/DiagnosisModal.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/components/layout/ApproveQuoteModal.tsx` | Modify | Dark refactor (print tetap light) |
| `mipsys-frontend-v2/src/app/page.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/app/part-order/page.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/app/part-order/new/page.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/app/inventory/page.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/app/finance/page.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/app/master-data/page.tsx` | Modify | Dark refactor |
| `mipsys-frontend-v2/src/components/layout/DashboardTable.tsx` | Delete | Replaced by SrDashboard |
| `mipsys-backend/src/service-requests/service-requests.service.ts` | Modify | Update `getDashboardStats` counts, update `findAll` with search/page/limit/status |
| `mipsys-backend/src/service-requests/service-requests.controller.ts` | Modify | Add `@Query()` params to `findAll` |

---

### Phase 0: Foundation (globals.css + Layout)

### Task 0.1: Update globals.css with DESIGN.md tokens

**Files:**
- Modify: `mipsys-frontend-v2/src/app/globals.css`

- [ ] **Step: Replace globals.css with dark-first tokens + utility classes**

Write to `mipsys-frontend-v2/src/app/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.15 0.038 252);
  --foreground: oklch(0.94 0.034 88);
  --card: oklch(0.205 0.044 252 / 78%);
  --card-foreground: oklch(0.94 0.034 88);
  --popover: oklch(0.205 0.044 252 / 95%);
  --popover-foreground: oklch(0.94 0.034 88);
  --primary: oklch(0.78 0.16 61);
  --primary-foreground: oklch(0.15 0.038 252);
  --secondary: oklch(0.25 0.06 244 / 74%);
  --secondary-foreground: oklch(0.94 0.034 88);
  --muted: oklch(0.26 0.052 252 / 64%);
  --muted-foreground: oklch(0.73 0.042 88);
  --accent: oklch(0.77 0.134 178);
  --accent-foreground: oklch(0.15 0.038 252);
  --destructive: oklch(0.68 0.21 31);
  --destructive-foreground: oklch(0.94 0.034 88);
  --border: oklch(0.98 0.02 88 / 14%);
  --input: oklch(0.98 0.02 88 / 10%);
  --ring: oklch(0.8 0.15 178);
  --radius: 0.625rem;
  --chart-1: oklch(0.78 0.16 61);
  --chart-2: oklch(0.77 0.134 178);
  --chart-3: oklch(0.68 0.18 286);
  --chart-4: oklch(0.72 0.19 31);
  --chart-5: oklch(0.7 0.14 140);
}

.light {
  --background: oklch(0.94 0.032 86);
  --foreground: oklch(0.19 0.029 252);
  --card: oklch(0.985 0.026 92 / 84%);
  --card-foreground: oklch(0.19 0.029 252);
  --popover: oklch(0.985 0.026 92);
  --popover-foreground: oklch(0.19 0.029 252);
  --primary: oklch(0.68 0.165 55);
  --primary-foreground: oklch(0.985 0.026 92);
  --secondary: oklch(0.86 0.055 184 / 80%);
  --secondary-foreground: oklch(0.19 0.029 252);
  --muted: oklch(0.88 0.03 84 / 68%);
  --muted-foreground: oklch(0.42 0.036 252);
  --accent: oklch(0.78 0.122 174);
  --accent-foreground: oklch(0.19 0.029 252);
  --destructive: oklch(0.58 0.21 31);
  --border: oklch(0.24 0.035 252 / 18%);
  --input: oklch(0.24 0.035 252 / 12%);
  --ring: oklch(0.76 0.14 174);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --chart-1: var(--chart-1);
  --chart-2: var(--chart-2);
  --chart-3: var(--chart-3);
  --chart-4: var(--chart-4);
  --chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
  --font-body: var(--font-body);
  --font-display: var(--font-display);
  --font-code: var(--font-mono);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body), sans-serif;
  }
}

@layer utilities {
  .planner-bg {
    background:
      radial-gradient(ellipse 80% 60% at 90% 10%, oklch(0.78 0.16 61 / 12%) 0%, transparent 60%),
      radial-gradient(ellipse 60% 60% at 10% 90%, oklch(0.77 0.134 178 / 10%) 0%, transparent 60%),
      radial-gradient(ellipse 50% 50% at 50% 50%, oklch(0.68 0.18 286 / 6%) 0%, transparent 60%),
      repeating-linear-gradient(0deg, oklch(0.98 0.02 88 / 3%) 0px, oklch(0.98 0.02 88 / 3%) 1px, transparent 1px, transparent 40px),
      repeating-linear-gradient(90deg, oklch(0.98 0.02 88 / 3%) 0px, oklch(0.98 0.02 88 / 3%) 1px, transparent 1px, transparent 40px),
      var(--background);
  }

  .glass-panel {
    @apply relative overflow-hidden rounded-[2rem] border border-border/30;
    background: var(--card);
    backdrop-filter: blur(12px);
  }

  .glass-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, oklch(0.98 0.02 88 / 20%), transparent);
  }

  .paper-card {
    @apply rounded-3xl border border-border/20 shadow-lg;
    background: var(--card);
  }

  .blueprint-surface {
    background:
      repeating-linear-gradient(0deg, transparent, transparent 20px, oklch(0.98 0.02 88 / 3%) 20px, oklch(0.98 0.02 88 / 3%) 21px),
      repeating-linear-gradient(90deg, transparent, transparent 20px, oklch(0.98 0.02 88 / 3%) 20px, oklch(0.98 0.02 88 / 3%) 21px);
  }

  .command-strip {
    background: linear-gradient(135deg, oklch(0.78 0.16 61), oklch(0.77 0.134 178), oklch(0.7 0.14 140));
  }

  .micro-label {
    @apply font-mono text-[10px] uppercase tracking-[0.3em] font-bold;
  }
}
```

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/app/globals.css
git commit -m "feat: add DESIGN.md dark theme tokens and utility classes in globals.css"
```

### Task 0.2: Update layout.tsx with fonts and ThemeProvider

**Files:**
- Modify: `mipsys-frontend-v2/src/app/layout.tsx`

- [ ] **Step: Update root layout with fonts, dark default, ThemeProvider**

```tsx
import { SidebarProvider } from '@/src/components/layout/SidebarProvider';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const fraunces = localFont({
  src: [
    { path: '../../public/fonts/Fraunces/Fraunces-Variable.woff2', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${fraunces.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: 'oklch(0.205 0.044 252 / 95%)',
                color: 'oklch(0.94 0.034 88)',
                borderRadius: '12px',
                fontSize: '14px',
                border: '1px solid oklch(0.98 0.02 88 / 14%)',
              },
            }}
          />
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

> NOTE: Fraunces font file must be placed at `public/fonts/Fraunces/Fraunces-Variable.woff2`. If unavailable, load Fraunces via next/font/google instead.

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/app/layout.tsx
git commit -m "feat: add fonts, dark default theme provider to root layout"
```

---

### Phase 1: Backend — findAll Filtering + Stats Update

### Task 1.1: Add search/page/limit/status filtering to findAll

**Files:**
- Modify: `mipsys-backend/src/service-requests/service-requests.service.ts` (~line 45-68)
- Modify: `mipsys-backend/src/service-requests/service-requests.controller.ts` (~line 24-27)

- [ ] **Step: Update controller to accept query params**

In `service-requests.controller.ts`, change line 24-27:

```typescript
import { Controller, Post, Patch, Body, Param, HttpCode, HttpStatus, UsePipes, ValidationPipe, Get, Query } from '@nestjs/common';

// ...

@Get('dashboard')
async findAll(
  @Query('search') search?: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
  @Query('status') status?: string,
) {
  return await this.serviceRequestService.findAll({
    search,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    status,
  });
}
```

- [ ] **Step: Update findAll service with filtering**

In `service-requests.service.ts`, change `findAll()` to accept filter params:

```typescript
import { and, desc, like, eq, or, sql } from 'drizzle-orm';

// ...

async findAll(filters: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}) {
  try {
    const { search, page = 1, limit = 10, status } = filters;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(serviceRequests.ticketNumber, `%${search}%`),
          like(customers.name, `%${search}%`),
          like(products.modelName, `%${search}%`),
          like(products.serialNumber, `%${search}%`),
        ),
      );
    }

    if (status && status !== 'ALL') {
      conditions.push(eq(serviceRequests.statusService, status));
    }

    const offset = (page - 1) * limit;

    const results = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,
        incomingDate: serviceRequests.incomingDate,
        customerName: customers.name,
        customerPhone: customers.phone,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
        serviceType: serviceRequests.serviceType,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  } catch (error) {
    console.error('[GET_ALL_SR_ERROR]', error);
    throw new InternalServerErrorException('Gagal menarik daftar servis.');
  }
}
```

- [ ] **Step: Update getDashboardStats to include awaitParts and closed**

In `service-requests.service.ts`, update `getDashboardStats()`:

```typescript
async getDashboardStats() {
  try {
    const allSR = await this.db.query.serviceRequests.findMany();

    const pending = allSR.filter((s) =>
      s.statusService === 'WAITING_CHECK' ||
      s.statusService === 'WAITING_APPROVE'
    ).length;
    const inService = allSR.filter((s) =>
      s.statusService === 'SERVICE'
    ).length;
    const awaitingParts = allSR.filter((s) =>
      s.statusService === 'AWAITING_PARTS'
    ).length;
    const ready = allSR.filter((s) =>
      s.statusService === 'DONE'
    ).length;
    const closed = allSR.filter((s) =>
      s.statusSystem === 'CLOSED'
    ).length;
    const cancelled = allSR.filter((s) =>
      s.statusService === 'CANCEL' || s.statusService === 'CANCELLED'
    ).length;

    return {
      total: allSR.length,
      pending,
      inService,
      awaitingParts,
      ready,
      closed,
      cancelled,
    };
  } catch (error) {
    console.error('[GET_STATS_ERROR]', error);
    return { total: 0, pending: 0, inService: 0, awaitingParts: 0, ready: 0, closed: 0, cancelled: 0 };
  }
}
```

- [ ] **Step: Commit**

```bash
git add mipsys-backend/src/service-requests/service-requests.controller.ts
git add mipsys-backend/src/service-requests/service-requests.service.ts
git commit -m "feat: add search/page/limit/status filtering to findAll, update stats endpoint"
```

### Task 1.2: Update frontend srApi to pass status filter

**Files:**
- Modify: `mipsys-frontend-v2/src/features/service-request/services/sr-api.ts`

- [ ] **Step: Add status param to getAll**

```typescript
getAll: (search = '', page = 1, limit = 10, status = 'ALL') =>
  api
    .get('/service-request/dashboard', { params: { search, page, limit, status } })
    .then((r) => r.data),
```

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/services/sr-api.ts
git commit -m "feat: add status filter param to SR getAll API"
```

---

### Phase 2: SR Dashboard (New Component)

### Task 2.1: Create SrStatsCards component

**Files:**
- Create: `mipsys-frontend-v2/src/features/service-request/components/SrStatsCards.tsx`

- [ ] **Step: Create stats cards component**

```tsx
'use client';

import { ClipboardList, Clock, Wrench, Package, CheckCircle2, XCircle } from 'lucide-react';

interface SrStatsCardsProps {
  stats: {
    total: number;
    pending: number;
    inService: number;
    awaitingParts: number;
    ready: number;
    closed: number;
    cancelled: number;
  };
}

const cards = [
  { key: 'total', label: 'Total', icon: ClipboardList, color: 'text-primary' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-400' },
  { key: 'inService', label: 'In Service', icon: Wrench, color: 'text-blue-400' },
  { key: 'awaitingParts', label: 'Menunggu Part', icon: Package, color: 'text-orange-400' },
  { key: 'ready', label: 'Ready', icon: CheckCircle2, color: 'text-emerald-400' },
  { key: 'closed', label: 'Closed', icon: XCircle, color: 'text-muted-foreground' },
] as const;

export function SrStatsCards({ stats }: SrStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="paper-card p-5 flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-background/50 ${color}`}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold font-display tracking-tight text-foreground">
              {stats[key as keyof typeof stats]}
            </p>
            <p className="micro-label text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/components/SrStatsCards.tsx
git commit -m "feat: create SrStatsCards component"
```

### Task 2.2: Create SrFilterBar component

**Files:**
- Create: `mipsys-frontend-v2/src/features/service-request/components/SrFilterBar.tsx`

- [ ] **Step: Create filter bar component**

```tsx
'use client';

import { Search, Plus } from 'lucide-react';
import Link from 'next/link';

const statusFilters = [
  { value: 'ALL', label: 'Semua' },
  { value: 'WAITING_CHECK', label: 'Pending' },
  { value: 'SERVICE', label: 'In Service' },
  { value: 'AWAITING_PARTS', label: 'Menunggu Part' },
  { value: 'DONE', label: 'Ready' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCEL', label: 'Cancelled' },
];

interface SrFilterBarProps {
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  activeFilter: string;
  onFilterChange: (v: string) => void;
}

export function SrFilterBar({
  searchInput,
  onSearchInputChange,
  onSearch,
  activeFilter,
  onFilterChange,
}: SrFilterBarProps) {
  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Cari No. SR, pelanggan, model, atau serial..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-card border border-border/30 text-foreground placeholder:text-muted-foreground/50 text-sm font-medium outline-none focus:border-ring/50 focus:ring-[3px] focus:ring-ring/30 transition-all"
          />
        </div>
        <Link href="/service-request/new">
          <button
            type="button"
            className="command-strip h-12 px-6 rounded-2xl text-xs font-black tracking-widest text-white flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            <Plus size={18} strokeWidth={3} />
            BUAT SR BARU
          </button>
        </Link>
      </form>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`px-4 py-2 rounded-full text-[11px] font-black tracking-wider transition-all ${
              activeFilter === value
                ? 'command-strip text-white shadow-md'
                : 'bg-card text-muted-foreground border border-border/20 hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/components/SrFilterBar.tsx
git commit -m "feat: create SrFilterBar component with status filter pills"
```

### Task 2.3: Create SrDashboard (main component)

**Files:**
- Create: `mipsys-frontend-v2/src/features/service-request/components/SrDashboard.tsx`
- Delete: `mipsys-frontend-v2/src/components/layout/DashboardTable.tsx` (replaced)

- [ ] **Step: Create main SrDashboard component**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { srApi } from '../services/sr-api';
import { ServiceRequest } from '../types';
import { SrStatsCards } from './SrStatsCards';
import { SrFilterBar } from './SrFilterBar';
import Link from 'next/link';
import { Loader2, ExternalLink } from 'lucide-react';

const statusBadge = (statusService: string) => {
  const map: Record<string, { label: string; className: string }> = {
    WAITING_CHECK: { label: 'Pending', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    WAITING_APPROVE: { label: 'Menunggu Approve', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    SERVICE: { label: 'In Service', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    AWAITING_PARTS: { label: 'Menunggu Part', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    DONE: { label: 'Ready', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    CLOSED: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border/20' },
    CANCEL: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  return map[statusService] || { label: statusService, className: 'bg-muted text-muted-foreground border-border/20' };
};

export function SrDashboard() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [result, statsResult] = await Promise.all([
        srApi.getAll(searchTerm, page, limit, activeFilter),
        srApi.getDashboardStats(),
      ]);
      const dataArray = Array.isArray(result) ? result : result.data || [];
      setData(dataArray);
      setStats(statsResult);
    } catch (error) {
      console.error('Gagal fetch data SR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground">
          Service Request
        </h1>
        <p className="text-muted-foreground font-medium">
          Daftar seluruh tiket permintaan servis di sistem MiPSys.
        </p>
      </div>

      {stats && <SrStatsCards stats={stats} />}

      <SrFilterBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <div className="paper-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/20">
                <th className="micro-label text-muted-foreground text-left p-5 pl-8">No. SR</th>
                <th className="micro-label text-muted-foreground text-left p-5">Pelanggan</th>
                <th className="micro-label text-muted-foreground text-left p-5">Model</th>
                <th className="micro-label text-muted-foreground text-left p-5">Serial</th>
                <th className="micro-label text-muted-foreground text-left p-5">Tipe</th>
                <th className="micro-label text-muted-foreground text-center p-5">Status</th>
                <th className="micro-label text-muted-foreground text-left p-5">Tanggal</th>
                <th className="micro-label text-muted-foreground text-right p-5 pr-8">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-32">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                      <p className="micro-label text-muted-foreground animate-pulse">
                        Memuat data...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-24">
                    <p className="text-muted-foreground text-lg font-display font-medium">
                      Belum ada tiket servis
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((sr) => {
                  const badge = statusBadge(sr.statusService);
                  return (
                    <tr key={sr.id} className="border-b border-border/10 hover:bg-card/50 transition-colors group">
                      <td className="p-5 pl-8">
                        <span className="font-bold text-foreground font-mono text-sm">{sr.ticketNumber}</span>
                      </td>
                      <td className="p-5 font-medium text-foreground/80">{sr.customerName}</td>
                      <td className="p-5 text-muted-foreground">{sr.modelName}</td>
                      <td className="p-5">
                        <code className="micro-label text-primary bg-primary/10 px-2 py-1 rounded-lg">
                          {sr.serialNumber || '-'}
                        </code>
                      </td>
                      <td className="p-5">
                        <span className="micro-label text-muted-foreground">{sr.serviceType}</span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-muted-foreground font-mono">
                        {new Date(sr.incomingDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="p-5 pr-8 text-right">
                        <Link href={`/service-request/${sr.ticketNumber}`}>
                          <button className="px-4 py-2 rounded-xl bg-background/50 border border-border/20 text-muted-foreground hover:text-foreground hover:border-primary/30 text-[11px] font-bold tracking-wider transition-all flex items-center gap-2 ml-auto">
                            Detail <ExternalLink size={12} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pb-8">
        <p className="micro-label text-muted-foreground">
          Menampilkan <span className="text-foreground">{data.length}</span> catatan
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-4 py-2 rounded-xl bg-card border border-border/20 text-muted-foreground disabled:opacity-30 hover:text-foreground text-[11px] font-bold tracking-wider transition-all"
          >
            Kembali
          </button>
          <div className="h-9 w-9 flex items-center justify-center command-strip text-white rounded-xl text-xs font-black shadow-lg">
            {page}
          </div>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit || isLoading}
            className="px-4 py-2 rounded-xl bg-card border border-border/20 text-muted-foreground disabled:opacity-30 hover:text-foreground text-[11px] font-bold tracking-wider transition-all"
          >
            Lanjut
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step: Update the route page to use SrDashboard**

In `mipsys-frontend-v2/src/app/service-request/page.tsx`:

```tsx
'use client';

import { SrDashboard } from '@/src/features/service-request/components/SrDashboard';

export default function ServiceRequestPage() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
        <SrDashboard />
      </div>
    </main>
  );
}
```

- [ ] **Step: Delete old DashboardTable**

```bash
rm mipsys-frontend-v2/src/components/layout/DashboardTable.tsx
```

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/components/SrDashboard.tsx
git add mipsys-frontend-v2/src/app/service-request/page.tsx
git rm mipsys-frontend-v2/src/components/layout/DashboardTable.tsx
git commit -m "feat: create SR Dashboard with stats, filters, and dark-themed table"
```

---

### Phase 3: SR Detail Dark Refactor

### Task 3.1: Refactor ServiceRequestDetail.tsx to dark theme

**Files:**
- Modify: `mipsys-frontend-v2/src/features/service-request/components/ServiceRequestDetail.tsx`

Replace ALL color tokens throughout the file:
- `bg-[#fafaf9]` → `planner-bg`
- `text-stone-900` → `text-foreground`
- `text-stone-400/500/700/800` → `text-muted-foreground` / `text-foreground`
- `bg-amber-100/50` → `bg-primary/10` or `bg-amber-500/20`
- `text-amber-600/700` → `text-primary`
- `bg-white` (for cards) → `paper-card` or `bg-card`
- `border-stone-*/slate-*` → `border-border/20`
- `bg-stone-900` → `bg-foreground/10`
- `text-stone-50` → `text-foreground`
- `shadow-xl shadow-amber-100` → `shadow-lg`
- Section headings: use `micro-label` class + amber accent
- `.rounded-[3rem]` cards → `.paper-card` or `.glass-panel`
- Buttons: use `command-strip` for primary, `bg-card border` for secondary

Key patterns:
- Left column sections: `paper-card` or section with `micro-label` heading + amber underline bar
- Right sidebar status card: `paper-card` with sticky positioning
- Problem description: `glass-panel` with amber left border accent
- Form inputs (edit mode): `bg-card border-border/30 outline-none focus:border-ring/50 focus:ring-[3px]`

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/components/ServiceRequestDetail.tsx
git commit -m "refactor: dark theme for ServiceRequestDetail"
```

### Task 3.2: Refactor DetailHeader.tsx

**Files:**
- Modify: `mipsys-frontend-v2/src/features/service-request/components/DetailHeader.tsx`

- [ ] **Step: Dark refactor DetailHeader**

Replace:
- `text-stone-400` → `text-muted-foreground`
- `text-stone-900` → `text-foreground`
- `text-stone-300` → `text-muted-foreground`
- `bg-amber-100 text-amber-700` → `bg-primary/15 text-primary`
- Button colors: `bg-blue-600` → `bg-primary` (or keep blue semantic), `bg-slate-700` → `bg-card/80`
- `bg-stone-900 text-stone-50 hover:bg-amber-600` → `bg-card border border-border/20 text-foreground hover:bg-primary/20`
- `shadow-xl shadow-*-100` → `shadow-lg`

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/components/DetailHeader.tsx
git commit -m "refactor: dark theme for DetailHeader"
```

### Task 3.3: Refactor sub-components (RepairTimeline, PartsUsedList, etc.)

**Files:**
- Modify: `mipsys-frontend-v2/src/features/service-request/components/RepairTimeline.tsx`
- Modify: `mipsys-frontend-v2/src/features/service-request/components/PartsUsedList.tsx`
- Modify: `mipsys-frontend-v2/src/features/service-request/components/ClientProfile.tsx`
- Modify: `mipsys-frontend-v2/src/features/service-request/components/UnitSpecs.tsx`
- Modify: `mipsys-frontend-v2/src/features/service-request/components/ProblemDescription.tsx`
- Modify: `mipsys-frontend-v2/src/features/service-request/components/DeviceSection.tsx`
- Modify: `mipsys-frontend-v2/src/features/service-request/components/CustomerSection.tsx`

Pattern for each:
- Hardcoded light colors → design system tokens
- `bg-white` → `bg-card` or transparent
- `text-slate-*` / `text-stone-*` → `text-foreground` / `text-muted-foreground`
- `border-slate-*` → `border-border/20`
- White cards → `paper-card` or `bg-card rounded-3xl border border-border/20`

- [ ] **Step: Commit each file** (or batch independent ones)

```bash
git add mipsys-frontend-v2/src/features/service-request/components/RepairTimeline.tsx
git add mipsys-frontend-v2/src/features/service-request/components/PartsUsedList.tsx
git add mipsys-frontend-v2/src/features/service-request/components/ClientProfile.tsx
git add mipsys-frontend-v2/src/features/service-request/components/UnitSpecs.tsx
git add mipsys-frontend-v2/src/features/service-request/components/ProblemDescription.tsx
git add mipsys-frontend-v2/src/features/service-request/components/DeviceSection.tsx
git add mipsys-frontend-v2/src/features/service-request/components/CustomerSection.tsx
git commit -m "refactor: dark theme for SR detail sub-components"
```

### Task 3.4: Refactor DiagnosisModal and ApproveQuoteModal

**Files:**
- Modify: `mipsys-frontend-v2/src/components/layout/DiagnosisModal.tsx`
- Modify: `mipsys-frontend-v2/src/components/layout/ApproveQuoteModal.tsx`

- [ ] **Step: Dark refactor DiagnosisModal**

Modal overlay: `bg-black/60 backdrop-blur-sm`
Modal content: `paper-card` or `bg-card border border-border/20`
Inputs/buttons: design system tokens

- [ ] **Step: Dark refactor ApproveQuoteModal** (print preview tetap light theme — add class `dark:bg-white dark:text-black` for print section only when printing)

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/components/layout/DiagnosisModal.tsx
git add mipsys-frontend-v2/src/components/layout/ApproveQuoteModal.tsx
git commit -m "refactor: dark theme for modals"
```

---

### Phase 4: Create SR (Dark Refactor)

### Task 4.1: Refactor CreateSRForm.tsx

**Files:**
- Modify: `mipsys-frontend-v2/src/features/service-request/components/CreateSRForm.tsx`

- [ ] **Step: Dark refactor CreateSRForm**

Replace:
- `bg-white` sections → `paper-card` or `bg-card border border-border/20 rounded-3xl`
- `bg-slate-50` headers → `bg-muted/30 border-b border-border/20`
- `text-slate-900` → `text-foreground`
- `text-slate-500/800` → `text-muted-foreground` / `text-foreground`
- `bg-blue-600` → `command-strip` or `bg-primary`
- `bg-slate-50/50` inputs → `bg-card border-border/30`
- `max-w-4xl mx-auto` → wrap in `planner-bg` container

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/features/service-request/components/CreateSRForm.tsx
git commit -m "refactor: dark theme for CreateSRForm"
```

### Task 4.2: Refactor new SR page wrapper

**Files:**
- Modify: `mipsys-frontend-v2/src/app/service-request/new/page.tsx`

- [ ] **Step: Wrap in planner-bg**

```tsx
import { CreateSRForm } from '@/src/features/service-request/components/CreateSRForm';

export default function NewServiceRequestPage() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
        <CreateSRForm />
      </div>
    </main>
  );
}
```

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/app/service-request/new/page.tsx
git commit -m "refactor: dark theme for new SR page wrapper"
```

---

### Phase 5: Other Pages Dark Refactor

### Task 5.1: Refactor homepage, part-order, inventory, finance, master-data

**Files:**
- Modify: `mipsys-frontend-v2/src/app/page.tsx`
- Modify: `mipsys-frontend-v2/src/app/part-order/page.tsx`
- Modify: `mipsys-frontend-v2/src/app/part-order/new/page.tsx`
- Modify: `mipsys-frontend-v2/src/app/inventory/page.tsx`
- Modify: `mipsys-frontend-v2/src/app/finance/page.tsx`
- Modify: `mipsys-frontend-v2/src/app/master-data/page.tsx`

For each page, apply same pattern:
- Wrap content in `<main className="planner-bg min-h-screen"><div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">`
- Replace hardcoded light colors with design system tokens
- Replace shadcn Card with `paper-card` or `bg-card` equivalent
- Buttons: use `command-strip` for primary, `bg-card border` for secondary
- Status badges: dark-themed pills
- Loading/empty/error states: `paper-card` based

- [ ] **Step: Read each page's current content, then refactor and commit** (batch per page group)

```bash
git add mipsys-frontend-v2/src/app/page.tsx
git add mipsys-frontend-v2/src/app/part-order/page.tsx
git add mipsys-frontend-v2/src/app/part-order/new/page.tsx
git add mipsys-frontend-v2/src/app/inventory/page.tsx
git add mipsys-frontend-v2/src/app/finance/page.tsx
git add mipsys-frontend-v2/src/app/master-data/page.tsx
git commit -m "refactor: dark theme for all remaining pages"
```

---

### Phase 6: Sidebar Dark Refactor

### Task 6.1: Refactor Sidebar component

**Files:**
- Modify: `mipsys-frontend-v2/src/components/layout/SidebarProvider.tsx` (check if sidebar is in here)
- Or find sidebar files

- [ ] **Step: Find and dark refactor sidebar**

```bash
# Find sidebar files
find mipsys-frontend-v2/src/components/layout -name "*.tsx" | xargs grep -l "Sidebar\|sidebar"
```

Apply same token replacements.

- [ ] **Step: Commit**

```bash
git add mipsys-frontend-v2/src/components/layout/Sidebar*.tsx
git commit -m "refactor: dark theme for sidebar"
```

---

## Self-Review Checklist

- [ ] All DESIGN.md tokens implemented in globals.css
- [ ] globals.css includes `@theme inline` bridging for all tokens
- [ ] `.planner-bg`, `.glass-panel`, `.paper-card`, `.blueprint-surface`, `.command-strip`, `.micro-label` all defined
- [ ] Fonts loaded and variables set in layout.tsx
- [ ] dark default via next-themes, `suppressHydrationWarning` on `<html>`
- [ ] Backend `findAll` accepts and uses search/page/limit/status
- [ ] Backend `getDashboardStats` returns all 7 categories
- [ ] Frontend `srApi.getAll` passes status param
- [ ] SR Dashboard has stats row, filter pills, search, table, pagination
- [ ] All pages wrapped in `planner-bg` + `max-w-[1500px]` container
- [ ] No hardcoded light color tokens remain (slate-*, stone-*, bg-white, bg-[#...])
- [ ] Status badges use dark-themed pills everywhere
- [ ] No placeholders, TODOs, or "implement later" in final output
