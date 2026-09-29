'use client';

import React from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { ReactNode } from 'react';

export interface ReportColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  /** 'currency' | 'integer' | 'number' | 'text' menentukan format otomatis. */
  type?: 'text' | 'integer' | 'number' | 'currency' | 'percent' | 'date';
  render?: (value: unknown, row: T) => ReactNode;
  /** Kolom ikut dijumlahkan pada baris TOTAL. */
  total?: boolean;
}

interface ReportTableProps<T> {
  title: string;
  columns: ReportColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  footer?: ReactNode;
  onExport?: () => void;
  isExporting?: boolean;
  /** Baris tambahan di bawah tabel, mis. ringkasan bucket. */
  summary?: { label: string; value: string }[];
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat('id-ID');

function formatValue(value: unknown, type?: ReportColumn['type']): ReactNode {
  if (value === null || value === undefined || value === '') return '-';
  switch (type) {
    case 'currency':
      return rupiah.format(Number(value));
    case 'integer':
      return plain.format(Number(value));
    case 'number':
      return plain.format(Number(value));
    case 'percent':
      return `${(Number(value) * 100).toFixed(1)}%`;
    case 'date':
      return value instanceof Date
        ? value.toLocaleDateString('id-ID')
        : String(value);
    default:
      return String(value);
  }
}

const alignClass = (
  align?: ReportColumn['align'],
  type?: ReportColumn['type'],
) => {
  const resolved =
    align ??
    (type === 'currency' || type === 'number' || type === 'percent'
      ? 'right'
      : type === 'integer'
        ? 'center'
        : 'left');
  return resolved === 'right' ? 'text-right' : resolved === 'center' ? 'text-center' : 'text-left';
};

export function ReportTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  rowKey,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'Tidak ada data untuk periode ini.',
  footer,
  onExport,
  isExporting = false,
  summary,
}: ReportTableProps<T>) {
  const totalColumns = columns.filter((c) => c.total);

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[var(--card)]">
      <CardHeader className="bg-[var(--card)] text-[var(--foreground)] p-6 border-b border-border/20 flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em]">
          {title}
        </CardTitle>
        {onExport && (
          <button
            onClick={onExport}
            disabled={isExporting || isEmpty}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] transition-all hover:bg-[var(--accent)]/10 disabled:opacity-40 motion-safe:active:scale-95"
            title="Unduh laporan ini sebagai Excel"
          >
            {isExporting ? (
              <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet size={14} aria-hidden="true" />
            )}
            {isExporting ? 'Menyiapkan' : 'Export XLSX'}
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2
              size={32}
              className="motion-safe:animate-spin text-[var(--muted-foreground)]"
              aria-hidden="true"
            />
          </div>
        ) : isEmpty && data.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--muted-foreground)]">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={alignClass(column.align, column.type)}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={rowKey(row, index)}>
                    <TableCell className="text-center text-xs text-[var(--muted-foreground)]">
                      {index + 1}
                    </TableCell>
                    {columns.map((column) => {
                      const value = row[column.key];
                      return (
                        <TableCell
                          key={column.key}
                          className={`text-xs ${alignClass(column.align, column.type)}`}
                        >
                          {column.render
                            ? column.render(value, row)
                            : formatValue(value, column.type)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
              {totalColumns.length > 0 && data.length > 0 && (
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="text-center text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                      Total
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={`text-xs font-black text-[var(--foreground)] ${alignClass(column.align, column.type)}`}
                      >
                        {column.total
                          ? formatValue(
                              data.reduce(
                                (sum, row) => sum + Number(row[column.key] ?? 0),
                                0,
                              ),
                              column.type,
                            )
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        )}
        {summary && summary.length > 0 && (
          <div className="grid gap-px border-t border-border/20 bg-border/20 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className="bg-[var(--card)] px-5 py-4"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-black text-[var(--foreground)]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}
