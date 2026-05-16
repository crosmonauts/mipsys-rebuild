import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Invoice } from '../types';

export function InvoiceTableRow({
  invoice,
  onPaid,
}: {
  invoice: Invoice;
  onPaid?: () => void;
}) {
  const statusStyles = {
    PAID: 'bg-emerald-100 text-emerald-900 border-emerald-800',
    UNPAID: 'bg-slate-100 text-slate-900 border-slate-400',
    OVERDUE: 'bg-red-100 text-red-950 border-red-800',
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
        <span
          className={`px-2.5 py-1 rounded text-[10px] font-black border-2 uppercase ${statusStyles[invoice.status]}`}
        >
          {invoice.status}
        </span>
      </td>
      <td className="p-4 text-center">
        {invoice.status === 'UNPAID' ? (
          <button
            onClick={onPaid}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            title="Tandai Lunas"
          >
            <CheckCircle size={16} />
          </button>
        ) : (
          <button className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg" disabled>
            <XCircle size={16} />
          </button>
        )}
      </td>
    </tr>
  );
}
