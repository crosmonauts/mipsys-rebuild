'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'default';
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Konfirmasi',
  description,
  confirmLabel = 'Konfirmasi',
  variant = 'default',
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          {variant === 'destructive' && (
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mb-2">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
          )}
          <DialogTitle className="text-center font-black text-base">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center font-bold text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="flex gap-3 pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest"
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
