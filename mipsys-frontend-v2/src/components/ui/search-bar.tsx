'use client';

import { Search } from 'lucide-react';
import { Input } from '@/src/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = 'Cari data...' }: SearchBarProps) {
  const input = (
    <div className="relative flex-1">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
        size={18}
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-12 h-12 rounded-2xl border border-border/20 font-bold text-[var(--foreground)] bg-[var(--card)]"
      />
    </div>
  );

  if (onSubmit) {
    return (
      <form onSubmit={onSubmit} className="w-full">
        {input}
      </form>
    );
  }

  return input;
}
