'use client';

import { useState } from 'react';
import { Banknote } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { srApi } from '@/src/features/service-request/api/sr-api';

interface ServiceRequestSummary {
  ticketNumber: string;
  partFee?: string | number;
}

interface PaymentModalProps {
  sr: ServiceRequestSummary;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ sr, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [serviceFee, setServiceFee] = useState(0);

  const partFee = Number(sr?.partFee) || 0;

  const subtotal = serviceFee + partFee;
  const ppn = Math.round(subtotal * 0.11);
  const total = subtotal + ppn;

  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = async () => {
    try {
      await srApi.prosesKasir(sr.ticketNumber, {
        serviceFee,
        partFee,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error bayar:', error);
      alert('Gagal memproses pembayaran. Pastikan koneksi aman.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2 text-accent">
            <Banknote size={24} aria-hidden="true" />
            Penyelesaian & Pembayaran
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground/80 font-bold">Biaya Jasa</Label>
              <Input
                type="number"
                min="0"
                className="text-lg font-medium h-12"
                placeholder="Rp 0..."
                value={serviceFee === 0 ? '' : serviceFee}
                onChange={(e) => setServiceFee(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-5 bg-muted/30 rounded-xl space-y-3 border border-border shadow-inner">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Total Sparepart:
              </span>
              <span className="font-bold text-foreground/80">
                {formatIDR(partFee)}
              </span>
            </div>
            {serviceFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Biaya Jasa:</span>
                <span className="font-bold text-foreground/80">
                  {formatIDR(serviceFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">PPN (11%):</span>
              <span className="font-bold text-primary">{formatIDR(ppn)}</span>
            </div>
            <div className="border-t border-border pt-3 mt-2 flex justify-between items-center">
              <span className="font-black text-sm text-muted-foreground">
                TOTAL BAYAR
              </span>
              <span className="font-black text-2xl text-accent">
                {formatIDR(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 px-6"
          >
            Selesaikan & Tutup Tiket
          </Button>
        </div>
      </div>
    </div>
  );
}
