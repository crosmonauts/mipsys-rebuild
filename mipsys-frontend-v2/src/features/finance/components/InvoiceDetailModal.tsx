'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Invoice, PaymentHistory } from '../types';

interface Props {
  invoice: Invoice & { payments?: PaymentHistory[] };
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, onClose }: Props) {
  const totalPaid = (invoice.payments || []).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg">{invoice.invoiceNumber}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="font-bold">Tiket:</span> {invoice.ticketNumber}</p>
          <p><span className="font-bold">Klien:</span> {invoice.clientName}</p>
          <p><span className="font-bold">Status:</span> <span className={`font-bold ${invoice.status === 'PAID' ? 'text-emerald-600' : invoice.status === 'VOID' ? 'text-red-600' : 'text-slate-600'}`}>{invoice.status}</span></p>
          <p><span className="font-bold">Total:</span> Rp {parseFloat(invoice.total || '0').toLocaleString('id-ID')}</p>
          <p><span className="font-bold">PPN:</span> Rp {parseFloat(invoice.ppn || '0').toLocaleString('id-ID')} ({invoice.ppnRate || 11}%)</p>
          <p><span className="font-bold">Service Fee:</span> Rp {parseFloat(invoice.serviceFee || '0').toLocaleString('id-ID')}</p>
          <p><span className="font-bold">Part Fee:</span> Rp {parseFloat(invoice.partFee || '0').toLocaleString('id-ID')}</p>
          <p><span className="font-bold">Shipping Fee:</span> Rp {parseFloat(invoice.shippingFee || '0').toLocaleString('id-ID')}</p>
          <p><span className="font-bold">Tanggal:</span> {invoice.invoiceDate}</p>
          {invoice.paidDate && <p><span className="font-bold">Lunas:</span> {invoice.paidDate}</p>}
        </div>
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-bold text-sm mb-2">Riwayat Pembayaran</h4>
            <div className="space-y-1">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-xs bg-slate-50 p-2 rounded-lg">
                  <span>{p.paymentMethod} {p.referenceNumber && `(${p.referenceNumber})`}</span>
                  <span className="font-bold">Rp {p.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
