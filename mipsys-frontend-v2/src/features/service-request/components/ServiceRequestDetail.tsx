'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useServiceRequest } from '../hooks/useServiceRequest';
import { DiagnosisModal } from '@/src/components/layout/DiagnosisModal';
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

  const handleEditToggle = () => {
    if (!isEditing) {
      if (data) setOriginalData({ ...data });
    }
    else setData(originalData);
    setIsEditing(!isEditing);
  };

  if (isLoading || !data) return <LoadingState />;

  return (
    <main className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-amber-100">
      <div className="max-w-8xl mx-auto p-8 md:p-10 lg:p-10">
        {/* --- HEADER IDENTITY --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-10">
          <div className="space-y-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-stone-400 hover:text-amber-700 transition-all text-[10px] font-bold uppercase tracking-[0.4em]"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-widest">
                  {data.serviceType || 'NON_WARRANTY'}
                </span>
                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                  ENTRY: {data.incomingDate?.split('T')[0]}
                </span>
              </div>
              <h1 className="text-6xl md:text-4xl font-black text-stone-900 tracking-tighter leading-none">
                {ticketNumber}
              </h1>
            </div>
          </div>

          <button
            onClick={handleEditToggle}
            className={`group flex items-center gap-3 px-10 py-4 rounded-full text-xs font-black tracking-widest transition-all ${
              isEditing
                ? 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                : 'bg-stone-900 text-stone-50 hover:bg-amber-600 shadow-xl shadow-amber-100'
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
              <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.5em] flex items-center gap-6">
                01. Client Profile{' '}
                <span className="h-[1px] flex-1 bg-stone-100"></span>
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
              <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.5em] flex items-center gap-6">
                02. Issue Description{' '}
                <span className="h-[1px] flex-1 bg-stone-100"></span>
              </h2>
              <div className="group">
                {isEditing ? (
                  <textarea
                    className="w-full p-6 bg-white border border-stone-100 rounded-3xl outline-none focus:border-amber-600 transition-all font-medium text-stone-800 min-h-[150px] shadow-sm"
                    value={data.problemDescription}
                    onChange={(e) =>
                      setData({ ...data, problemDescription: e.target.value })
                    }
                  />
                ) : (
                  <div className="p-10 bg-white border border-stone-50 rounded-[3rem] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600/20"></div>
                    <p className="text-xl font-medium leading-relaxed text-stone-800 italic font-serif">
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
              <div className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-sm space-y-10">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
                    Live Progress
                  </p>
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <ShieldCheck size={28} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">
                        Status
                      </p>
                      <p className="text-xl font-black text-amber-700 uppercase tracking-tighter italic">
                        {data.statusService?.replace('_', ' ')}
                      </p>
                    </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDiagnosis(true)}
                    className="w-full py-4 bg-blue-600 text-white rounded-full text-xs font-black tracking-widest hover:bg-blue-700 transition-all shadow-lg mt-4"
                  >
                    DIAGNOSA & UPDATE STATUS
                  </button>

                  <hr className="border-stone-50" />

                {/* SEKSI 03: DEVICE INTEL (PINDAH KE SINI) */}
                <div className="space-y-8">
                  <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
                    03. Unit Specification
                  </p>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-stone-50 pb-4">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Model
                      </span>
                      <span className="text-lg font-black text-stone-900">
                        {data.modelName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end border-b border-stone-50 pb-4">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        S/N
                      </span>
                      <span className="text-lg font-black text-stone-900">
                        {data.serialNumber || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <button className="w-full py-5 bg-amber-600 text-white rounded-full font-black text-[10px] tracking-[0.3em] hover:bg-amber-700 transition-all shadow-xl shadow-amber-100">
                    CONFIRM CHANGES
                  </button>
                )}
              </div>

              {/* OPTIONAL: QUICK INFO FOOTER */}
              <div className="px-10 flex items-center gap-3 text-stone-300">
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
    <label className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] flex items-center gap-2">
      {icon} {label}
    </label>
    {isEditing ? (
      isTextarea ? (
        <textarea
          className="w-full p-0 bg-transparent border-b border-stone-200 focus:border-amber-600 outline-none transition-all font-bold text-stone-900 py-2 min-h-[80px] resize-none"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <input
          className="w-full p-0 bg-transparent border-b border-stone-200 focus:border-amber-600 outline-none transition-all font-bold text-stone-900 py-2"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    ) : (
      <p className="text-2xl font-black text-stone-900 tracking-tight leading-none pt-1">
        {value || (
          <span className="text-stone-200 font-normal italic">N/A</span>
        )}
      </p>
    )}
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center gap-6 text-amber-600">
    <Loader2 className="animate-spin" size={40} strokeWidth={1} />
    <p className="text-[10px] font-black uppercase tracking-[0.6em]">
      Synchronizing
    </p>
  </div>
);

export default ServiceRequestDetail;
