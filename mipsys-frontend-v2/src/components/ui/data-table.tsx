'use client';

import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
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

export interface Column<T> {
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyContent?: ReactNode;
  loadingContent?: ReactNode;
  headerTitle?: ReactNode;
  footer?: ReactNode;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isEmpty = false,
  emptyContent,
  loadingContent,
  headerTitle,
  footer,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
      {headerTitle && (
        <CardHeader className="bg-card text-foreground p-6 border-b border-border/20">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            {headerTitle}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {isLoading ? (
          loadingContent || (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="motion-safe:animate-spin text-muted-foreground" />
            </div>
          )
        ) : isEmpty && data.length === 0 ? (
          emptyContent || (
            <div className="p-12 text-center">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Tidak ada data.
              </p>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col, i) => (
                    <TableHead
                      key={i}
                      className={`micro-label text-muted-foreground ${col.headerClassName || ''} ${i === 0 ? 'pl-8' : ''} ${i === columns.length - 1 ? 'pr-8' : ''}`}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow
                    key={keyExtractor(item)}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={onRowClick ? 'cursor-pointer' : ''}
                  >
                    {columns.map((col, i) => (
                      <TableCell
                        key={i}
                        className={`${col.className || ''} ${i === 0 ? 'pl-8' : ''} ${i === columns.length - 1 ? 'pr-8' : ''}`}
                      >
                        {col.cell(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {footer && (
          <div className="p-6 text-center bg-muted/30 border-t border-border/10">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
