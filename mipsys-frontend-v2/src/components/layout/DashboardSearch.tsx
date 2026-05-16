import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import Link from 'next/link';

interface DashboardSearchProps {
  searchInput: string;
  onInputChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

export function DashboardSearch({
  searchInput,
  onInputChange,
  onSearch,
}: DashboardSearchProps) {
  return (
    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-2xl">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <SearchInput value={searchInput} onChange={onInputChange} />
        <SearchButton />
        <NewSRButton />
      </form>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        placeholder="Cari pelanggan, model, atau No SR..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-11 h-12 border-none bg-transparent focus-visible:ring-0 text-base font-medium"
      />
    </div>
  );
}

function SearchButton() {
  return (
    <Button
      type="submit"
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 h-10 font-bold"
    >
      Cari
    </Button>
  );
}

function NewSRButton() {
  return (
    <Link href="/service-request/new">
      <Button className="bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-slate-900/10 transition-all flex gap-2">
        <Plus size={18} strokeWidth={3} />
        Buat SR Baru
      </Button>
    </Link>
  );
}
