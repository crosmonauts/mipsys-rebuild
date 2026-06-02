'use client';

import React, { useReducer, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Ban,
  RefreshCw,
  FileDown,
  FileText,
  ArrowLeft,
  Edit3,
  X,
  Loader2,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useServiceRequest, type ServiceRequestDetail } from '../hooks/useServiceRequest';
import { useAuth } from '@/src/lib/auth-context';
import { DiagnosisModal } from '@/src/components/layout/DiagnosisModal';
import { ApproveQuoteModal } from '@/src/components/layout/ApproveQuoteModal';
import { srApi } from '../api/sr-api';
import { financeApi } from '../../finance/api/finance-api';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog';
import { ClientProfile } from './ClientProfile';
import { ProblemDescription } from './ProblemDescription';

const statusToBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  WAITING_CHECK: { label: 'Pending', variant: 'secondary' },
  CHECK: { label: 'Check', variant: 'secondary' },
  WAITING_APPROVE: { label: 'Menunggu Approve', variant: 'outline' },
  SERVICE: { label: 'In Service', variant: 'default' },
  AWAITING_PARTS: { label: 'Menunggu Part', variant: 'outline' },
  DONE: { label: 'Ready', variant: 'default' },
  CANCEL: { label: 'Cancelled', variant: 'destructive' },
};

type DetailState = {
  isEditing: boolean;
  originalData: ServiceRequestDetail | null;
  showDiagnosis: boolean;
  showQuote: boolean;
  showPrintQuote: boolean;
  isApproving: boolean;
  showCancelConfirm: boolean;
  showApproveConfirm: boolean;
  isCancelling: boolean;
  isRetryingStock: boolean;
  isDoneProcessing: boolean;
  hasInvoice: boolean;
  isCreatingInvoice: boolean;
  isSaving: boolean;
};

type DetailAction =
  | { type: 'TOGGLE_EDIT'; payload: { editing: boolean; original?: ServiceRequestDetail | null } }
  | { type: 'SET_HAS_INVOICE'; payload: boolean }
  | { type: 'SET_ORIGINAL'; payload: ServiceRequestDetail | null }
  | { type: 'showDiagnosis'; payload: boolean }
  | { type: 'showQuote'; payload: boolean }
  | { type: 'showPrintQuote'; payload: boolean }
  | { type: 'isApproving'; payload: boolean }
  | { type: 'showCancelConfirm'; payload: boolean }
  | { type: 'showApproveConfirm'; payload: boolean }
  | { type: 'isCancelling'; payload: boolean }
  | { type: 'isRetryingStock'; payload: boolean }
  | { type: 'isDoneProcessing'; payload: boolean }
  | { type: 'isCreatingInvoice'; payload: boolean }
  | { type: 'isSaving'; payload: boolean };

function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    case 'TOGGLE_EDIT':
      return { ...state, isEditing: action.payload.editing, originalData: action.payload.original ?? state.originalData };
    case 'SET_HAS_INVOICE':
      return { ...state, hasInvoice: action.payload };
    case 'SET_ORIGINAL':
      return { ...state, originalData: action.payload };
    default:
      return { ...state, [action.type]: action.payload };
  }
}

const INITIAL_STATE: DetailState = {
  isEditing: false,
  originalData: null,
  showDiagnosis: false,
  showQuote: false,
  showPrintQuote: false,
  isApproving: false,
  showCancelConfirm: false,
  showApproveConfirm: false,
  isCancelling: false,
  isRetryingStock: false,
  isDoneProcessing: false,
  hasInvoice: false,
  isCreatingInvoice: false,
  isSaving: false,
};

const ServiceRequestDetail = () => {
  const params = useParams();
  const ticketNumber = params.id as string;
  const { data, setData, isLoading, refetch } = useServiceRequest(ticketNumber);
  const { user } = useAuth();
  const [state, dispatch] = useReducer(detailReducer, INITIAL_STATE);

  const hasUnsavedChanges = state.isEditing;

  useEffect(() => {
    if (data) dispatch({ type: 'SET_HAS_INVOICE', payload: data.hasInvoice ?? false });
  }, [data]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const hasSavedQuote = data && (parseFloat(data.serviceFee || '0') > 0 || parseFloat(data.partFee || '0') > 0);

  const handleEditToggle = () => {
    if (!state.isEditing) {
      if (data) dispatch({ type: 'SET_ORIGINAL', payload: { ...data } });
    } else if (state.originalData) {
      setData(state.originalData);
    }
    dispatch({ type: 'TOGGLE_EDIT', payload: { editing: !state.isEditing } });
  };

  const handleFieldChange = useCallback((field: string, value: string) => {
    setData((prev) => prev ? { ...prev, [field]: value } : prev);
  }, [setData]);

  async function handleSaveChanges() {
    if (!ticketNumber || !data) return;
    dispatch({ type: 'isSaving', payload: true });
    try {
      await srApi.updateEntry(ticketNumber, {
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        modelName: data.modelName,
        serialNumber: data.serialNumber,
        problemDescription: data.problemDescription,
      });
      toast.success('Perubahan berhasil disimpan');
      dispatch({ type: 'TOGGLE_EDIT', payload: { editing: false } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan perubahan';
      toast.error(message);
    } finally {
      dispatch({ type: 'isSaving', payload: false });
    }
  }

  async function handleApproveQuote() {
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
  }

  async function handleCancelQuote() {
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
  }

  async function handleRetryStock() {
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
  }

  async function handleMarkDone() {
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
          { duration: 5000 }
        );
      }
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyelesaikan service';
      toast.error(message);
    } finally {
      dispatch({ type: 'isDoneProcessing', payload: false });
    }
  }

  async function handleCreateInvoice() {
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
        { duration: 5000 }
      );
      dispatch({ type: 'SET_HAS_INVOICE', payload: true });
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat invoice';
      toast.error(message);
    } finally {
      dispatch({ type: 'isCreatingInvoice', payload: false });
    }
  }

  if (isLoading || !data) return <LoadingState />;

  const badgeCfg = statusToBadge[data.statusService] || { label: data.statusService, variant: 'secondary' as const };

  return (
    <main className="min-h-screen planner-bg text-foreground font-sans selection:bg-primary/20">
      <div className="max-w-7xl mx-auto p-8 md:p-10 lg:p-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-10">
          <div className="space-y-6">
            <Link
              href="/service-request"
              className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} aria-hidden="true" /> Back to Dashboard
            </Link>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">
                  {data.serviceType || 'NON_WARRANTY'}
                </Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  ENTRY: {new Date(data.incomingDate).toLocaleDateString('id-ID')}
                </span>
              </div>
              <h1 className="text-4xl md:text-4xl font-black text-foreground tracking-tighter leading-none break-all text-balance">
                {ticketNumber}
              </h1>
            </div>
          </div>

          <Button
            variant={state.isEditing ? 'secondary' : 'outline'}
            size="lg"
            onClick={handleEditToggle}
            className="gap-3 px-10 h-14 rounded-2xl text-xs font-black tracking-widest"
          >
            {state.isEditing ? <X size={16} aria-hidden="true" /> : <Edit3 size={16} aria-hidden="true" />}
            {state.isEditing ? 'CANCEL' : 'EDIT TICKET'}
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-8">
            <ClientProfile
              customerName={data.customerName}
              phone={data.phone}
              address={data.address}
              isEditing={state.isEditing}
              onChange={handleFieldChange}
            />

            <ProblemDescription
              value={data.problemDescription}
              isEditing={state.isEditing}
              onChange={(v) => handleFieldChange('problemDescription', v)}
            />
          </div>

          <div className="lg:col-span-5">
            <aside className="sticky top-10 space-y-6">
              <Card className="!p-6 space-y-6">
                <CardContent className="space-y-6 !p-0">
                  <p className="micro-label text-muted-foreground">Live Progress</p>
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck size={28} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                      <Badge variant={badgeCfg.variant} className="text-lg font-black uppercase tracking-tighter italic px-4 py-1.5 h-auto">
                        {badgeCfg.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>

                <CardContent className="space-y-3 !p-0">
                  {(data.statusService === 'WAITING_CHECK' || data.statusService === 'CHECK') && (
                    <>
                      <Button
                        className="w-full h-14 rounded-2xl text-xs font-black tracking-widest"
                        onClick={() => dispatch({ type: 'showDiagnosis', payload: true })}
                      >
                        DIAGNOSA & UPDATE STATUS
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2"
                        onClick={() => dispatch({ type: 'showCancelConfirm', payload: true })}
                      >
                        <Ban size={16} aria-hidden="true" /> BATALKAN
                      </Button>
                    </>
                  )}

                  {data.statusService === 'WAITING_APPROVE' && (
                    <>
                      <Button
                        className="w-full h-14 rounded-2xl text-xs font-black tracking-widest"
                        onClick={() => dispatch({ type: 'showDiagnosis', payload: true })}
                      >
                        DIAGNOSA
                      </Button>

                      {!hasSavedQuote ? (
                        <Button
                          variant="default"
                          className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2 bg-primary hover:bg-primary/90"
                          onClick={() => dispatch({ type: 'showQuote', payload: true })}
                        >
                          <FileText size={16} aria-hidden="true" /> BUAT PENAWARAN
                        </Button>
                      ) : (
                        <>
                          <div className="p-3 rounded-xl bg-primary/10 border-2 border-primary/30">
                            <p className="text-[10px] font-black text-primary text-center">
                              Penawaran sudah dibuat
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2 border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => dispatch({ type: 'showPrintQuote', payload: true })}
                          >
                            <FileText size={16} aria-hidden="true" /> CETAK PENAWARAN
                          </Button>

                          <Button
                            className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2 bg-primary hover:bg-primary/90"
                            onClick={() => dispatch({ type: 'showApproveConfirm', payload: true })}
                            disabled={state.isApproving}
                          >
                            {state.isApproving ? <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                            SETUJUI
                          </Button>

                          <Button
                            variant="destructive"
                            className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2"
                            onClick={() => dispatch({ type: 'showCancelConfirm', payload: true })}
                            disabled={state.isCancelling}
                          >
                            {state.isCancelling ? <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
                            BATALKAN
                          </Button>
                        </>
                      )}
                    </>
                  )}

                  {data.statusService === 'SERVICE' && (
                    <Button
                      className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleMarkDone}
                      disabled={state.isDoneProcessing}
                    >
                      {state.isDoneProcessing ? <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                      SELESAIKAN
                    </Button>
                  )}

                  {data.statusService === 'AWAITING_PARTS' && (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-center motion-safe:animate-in motion-safe:fade-in">
                        <p className="text-xs font-bold text-amber-400">Menunggu Part — PO sedang diproses</p>
                      </div>
                      <Button
                        className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2"
                        onClick={handleRetryStock}
                        disabled={state.isRetryingStock}
                      >
                        {state.isRetryingStock ? <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
                        CEK ULANG STOK
                      </Button>
                    </div>
                  )}

                  {data.statusService === 'DONE' && !state.hasInvoice && (
                    <Button
                      className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleCreateInvoice}
                      disabled={state.isCreatingInvoice}
                    >
                      {state.isCreatingInvoice ? <Loader2 className="motion-safe:animate-spin" size={16} aria-hidden="true" /> : <FileDown size={16} aria-hidden="true" />}
                      BUAT INVOICE
                    </Button>
                  )}

                  {data.statusService === 'DONE' && state.hasInvoice && (
                    <Link href="/finance">
                      <Button className="w-full h-14 rounded-2xl text-xs font-black tracking-widest gap-2">
                        <FileText size={16} aria-hidden="true" /> LIHAT INVOICE
                      </Button>
                    </Link>
                  )}
                </CardContent>

                <div className="border-t border-border/10 !mx-0" />

                <CardContent className="space-y-8 !p-0">
                  <p className="micro-label text-muted-foreground">03. Unit Specification</p>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-border/10 pb-4">
                      <span className="micro-label text-muted-foreground">Model</span>
                      <span className="text-lg font-bold text-foreground">{data.modelName || '-'}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-border/10 pb-4">
                      <span className="micro-label text-muted-foreground">S/N</span>
                      <span className="text-lg font-bold text-foreground">{data.serialNumber || '-'}</span>
                    </div>
                  </div>
                </CardContent>

                {state.isEditing && (
                  <CardContent className="!p-0">
                    <Button
                      className="w-full h-14 rounded-2xl text-[10px] font-black tracking-[0.3em]"
                      onClick={handleSaveChanges}
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? 'MENYIMPAN…' : 'CONFIRM CHANGES'}
                    </Button>
                  </CardContent>
                )}
              </Card>

              <div className="px-10 flex items-center gap-3 text-muted-foreground">
                <Activity size={14} aria-hidden="true" />
                <p className="text-[9px] font-bold uppercase tracking-luxury">MIPSYS Enterprise AAA Standard</p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {state.showDiagnosis && (
        <DiagnosisModal
          ticketNumber={ticketNumber}
          serviceRequestId={data?.id ?? null}
          isOpen={state.showDiagnosis}
          onClose={() => dispatch({ type: 'showDiagnosis', payload: false })}
          onSuccess={() => { refetch(); }}
          currentStatus={data?.statusService}
        />
      )}

      {state.showQuote && (
        <ApproveQuoteModal
          ticketNumber={ticketNumber}
          serviceRequestId={data?.id ?? null}
          isOpen={state.showQuote}
          onClose={() => dispatch({ type: 'showQuote', payload: false })}
          onSuccess={() => { refetch(); }}
        />
      )}

      {state.showPrintQuote && hasSavedQuote && (
        <ApproveQuoteModal
          ticketNumber={ticketNumber}
          serviceRequestId={data?.id ?? null}
          isOpen={state.showPrintQuote}
          onClose={() => dispatch({ type: 'showPrintQuote', payload: false })}
          onSuccess={() => { refetch(); }}
          initialServiceFee={data?.serviceFee}
          initialPartFee={data?.partFee}
          initialShippingFee={data?.shippingFee}
        />
      )}

      <ConfirmDialog
        open={state.showApproveConfirm}
        onOpenChange={(v) => dispatch({ type: 'showApproveConfirm', payload: v })}
        title="Setujui Penawaran?"
        description="Yakin ingin menyetujui penawaran ini? Status tiket akan berubah menjadi SERVICE atau AWAITING_PARTS."
        confirmLabel="Ya, Setujui"
        variant="default"
        loading={state.isApproving}
        onConfirm={handleApproveQuote}
      />
      <ConfirmDialog
        open={state.showCancelConfirm}
        onOpenChange={(v) => dispatch({ type: 'showCancelConfirm', payload: v })}
        title="Batalkan Tiket?"
        description="Yakin ingin membatalkan tiket ini? Semua part yang diusulkan akan dibatalkan."
        confirmLabel="Ya, Batalkan"
        variant="destructive"
        loading={state.isCancelling}
        onConfirm={handleCancelQuote}
      />
    </main>
  );
};

const LoadingState = () => (
  <div className="min-h-screen planner-bg flex flex-col items-center justify-center gap-6 text-primary">
    <Loader2 className="motion-safe:animate-spin" size={40} strokeWidth={1} aria-hidden="true" />
    <p className="text-[10px] font-black uppercase tracking-[0.6em]">Synchronizing…</p>
  </div>
);

export default ServiceRequestDetail;
