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
    PAID: 'bg-emerald-100 text-emerald-900 border-emerald-800',
    UNPAID: 'bg-slate-100 text-slate-900 border-slate-400',
    OVERDUE: 'bg-red-100 text-red-950 border-red-800',
    VOID: 'bg-slate-200 text-slate-500 border-slate-400',
  };

  return (
    <tr className="border-b-2 border-slate-200 hover:bg-slate-50 transition-colors">
      <td className="p-4 font-mono text-xs font-black text-blue-900">
        {invoice.invoiceNumber}
      </td>
      <td className="p-4 text-xs font-black text-slate-950">
        {invoice.clientName}
      </td>
      <td className="p-4 text-xs font-bold text-slate-700">
        {invoice.ticketNumber}
      </td>
      <td className="p-4 text-xs font-black text-slate-950 text-right">
        Rp {parseFloat(invoice.total || '0').toLocaleString('id-ID')}
      </td>
      <td className="p-4 text-center">
        <span className={`px-2.5 py-1 rounded text-[10px] font-black border-2 uppercase ${statusStyles[invoice.status] || ''}`}>
          {invoice.status}
        </span>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={onView} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Detail">
            <Eye size={16} />
          </button>
          {invoice.status === 'UNPAID' && (
            <>
              <button onClick={onPay} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Tandai Lunas">
                <CheckCircle size={16} />
              </button>
              <button onClick={() => { if (confirm('Void invoice ini?')) onVoid?.(); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Void Invoice">
                <Ban size={16} />
              </button>
            </>
          )}
          {invoice.status === 'PAID' && (
            <button className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg" disabled>
              <XCircle size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
