'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { srApi } from '../api/sr-api';
import { financeApi } from '../../finance/api/finance-api';
import type { ServiceRequestDetail } from './useServiceRequest';

type DispatchFn = (action: { type: string; payload: unknown }) => void;
type SetDataFn = (
  updater: ServiceRequestDetail | ((prev: ServiceRequestDetail | null) => ServiceRequestDetail | null),
) => void;

export function useSrActions(
  ticketNumber: string | undefined,
  user: { staffId?: number } | null,
  refetch: () => Promise<void>,
  _setData: SetDataFn,
  dispatch: DispatchFn,
) {
  const handleSaveChanges = useCallback(
    async (fields: {
      customerName: string;
      phone: string;
      address: string;
      modelName: string;
      serialNumber: string;
      problemDescription: string;
    }) => {
      if (!ticketNumber) return;
      dispatch({ type: 'isSaving', payload: true });
      try {
        await srApi.updateEntry(ticketNumber, fields);
        toast.success('Perubahan berhasil disimpan');
        dispatch({ type: 'TOGGLE_EDIT', payload: { editing: false } });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal menyimpan perubahan';
        toast.error(message);
      } finally {
        dispatch({ type: 'isSaving', payload: false });
      }
    },
    [ticketNumber, dispatch],
  );

  const handleApproveQuote = useCallback(async () => {
    if (!ticketNumber) return;
    dispatch({ type: 'isApproving', payload: true });
    try {
      const result = await srApi.approveQuote(ticketNumber, { performedBy: user?.staffId });

      if (result.allInStock) {
        toast.success(`Penawaran disetujui. Status → SERVICE. ${result.partsProcessed} part dipotong dari stok.`);
      } else {
        toast.success('Penawaran disetujui. Beberapa part tidak tersedia. Status → AWAITING_PARTS.');
      }
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyetujui penawaran';
      toast.error(message);
    } finally {
      dispatch({ type: 'isApproving', payload: false });
    }
  }, [ticketNumber, user?.staffId, refetch, dispatch]);

  const handleCancelQuote = useCallback(async () => {
    if (!ticketNumber) return;
    dispatch({ type: 'isCancelling', payload: true });
    try {
      await srApi.cancelQuote(ticketNumber, { performedBy: user?.staffId });
      toast.success('Tiket dibatalkan.');
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membatalkan tiket';
      toast.error(message);
    } finally {
      dispatch({ type: 'isCancelling', payload: false });
      dispatch({ type: 'showCancelConfirm', payload: false });
    }
  }, [ticketNumber, user?.staffId, refetch, dispatch]);

  const handleRetryStock = useCallback(async () => {
    if (!ticketNumber) return;
    dispatch({ type: 'isRetryingStock', payload: true });
    try {
      const result = await srApi.retryAwaitingParts(ticketNumber, { performedBy: user?.staffId });

      if (result.available) {
        toast.success(`Stok tersedia! ${result.partsProcessed} part dipotong. Status → SERVICE`);
      } else {
        toast.error('Stok masih belum mencukupi. PO perlu dilanjutkan.');
      }
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal cek ulang stok';
      toast.error(message);
    } finally {
      dispatch({ type: 'isRetryingStock', payload: false });
    }
  }, [ticketNumber, user?.staffId, refetch, dispatch]);

  const handleMarkDone = useCallback(async () => {
    if (!ticketNumber) return;
    dispatch({ type: 'isDoneProcessing', payload: true });
    try {
      const res = await srApi.diagnose(ticketNumber, {
        newStatus: 'DONE',
        parts: [],
        performedBy: user?.staffId,
      });
      toast.success('Service selesai!');
      if (res.invoice) {
        dispatch({ type: 'SET_HAS_INVOICE', payload: true });
        toast.success(
          <div className="flex items-center gap-2">
            <span>Invoice berhasil dibuat: </span>
            <Link href={`/finance?search=${res.invoice.invoiceNumber}`} className="underline font-bold">
              {res.invoice.invoiceNumber}
            </Link>
          </div>,
          { duration: 5000 },
        );
      }
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyelesaikan service';
      toast.error(message);
    } finally {
      dispatch({ type: 'isDoneProcessing', payload: false });
    }
  }, [ticketNumber, user?.staffId, refetch, dispatch]);

  const handleCreateInvoice = useCallback(async () => {
    if (!ticketNumber) return;
    dispatch({ type: 'isCreatingInvoice', payload: true });
    try {
      const result = await financeApi.generateFromSR(ticketNumber);
      toast.success(
        <div className="flex items-center gap-2">
          <span>Invoice berhasil dibuat: </span>
          <Link href={`/finance?search=${result.invoiceNumber}`} className="underline font-bold">
            {result.invoiceNumber}
          </Link>
        </div>,
        { duration: 5000 },
      );
      dispatch({ type: 'SET_HAS_INVOICE', payload: true });
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat invoice';
      toast.error(message);
    } finally {
      dispatch({ type: 'isCreatingInvoice', payload: false });
    }
  }, [ticketNumber, refetch, dispatch]);

  return {
    handleSaveChanges,
    handleApproveQuote,
    handleCancelQuote,
    handleRetryStock,
    handleMarkDone,
    handleCreateInvoice,
  };
}
