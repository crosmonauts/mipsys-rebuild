import React from 'react';
import {
  ArrowLeft,
  Edit3,
  X,
  ClipboardCheck,
  CreditCard,
  Printer as PrinterIcon,
} from 'lucide-react';

interface DetailHeaderProps {
  ticketNumber: string;
  serviceType: string;
  incomingDate?: string;
  isEditing: boolean;
  onBack: () => void;
  onEditToggle: () => void;
  onDiagnosis: () => void;
  onPayment: () => void;
  onPrint: () => void;
}

export function DetailHeader({
  ticketNumber,
  serviceType,
  incomingDate,
  isEditing,
  onBack,
  onEditToggle,
  onDiagnosis,
  onPayment,
  onPrint,
}: DetailHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-10">
      <TicketInfo
        ticketNumber={ticketNumber}
        serviceType={serviceType}
        incomingDate={incomingDate}
        onBack={onBack}
      />

      <ActionButtons
        isEditing={isEditing}
        onEditToggle={onEditToggle}
        onDiagnosis={onDiagnosis}
        onPayment={onPayment}
        onPrint={onPrint}
      />
    </header>
  );
}

function TicketInfo({
  ticketNumber,
  serviceType,
  incomingDate,
  onBack,
}: {
  ticketNumber: string;
  serviceType: string;
  incomingDate?: string;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-400 hover:text-amber-700 transition-all text-[10px] font-bold uppercase tracking-[0.4em]"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </button>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <TypeBadge serviceType={serviceType} />
          <EntryDate incomingDate={incomingDate} />
        </div>
        <h1 className="text-6xl md:text-4xl font-black text-stone-900 tracking-tighter leading-none">
          {ticketNumber}
        </h1>
      </div>
    </div>
  );
}

function TypeBadge({ serviceType }: { serviceType: string }) {
  return (
    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase tracking-widest">
      {serviceType || 'NON_WARRANTY'}
    </span>
  );
}

function EntryDate({ incomingDate }: { incomingDate?: string }) {
  if (!incomingDate) return null;

  return (
    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
      ENTRY: {incomingDate.split('T')[0]}
    </span>
  );
}

function ActionButtons({
  isEditing,
  onEditToggle,
  onDiagnosis,
  onPayment,
  onPrint,
}: {
  isEditing: boolean;
  onEditToggle: () => void;
  onDiagnosis: () => void;
  onPayment: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="flex gap-3">
      <ActionButton
        icon={<ClipboardCheck size={16} />}
        label="DIAGNOSIS"
        color="blue"
        onClick={onDiagnosis}
      />
      <ActionButton
        icon={<CreditCard size={16} />}
        label="PAYMENT"
        color="emerald"
        onClick={onPayment}
      />
      <ActionButton
        icon={<PrinterIcon size={16} />}
        label="PRINT"
        color="slate"
        onClick={onPrint}
      />
      <EditToggle isEditing={isEditing} onClick={onEditToggle} />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'emerald' | 'slate';
  onClick: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
    slate: 'bg-slate-700 hover:bg-slate-800 shadow-slate-100',
  };

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-6 py-4 rounded-full text-xs font-black tracking-widest text-white ${colorClasses[color]} shadow-xl`}
    >
      {icon} {label}
    </button>
  );
}

function EditToggle({
  isEditing,
  onClick,
}: {
  isEditing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-6 py-4 rounded-full text-xs font-black tracking-widest transition-all ${
        isEditing
          ? 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          : 'bg-stone-900 text-stone-50 hover:bg-amber-600 shadow-xl shadow-amber-100'
      }`}
    >
      {isEditing ? <X size={16} /> : <Edit3 size={16} />}
      {isEditing ? 'CANCEL' : 'EDIT'}
    </button>
  );
}
