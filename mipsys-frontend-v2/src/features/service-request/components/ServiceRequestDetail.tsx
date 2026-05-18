'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServiceRequest } from '../hooks/useServiceRequest';
import { DiagnosisModal } from '@/src/components/layout/DiagnosisModal';
import { ApproveQuoteModal } from '@/src/components/layout/ApproveQuoteModal';
import { srApi } from '../api/sr-api';
import toast from 'react-hot-toast';
import {
  User,
  Smartphone,
  Printer,
  Hash,
  ShieldCheck,
  AlertCircle,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Loader2,
  MapPin,
  Activity,
  FileText,
  CheckCircle2,
  Ban,
  RefreshCw,
} from 'lucide-react';

// DoD: Type Safety untuk menghindari error 7006
interface DataFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  isEditing?: boolean;
  isTextarea?: boolean;
  onChange?: (v: string) => void;
}

const ServiceRequestDetail = () => {
  const params = useParams();
  const router = useRouter();
  const ticketNumber = params.id as string;
  const { data, setData, isLoading } = useServiceRequest(ticketNumber);

  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showPrintQuote, setShowPrintQuote] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetryingStock, setIsRetryingStock] = useState(false);
  const [isDoneProcessing, setIsDoneProcessing] = useState(false);

  const hasSavedQuote =
    data && (parseFloat(data.serviceFee || '0') > 0 || parseFloat(data.partFee || '0') > 0);

  const handleEditToggle = () => {
    if (!isEditing) {
      if (data) setOriginalData({ ...data });
    }
    else setData(originalData);
    setIsEditing(!isEditing);
  };

  async function handleApproveQuote() {
    if (!ticketNumber) return;
    setIsApproving(true);
    try {
      const result = await srApi.approveQuote(ticketNumber, { performedBy: 1 });

      if (result.allInStock) {
        toast.success(`Penawaran disetujui. Status → SERVICE. ${result.partsProcessed} part dipotong dari stok.`);
      } else {
        toast.success(`Penawaran disetujui. Beberapa part tidak tersedia. Status → AWAITING_PARTS.`);
      }

      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyetujui penawaran';
      toast.error(message);
    } finally {
      setIsApproving(false);
    }
  }

  async function handleCancelQuote() {
    if (!ticketNumber) return;
    if (!window.confirm('Yakin ingin membatalkan tiket ini? Semua part yang diusulkan akan dibatalkan.')) return;

    setIsCancelling(true);
    try {
      await srApi.cancelQuote(ticketNumber, { performedBy: 1 });
      toast.success('Tiket dibatalkan.');
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membatalkan tiket';
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleRetryStock() {
    if (!ticketNumber) return;
    setIsRetryingStock(true);
    try {
      const result = await srApi.retryAwaitingParts(ticketNumber, { performedBy: 1 });

      if (result.available) {
        toast.success(`Stok tersedia! ${result.partsProcessed} part dipotong. Status → SERVICE`);
      } else {
        toast.error('Stok masih belum mencukupi. PO perlu dilanjutkan.');
      }

      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal cek ulang stok';
      toast.error(message);
    } finally {
      setIsRetryingStock(false);
    }
  }

  async function handleMarkDone() {
    if (!ticketNumber) return;
    setIsDoneProcessing(true);
    try {
      await srApi.diagnose(ticketNumber, {
        newStatus: 'DONE',
        parts: [],
        performedBy: 1,
      });
      toast.success('Service selesai!');
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyelesaikan service';
      toast.error(message);
    } finally {
      setIsDoneProcessing(false);
    }
  }

  if (isLoading || !data) return <LoadingState />;

  return (
    <main className="min-h-screen planner-bg text-foreground font-sans selection:bg-primary/20">
      <div className="max-w-8xl mx-auto p-8 md:p-10 lg:p-10">
        {/* --- HEADER IDENTITY --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-10">
          <div className="space-y-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all text-[10px] font-bold uppercase tracking-[0.4em]"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-primary/15 text-amber-400 text-[9px] font-black rounded uppercase tracking-widest">
                  {data.serviceType || 'NON_WARRANTY'}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  ENTRY: {data.incomingDate?.split('T')[0]}
                </span>
              </div>
              <h1 className="text-6xl md:text-4xl font-black text-foreground tracking-tighter leading-none">
                {ticketNumber}
              </h1>
            </div>
          </div>

          <button
            onClick={handleEditToggle}
            className={`group flex items-center gap-3 px-10 py-4 rounded-full text-xs font-black tracking-widest transition-all ${
              isEditing
                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                : 'bg-card text-foreground hover:bg-primary/20 shadow-lg'
            }`}
          >
            {isEditing ? (
              <>
                <X size={16} /> CANCEL
              </>
            ) : (
              <>
                <Edit3 size={16} /> EDIT TICKET
              </>
            )}
          </button>
        </header>

        {/* --- CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: CUSTOMER & PROBLEM (RUANG LEBIH LUAS) */}
          <div className="lg:col-span-7 space-y-10">
            {/* SEKSI 01: PELANGGAN */}
            <section className="space-y-8">
              <h2 className="micro-label text-primary flex items-center gap-6">
                01. Client Profile{' '}
                <span className="h-[1px] flex-1 bg-border/20"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                <DataField
                  label="Full Name"
                  value={data.customerName}
                  isEditing={isEditing}
                  onChange={(v) => setData({ ...data, customerName: v })}
                />
                <DataField
                  label="WhatsApp"
                  value={data.phone}
                  icon={<Smartphone size={14} />}
                  isEditing={isEditing}
                  onChange={(v) => setData({ ...data, phone: v })}
                />
                <div className="md:col-span-2">
                  <DataField
                    label="Service Address"
                    value={data.address}
                    icon={<MapPin size={14} />}
                    isEditing={isEditing}
                    isTextarea
                    onChange={(v) => setData({ ...data, address: v })}
                  />
                </div>
              </div>
            </section>

            {/* SEKSI 02: PROBLEM DESCRIPTION (PINDAH KE KIRI) */}
            <section className="space-y-10">
              <h2 className="micro-label text-primary flex items-center gap-6">
                02. Issue Description{' '}
                <span className="h-[1px] flex-1 bg-border/20"></span>
              </h2>
              <div className="group">
                {isEditing ? (
                  <textarea
                    className="w-full p-6 bg-card border border-border/20 rounded-3xl outline-none focus:border-primary transition-all font-medium text-foreground/80 min-h-[150px] shadow-sm"
                    value={data.problemDescription}
                    onChange={(e) =>
                      setData({ ...data, problemDescription: e.target.value })
                    }
                  />
                ) : (
                  <div className="glass-panel p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20"></div>
                    <p className="text-xl font-medium leading-relaxed text-foreground/80 italic">
                      "
                      {data.problemDescription ||
                        'No detailed problem reported.'}
                      "
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: STATUS & DEVICE INTEL (SIDEBAR) */}
          <div className="lg:col-span-5">
            <aside className="sticky top-10 space-y-10">
              {/* CARD STATUS */}
              <div className="paper-card p-10 space-y-10">
                <div className="space-y-6">
                  <p className="micro-label text-muted-foreground">
                    Live Progress
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck size={28} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        Status
                      </p>
                      <p className="text-xl font-black text-amber-400 uppercase tracking-tighter italic">
                        {data.statusService?.replace('_', ' ')}
                      </p>
                    </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {(data.statusService === 'WAITING_CHECK' || data.statusService === 'CHECK') && (
                      <button
                        onClick={() => setShowDiagnosis(true)}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-full text-xs font-black tracking-widest hover:bg-primary/90 transition-all shadow-lg"
                      >
                        DIAGNOSA & UPDATE STATUS
                      </button>
                    )}

                    {data.statusService === 'WAITING_APPROVE' && (
                      <>
                        <button
                          onClick={() => setShowDiagnosis(true)}
                          className="w-full py-4 bg-primary text-primary-foreground rounded-full text-xs font-black tracking-widest hover:bg-primary/90 transition-all shadow-lg"
                        >
                          DIAGNOSA
                        </button>

                        {!hasSavedQuote ? (
                          <button
                            onClick={() => setShowQuote(true)}
                            className="w-full py-4 bg-emerald-600 text-white rounded-full text-xs font-black tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            <FileText size={16} /> BUAT PENAWARAN
                          </button>
                        ) : (
                          <>
                            <div className="p-3 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30">
                              <p className="text-[10px] font-black text-emerald-400 text-center">
                                Penawaran sudah dibuat
                              </p>
                            </div>

                            <button
                              onClick={() => setShowPrintQuote(true)}
                              className="w-full py-4 bg-transparent text-emerald-400 rounded-full text-xs font-black tracking-widest hover:bg-emerald-500/10 transition-all shadow-lg border-2 border-emerald-500/50 flex items-center justify-center gap-2"
                            >
                              <FileText size={16} /> CETAK PENAWARAN
                            </button>

                            <button
                              onClick={handleApproveQuote}
                              disabled={isApproving}
                              className="w-full py-4 bg-emerald-600 text-white rounded-full text-xs font-black tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                              {isApproving ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                              SETUJUI
                            </button>

                            <button
                              onClick={handleCancelQuote}
                              disabled={isCancelling}
                              className="w-full py-4 bg-red-600 text-white rounded-full text-xs font-black tracking-widest hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                              {isCancelling ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <Ban size={16} />
                              )}
                              BATALKAN
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {data.statusService === 'SERVICE' && (
                      <button
                        onClick={handleMarkDone}
                        disabled={isDoneProcessing}
                        className="w-full py-4 bg-emerald-600 text-white rounded-full text-xs font-black tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        {isDoneProcessing ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        SELESAIKAN
                      </button>
                    )}

                    {data.statusService === 'AWAITING_PARTS' && (
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-center">
                          <p className="text-xs font-bold text-amber-400">Menunggu Part — PO sedang diproses</p>
                        </div>
                        <button
                          onClick={handleRetryStock}
                          disabled={isRetryingStock}
                          className="w-full py-4 bg-primary text-primary-foreground rounded-full text-xs font-black tracking-widest hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          {isRetryingStock ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                          CEK ULANG STOK
                        </button>
                      </div>
                    )}
                  </div>

                  <hr className="border-border/10" />

                {/* SEKSI 03: DEVICE INTEL (PINDAH KE SINI) */}
                <div className="space-y-8">
                  <p className="micro-label text-muted-foreground">
                    03. Unit Specification
                  </p>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-border/10 pb-4">
                      <span className="micro-label text-muted-foreground">
                        Model
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {data.modelName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-border/10 pb-4">
                      <span className="micro-label text-muted-foreground">
                        S/N
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {data.serialNumber || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <button className="w-full py-5 bg-primary text-primary-foreground rounded-full font-black text-[10px] tracking-[0.3em] hover:bg-primary/90 transition-all shadow-lg">
                    CONFIRM CHANGES
                  </button>
                )}
              </div>

              {/* OPTIONAL: QUICK INFO FOOTER */}
              <div className="px-10 flex items-center gap-3 text-muted-foreground">
                <Activity size={14} />
                <p className="text-[9px] font-bold uppercase tracking-luxury">
                  MIPSYS Enterprise AAA Standard
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showDiagnosis && (
        <DiagnosisModal
          ticketNumber={ticketNumber}
          serviceRequestId={data?.id ?? null}
          isOpen={showDiagnosis}
          onClose={() => setShowDiagnosis(false)}
          onSuccess={() => { window.location.reload(); }}
          currentStatus={data?.statusService}
        />
      )}

      {showQuote && (
        <ApproveQuoteModal
          ticketNumber={ticketNumber}
          serviceRequestId={data?.id ?? null}
          isOpen={showQuote}
          onClose={() => setShowQuote(false)}
          onSuccess={() => { window.location.reload(); }}
        />
      )}

      {showPrintQuote && hasSavedQuote && (
        <ApproveQuoteModal
          ticketNumber={ticketNumber}
          serviceRequestId={data?.id ?? null}
          isOpen={showPrintQuote}
          onClose={() => setShowPrintQuote(false)}
          onSuccess={() => { window.location.reload(); }}
          initialServiceFee={data?.serviceFee}
          initialPartFee={data?.partFee}
          initialShippingFee={data?.shippingFee}
        />
      )}
    </main>
  );
};

// --- LUXE DATA FIELD COMPONENT ---
const DataField = ({
  label,
  value,
  icon,
  isEditing,
  isTextarea,
  onChange,
}: DataFieldProps) => (
  <div className="group space-y-3">
    <label className="micro-label text-muted-foreground flex items-center gap-2">
      {icon} {label}
    </label>
    {isEditing ? (
      isTextarea ? (
        <textarea
          className="w-full p-0 bg-transparent border-b border-border/30 focus:border-primary outline-none transition-all font-bold text-foreground py-2 min-h-[80px] resize-none"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <input
          className="w-full p-0 bg-transparent border-b border-border/30 focus:border-primary outline-none transition-all font-bold text-foreground py-2"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    ) : (
      <p className="text-2xl font-black text-foreground tracking-tight leading-none pt-1">
        {value || (
          <span className="text-muted-foreground/40 font-normal italic">N/A</span>
        )}
      </p>
    )}
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen planner-bg flex flex-col items-center justify-center gap-6 text-primary">
    <Loader2 className="animate-spin" size={40} strokeWidth={1} />
    <p className="text-[10px] font-black uppercase tracking-[0.6em]">
      Synchronizing
    </p>
  </div>
);

export default ServiceRequestDetail;
