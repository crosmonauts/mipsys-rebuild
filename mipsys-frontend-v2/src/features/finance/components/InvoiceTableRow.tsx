import React from 'react';
import { CheckCircle, XCircle, Ban, Eye } from 'lucide-react';
import { Invoice } from '../types';

export function InvoiceTableRow({
  invoice,
  onPay,
  onVoid,
  onView,
}: {
  invoice: Invoice;
  onPay?: () => void;
  onVoid?: () => void;
  onView?: () => void;
}) {
  const statusStyles: Record<string, string> = {
    PAID: 'bg-accent/15 text-accent border-accent/30',
    UNPAID: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    OVERDUE: 'bg-destructive/10 text-destructive border-destructive/30',
    VOID: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="p-4 font-mono text-xs font-black text-foreground">
        {invoice.invoiceNumber}
      </td>
      <td className="p-4 text-xs font-black text-foreground">
        {invoice.clientName}
      </td>
      <td className="p-4 text-xs font-bold text-muted-foreground">
        {invoice.ticketNumber}
      </td>
      <td className="p-4 text-xs font-black text-foreground text-right">
        Rp {parseFloat(invoice.total || '0').toLocaleString('id-ID')}
      </td>
      <td className="p-4 text-center">
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border-2 uppercase ${statusStyles[invoice.status] || ''}`}>
          {invoice.status}
        </span>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={onView}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
            aria-label="Detail invoice"
          >
            <Eye size={16} />
          </button>
          {invoice.status === 'UNPAID' && (
            <>
              <button
                onClick={onPay}
                className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all"
                aria-label="Tandai lunas"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => { if (window.confirm('Void invoice ini?')) onVoid?.(); }}
                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                aria-label="Void invoice"
              >
                <Ban size={16} />
              </button>
            </>
          )}
          {invoice.status === 'PAID' && (
            <button className="p-1.5 text-muted-foreground/30 cursor-not-allowed rounded-lg" disabled aria-label="Sudah dibayar">
              <XCircle size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
