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
