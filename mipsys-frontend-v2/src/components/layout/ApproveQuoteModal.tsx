'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  Loader2,
  Package,
  AlertTriangle,
  FileText,
  Printer,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/src/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useAuth } from '@/src/lib/auth-context';
import { srApi } from '@/src/features/service-request/api/sr-api';
import { orderPartsApi } from '@/src/features/service-request/api/order-parts-api';
import { OrderPart } from '@/src/features/service-request/api/order-parts-api';

interface ApproveQuoteModalProps {
  ticketNumber: string;
  serviceRequestId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialServiceFee?: string;
  initialPartFee?: string;
  initialShippingFee?: string;
}

interface ProposedPart extends OrderPart {
  lineTotal: number;
}

export function ApproveQuoteModal({
  ticketNumber,
  serviceRequestId,
  isOpen,
  onClose,
  onSuccess,
  initialServiceFee,
  initialPartFee,
  initialShippingFee,
}: ApproveQuoteModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parts, setParts] = useState<ProposedPart[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [savedServiceFee, setSavedServiceFee] = useState<number>(0);
  const [savedShippingFee, setSavedShippingFee] = useState<number>(0);
  const [savedPartFee, setSavedPartFee] = useState<number>(0);
  const printRef = useRef<HTMLDivElement>(null);

  const hasSavedQuote =
    parseFloat(initialServiceFee || '0') > 0 ||
    parseFloat(initialPartFee || '0') > 0;

  useEffect(() => {
    if (isOpen && serviceRequestId) {
      if (hasSavedQuote) {
        setServiceFee(parseFloat(initialServiceFee || '0'));
        setShippingFee(parseFloat(initialShippingFee || '0'));
        setSavedServiceFee(parseFloat(initialServiceFee || '0'));
        setSavedShippingFee(parseFloat(initialShippingFee || '0'));
        setSavedPartFee(parseFloat(initialPartFee || '0'));
        setStep('preview');
      } else {
        setServiceFee(0);
        setShippingFee(0);
        setStep('form');
      }
      fetchProposedParts();
    }
  }, [isOpen, serviceRequestId, initialServiceFee, initialPartFee, initialShippingFee, hasSavedQuote]);

  async function fetchProposedParts() {
    if (!serviceRequestId) return;
    setIsLoadingParts(true);
    try {
      const data = await orderPartsApi.getBySR(serviceRequestId);
      const proposed = (Array.isArray(data) ? data : []).filter(
        (p: OrderPart) => p.status === 'PROPOSED'
      );
      setParts(
        proposed.map((p) => ({
          ...p,
          lineTotal: Number(p.priceAtAction ?? 0) * p.quantity,
        }))
      );
    } catch {
      setParts([]);
    } finally {
      setIsLoadingParts(false);
    }
  }

  const totalPartCost = parts.reduce((sum, p) => sum + Number(p.priceAtAction ?? 0) * p.quantity, 0);

  async function handleSave() {
    if (!ticketNumber) return;
    if (!serviceFee && serviceFee !== 0) {
      toast.error('Biaya jasa wajib diisi');
      return;
    }
    if (parts.length === 0) {
      toast.error('Tidak ada part yang diusulkan');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await srApi.saveQuote(ticketNumber, {
        serviceFee,
        shippingFee: shippingFee || 0,
        performedBy: user?.staffId,
      });

      setSavedServiceFee(result.serviceFee);
      setSavedShippingFee(result.shippingFee);
      setSavedPartFee(result.partFee);
      setStep('preview');
      toast.success('Penawaran berhasil disimpan');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan penawaran';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleClose() {
    if (step === 'preview') {
      onSuccess();
    }
    onClose();
  }

  const crmData = {
    companyName: 'MiPSys',
    companyAddress: 'Jl. Raya Service No. 1',
    companyPhone: '(021) 1234-5678',
    ticketNumber,
    date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 20mm;
          }
          .print-area .no-print {
            display: none !important;
          }
          @page {
            margin: 15mm;
          }
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-60 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/20 bg-[var(--popover)] shadow-lg duration-200 sm:rounded-[2rem] p-0 overflow-hidden">
            <DialogDescription className="sr-only">
              {step === 'form'
                ? 'Form pembuatan penawaran biaya service'
                : 'Pratinjau penawaran biaya service'}
            </DialogDescription>

            <div className="flex flex-col h-full text-left max-h-[90vh]">
              {step === 'form' ? (
                <>
                  <FormHeader ticketNumber={ticketNumber} onClose={handleClose} />

                  <div className="p-8 space-y-6 overflow-y-auto">
                    <FeeInputs
                      serviceFee={serviceFee}
                      shippingFee={shippingFee}
                      onServiceFeeChange={setServiceFee}
                      onShippingFeeChange={setShippingFee}
                    />

                    <PartsList parts={parts} isLoading={isLoadingParts} />

                    <SummaryRow totalPartCost={totalPartCost} serviceFee={serviceFee} shippingFee={shippingFee} />
                  </div>

                  <FormFooter
                    isSubmitting={isSubmitting}
                    onClose={handleClose}
                    onSave={handleSave}
                  />
                </>
              ) : (
                <>
                  <PreviewHeader ticketNumber={ticketNumber} onClose={handleClose} />

                  <div className="flex-1 overflow-y-auto">
                    <div ref={printRef} className="print-area">
                      <div className="p-8 !bg-white !text-black">
                        {/* Kop Surat */}
                        <div className="text-center mb-8 pb-6 border-b-2 border-stone-200">
                          <h1 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                            {crmData.companyName}
                          </h1>
                          <p className="text-xs text-stone-500 mt-1">{crmData.companyAddress}</p>
                          <p className="text-xs text-stone-500">{crmData.companyPhone}</p>
                          <h2 className="text-lg font-black text-emerald-700 uppercase tracking-widest mt-4">
                            Surat Penawaran
                          </h2>
                        </div>

                        {/* Info Tiket */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase">No. Tiket</p>
                            <p className="font-black text-stone-900">{crmData.ticketNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-stone-400 uppercase">Tanggal</p>
                            <p className="font-black text-stone-900">{crmData.date}</p>
                          </div>
                        </div>

                        {/* Rincian Biaya */}
                        <table className="w-full mb-6">
                          <thead>
                            <tr className="border-b-2 border-stone-200">
                              <th className="text-left py-2 text-[10px] font-black text-stone-400 uppercase">Item</th>
                              <th className="text-center py-2 text-[10px] font-black text-stone-400 uppercase">Qty</th>
                              <th className="text-right py-2 text-[10px] font-black text-stone-400 uppercase">Harga</th>
                              <th className="text-right py-2 text-[10px] font-black text-stone-400 uppercase">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parts.map((part) => (
                              <tr key={part.id} className="border-b border-stone-100">
                                <td className="py-2 font-bold text-stone-900 text-sm">{part.partName}</td>
                                <td className="py-2 text-center text-stone-700">{part.quantity}</td>
                                <td className="py-2 text-right text-stone-700">
                                  Rp {Number(part.priceAtAction ?? 0).toLocaleString('id-ID')}
                                </td>
                                <td className="py-2 text-right font-bold text-stone-900">
                                  Rp {(Number(part.priceAtAction ?? 0) * part.quantity).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Total */}
                        <div className="space-y-2 ml-auto w-72">
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Biaya Part</span>
                            <span className="font-bold">Rp {savedPartFee.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Biaya Jasa</span>
                            <span className="font-bold">Rp {savedServiceFee.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Biaya Kirim</span>
                            <span className="font-bold">Rp {savedShippingFee.toLocaleString('id-ID')}</span>
                          </div>
                          <hr className="border-stone-300" />
                          <div className="flex justify-between">
                            <span className="font-black text-stone-700">Grand Total</span>
                            <span className="text-xl font-black text-emerald-700">
                              Rp {(savedPartFee + savedServiceFee + savedShippingFee).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-10 pt-6 border-t border-stone-200 text-center text-[10px] text-stone-400">
                          <p>Penawaran berlaku 7 hari sejak tanggal diterbitkan</p>
                          <p className="mt-1">MiPSys — Enterprise Service Management</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <PreviewFooter onPrint={handlePrint} onClose={handleClose} />
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}

// --- Form Components ---

function FormHeader({
  ticketNumber,
  onClose,
}: {
  ticketNumber: string;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--accent)] text-[var(--accent-foreground)]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-background/20 rounded-2xl backdrop-blur-md">
            <FileText size={24} aria-hidden="true" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Buat Penawaran
            </DialogTitle>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
              Tiket: {ticketNumber}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-background/10 rounded-xl transition-all outline-none"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function FeeInputs({
  serviceFee,
  shippingFee,
  onServiceFeeChange,
  onShippingFeeChange,
}: {
  serviceFee: number;
  shippingFee: number;
  onServiceFeeChange: (v: number) => void;
  onShippingFeeChange: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase text-[var(--muted-foreground)] ml-1 flex items-center gap-2">
        Biaya Tambahan
      </label>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--muted-foreground)] ml-1">
            Biaya Jasa (Service Fee) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-bold text-sm">Rp</span>
            <Input
              type="number"
              min={0}
              value={serviceFee}
              onChange={(e) => onServiceFeeChange(parseInt(e.target.value) || 0)}
              className="pl-10 h-11 border-2 border-border/30 rounded-xl font-bold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--muted-foreground)] ml-1">
            Biaya Kirim (Shipping)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-bold text-sm">Rp</span>
            <Input
              type="number"
              min={0}
              value={shippingFee}
              onChange={(e) => onShippingFeeChange(parseInt(e.target.value) || 0)}
              className="pl-10 h-11 border-2 border-border/30 rounded-xl font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PartsList({
  parts,
  isLoading,
}: {
  parts: ProposedPart[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] py-4">
        <Loader2 className="motion-safe:animate-spin" size={14} aria-hidden="true" /> Memuat part…
      </div>
    );
  }

  if (parts.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-[var(--muted-foreground)] ml-1 flex items-center gap-2">
        <Package size={14} aria-hidden="true" /> Part Diusulkan
      </label>

      <div className="space-y-2">
        {parts.map((part) => (
          <div
            key={part.id}
            className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--foreground)] text-sm truncate">{part.partName}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {part.partCode ?? 'Manual'} x {part.quantity}
              </p>
            </div>
            <p className="font-black text-amber-400 text-sm">
              Rp {part.lineTotal.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--primary)]/10 border border-primary/20">
        <AlertTriangle size={14} className="text-[var(--primary)] shrink-0" aria-hidden="true" />
        <p className="text-[10px] text-[var(--primary)] font-bold">
          Setelah disimpan, penawaran bisa dicetak untuk diberikan ke pelanggan.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  totalPartCost,
  serviceFee,
  shippingFee,
}: {
  totalPartCost: number;
  serviceFee: number;
  shippingFee: number;
}) {
  const grandTotal = totalPartCost + serviceFee + shippingFee;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-[var(--muted)]/50 border border-border/30">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-[var(--muted-foreground)]">Biaya Part</span>
        <span className="font-black text-[var(--foreground)]">Rp {totalPartCost.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-[var(--muted-foreground)]">Biaya Jasa</span>
        <span className="font-black text-[var(--foreground)]">Rp {serviceFee.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-[var(--muted-foreground)]">Biaya Kirim</span>
        <span className="font-black text-[var(--foreground)]">Rp {shippingFee.toLocaleString('id-ID')}</span>
      </div>
      <hr className="border-border/30" />
      <div className="flex justify-between items-center">
        <span className="text-sm font-black text-[var(--foreground)]/70">Grand Total</span>
        <span className="text-xl font-black text-[var(--accent)]">Rp {grandTotal.toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}

function FormFooter({
  isSubmitting,
  onClose,
  onSave,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--muted)]/50 border-t flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase"
      >
        Batal
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={isSubmitting}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90"
      >
        {isSubmitting ? (
          <Loader2 className="motion-safe:animate-spin" size={18} aria-hidden="true" />
        ) : (
          <Save size={18} aria-hidden="true" />
        )}
        Simpan Penawaran
      </Button>
    </div>
  );
}

// --- Preview Components ---

function PreviewHeader({
  ticketNumber,
  onClose,
}: {
  ticketNumber: string;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--accent)] text-[var(--accent-foreground)] no-print">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-background/20 rounded-2xl backdrop-blur-md">
            <FileText size={24} aria-hidden="true" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Penawaran Tersimpan
            </DialogTitle>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
              Tiket: {ticketNumber}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-background/10 rounded-xl transition-all outline-none no-print"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PreviewFooter({
  onPrint,
  onClose,
}: {
  onPrint: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--muted)]/50 border-t flex gap-3 no-print">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase"
      >
        Tutup
      </Button>
      <Button
        type="button"
        onClick={onPrint}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90"
      >
        <Printer size={18} aria-hidden="true" />
        Cetak
      </Button>
    </div>
  );
}
