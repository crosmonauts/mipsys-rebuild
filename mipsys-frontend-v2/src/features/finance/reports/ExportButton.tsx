'use client';
import React from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { financeApi } from '../api/finance-api';
import { toast } from 'react-hot-toast';

export function ExportButton({ invoiceId }: { invoiceId: number }) {
  async function exportXlsx() {
    try {
      const blob = await financeApi.exportInvoiceXlsx(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel berhasil diunduh');
    } catch {
      toast.error('Gagal export Excel');
    }
  }

  async function exportPdf() {
    try {
      const blob = await financeApi.exportInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF berhasil diunduh');
    } catch {
      toast.error('Gagal export PDF');
    }
  }

  return (
    <div className="flex gap-1">
      <button onClick={exportXlsx} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Export Excel">
        <FileSpreadsheet size={16} />
      </button>
      <button onClick={exportPdf} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Export PDF">
        <FileDown size={16} />
      </button>
    </div>
  );
}
