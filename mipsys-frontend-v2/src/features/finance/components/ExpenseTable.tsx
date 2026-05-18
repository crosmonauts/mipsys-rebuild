'use client';
import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
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
    UTILITY: 'bg-amber-100 text-amber-900',
    RENT: 'bg-violet-100 text-violet-900',
    SALARY: 'bg-blue-100 text-blue-900',
    TRANSPORT: 'bg-cyan-100 text-cyan-900',
    OTHER: 'bg-slate-100 text-slate-900',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-300">
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase">No.</th>
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase">Tipe</th>
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase">Deskripsi</th>
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase text-right">Jumlah</th>
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase">Tanggal</th>
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase">Kategori</th>
            <th className="p-4 text-[11px] font-black text-slate-900 uppercase text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr><td colSpan={7} className="p-8 text-center text-xs font-bold text-slate-500">Tidak ada expense.</td></tr>
          ) : (
            expenses.map((exp) => (
              <tr key={exp.id} className="border-b-2 border-slate-200 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono text-xs font-black text-slate-700">{exp.expenseNumber}</td>
                <td className="p-4 text-xs">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${exp.expenseType === 'PO' ? 'bg-orange-100 text-orange-900' : 'bg-blue-100 text-blue-900'}`}>
                    {exp.expenseType}
                  </span>
                </td>
                <td className="p-4 text-xs font-bold text-slate-700 max-w-[200px] truncate">{exp.description}</td>
                <td className="p-4 text-xs font-black text-slate-950 text-right">Rp {exp.amount.toLocaleString('id-ID')}</td>
                <td className="p-4 text-xs font-bold text-slate-700">{exp.expenseDate}</td>
                <td className="p-4 text-xs">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${categoryColors[exp.category] || categoryColors.OTHER}`}>
                    {exp.category}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {exp.expenseType === 'OPERATIONAL' && (
                      <>
                        <button onClick={() => onEdit(exp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { if (confirm('Hapus expense ini?')) onDelete(exp.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
