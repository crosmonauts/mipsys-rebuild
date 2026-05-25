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
      <button onClick={exportXlsx} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all" title="Export Excel" aria-label="Export Excel">
        <FileSpreadsheet size={16} aria-hidden="true" />
      </button>
      <button onClick={exportPdf} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all" title="Export PDF" aria-label="Export PDF">
        <FileDown size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
