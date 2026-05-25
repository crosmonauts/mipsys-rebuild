'use client';
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Expense } from '../types';

export function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
}) {
  const categoryColors: Record<string, string> = {
    UTILITY: 'bg-amber-500/10 text-amber-400',
    RENT: 'bg-violet-500/10 text-violet-400',
    SALARY: 'bg-blue-500/10 text-blue-400',
    TRANSPORT: 'bg-cyan-500/10 text-cyan-400',
    OTHER: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="micro-label text-muted-foreground pl-8">No.</TableHead>
            <TableHead className="micro-label text-muted-foreground">Tipe</TableHead>
            <TableHead className="micro-label text-muted-foreground">Deskripsi</TableHead>
            <TableHead className="micro-label text-muted-foreground text-right">Jumlah</TableHead>
            <TableHead className="micro-label text-muted-foreground">Tanggal</TableHead>
            <TableHead className="micro-label text-muted-foreground">Kategori</TableHead>
            <TableHead className="micro-label text-muted-foreground text-center pr-8">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="p-8 text-center text-xs font-bold text-muted-foreground">
                Tidak ada expense.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="pl-8 font-mono text-xs font-black text-foreground">{exp.expenseNumber}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${exp.expenseType === 'PO' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {exp.expenseType}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-bold text-foreground/80 max-w-[200px] truncate">{exp.description}</TableCell>
                <TableCell className="text-xs font-black text-foreground text-right">Rp {exp.amount.toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-xs font-bold text-muted-foreground">{exp.expenseDate}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${categoryColors[exp.category] || categoryColors.OTHER}`}>
                    {exp.category}
                  </span>
                </TableCell>
                <TableCell className="text-center pr-8">
                  <div className="flex items-center justify-center gap-1">
                    {exp.expenseType === 'OPERATIONAL' && (
                      <>
                        <Button onClick={() => onEdit(exp)} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10" aria-label="Edit expense">
                          <Pencil size={16} aria-hidden="true" />
                        </Button>
                        <Button onClick={() => { if (window.confirm('Hapus expense ini?')) onDelete(exp.id); }} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" aria-label="Hapus expense">
                          <Trash2 size={16} aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
