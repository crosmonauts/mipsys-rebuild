import React from 'react';
import { Button } from '@/src/components/ui/button';

interface DashboardPaginationProps {
  page: number;
  dataLength: number;
  limit: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function DashboardPagination({
  page,
  dataLength,
  limit,
  isLoading,
  onPrev,
  onNext,
}: DashboardPaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 pb-10">
      <PageInfo dataLength={dataLength} />
      <PageControls
        page={page}
        isLoading={isLoading}
        hasPrev={page > 1}
        hasNext={dataLength >= limit}
        onPrev={onPrev}
        onNext={onNext}
      />
    </div>
  );
}

function PageInfo({ dataLength }: { dataLength: number }) {
  return (
    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">
      Menampilkan <span className="text-slate-900">{dataLength}</span> catatan
      aktif
    </p>
  );
}

function PageControls({
  page,
  isLoading,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  isLoading: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <NavButton
        direction="prev"
        disabled={!hasPrev || isLoading}
        onClick={onPrev}
      />
      <PageIndicator page={page} />
      <NavButton
        direction="next"
        disabled={!hasNext || isLoading}
        onClick={onNext}
      />
    </div>
  );
}

function NavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl font-bold px-4 border-slate-200 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
      onClick={onClick}
      disabled={disabled}
    >
      {direction === 'prev' ? 'Kembali' : 'Lanjut'}
    </Button>
  );
}

function PageIndicator({ page }: { page: number }) {
  return (
    <div className="h-9 w-9 flex items-center justify-center bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg shadow-slate-900/20">
      {page}
    </div>
  );
}
