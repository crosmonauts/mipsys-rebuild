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
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all text-[10px] font-bold uppercase tracking-[0.4em]"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to Dashboard
      </button>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <TypeBadge serviceType={serviceType} />
          <EntryDate incomingDate={incomingDate} />
        </div>
        <h1 className="text-6xl md:text-4xl font-black text-[var(--foreground)] tracking-tighter leading-none">
          {ticketNumber}
        </h1>
      </div>
    </div>
  );
}

function TypeBadge({ serviceType }: { serviceType: string }) {
  return (
    <span className="px-2 py-0.5 bg-[var(--primary)]/15 text-[var(--primary)] text-[9px] font-black rounded uppercase tracking-widest">
      {serviceType || 'NON_WARRANTY'}
    </span>
  );
}

function EntryDate({ incomingDate }: { incomingDate?: string }) {
  if (!incomingDate) return null;

  return (
    <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">
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
        icon={<ClipboardCheck size={16} aria-hidden="true" />}
        label="DIAGNOSIS"
        color="blue"
        onClick={onDiagnosis}
      />
      <ActionButton
        icon={<CreditCard size={16} aria-hidden="true" />}
        label="PAYMENT"
        color="emerald"
        onClick={onPayment}
      />
      <ActionButton
        icon={<PrinterIcon size={16} aria-hidden="true" />}
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
    blue: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90',
    emerald: 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90',
    slate: 'bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)]/20 border border-border/30',
  };

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-6 py-4 rounded-full text-xs font-black tracking-widest ${colorClasses[color]} shadow-lg`}
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
          ? 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
          : 'bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--primary)]/20 border border-border/30 shadow-lg'
      }`}
    >
      {isEditing ? <X size={16} aria-hidden="true" /> : <Edit3 size={16} aria-hidden="true" />}
      {isEditing ? 'CANCEL' : 'EDIT'}
    </button>
  );
}
