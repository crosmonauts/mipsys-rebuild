import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface UnitSpecsProps {
  modelName: string;
  serialNumber: string;
  statusService: string;
  serviceType: string;
  incomingDate?: string;
  isEditing: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function UnitSpecs({
  modelName,
  serialNumber,
  statusService,
  serviceType,
  incomingDate,
  isEditing,
  onSave,
  isSaving,
}: UnitSpecsProps) {
  return (
    <aside className="sticky top-10 space-y-10">
      <SpecCard
        statusService={statusService}
        serviceType={serviceType}
        incomingDate={incomingDate}
        modelName={modelName}
        serialNumber={serialNumber}
      />

      {isEditing && <SaveButton onClick={onSave} isSaving={isSaving} />}

      <FooterBadge />
    </aside>
  );
}

function SpecCard({
  statusService,
  serviceType,
  incomingDate,
  modelName,
  serialNumber,
}: {
  statusService: string;
  serviceType: string;
  incomingDate?: string;
  modelName: string;
  serialNumber: string;
}) {
  return (
    <div className="paper-card p-10 space-y-10">
      <StatusDisplay statusService={statusService} />

      <hr className="border-border/10" />

      <SpecDetails
        modelName={modelName}
        serialNumber={serialNumber}
        serviceType={serviceType}
        incomingDate={incomingDate}
      />
    </div>
  );
}

function StatusDisplay({ statusService }: { statusService: string }) {
  return (
    <div className="space-y-6">
      <p className="micro-label text-[var(--muted-foreground)]">
        Live Progress
      </p>
      <div className="flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
          <ShieldCheck size={28} strokeWidth={2} aria-hidden="true" />
        </div>
        <div>
          <p className="micro-label text-[var(--muted-foreground)] mb-1">
            Status
          </p>
          <p className="text-xl font-black text-[var(--primary)] uppercase tracking-tighter italic">
            {statusService?.replace('_', ' ') || 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SpecDetails({
  modelName,
  serialNumber,
  serviceType,
  incomingDate,
}: {
  modelName: string;
  serialNumber: string;
  serviceType: string;
  incomingDate?: string;
}) {
  return (
    <div className="space-y-8">
      <p className="micro-label text-[var(--muted-foreground)]">
        03. Unit Specification
      </p>
      <div className="space-y-6">
        <SpecRow label="Type" value={serviceType} />
        <SpecRow label="Model" value={modelName || '-'} />
        <SpecRow label="S/N" value={serialNumber || '-'} />
        {incomingDate && (
          <SpecRow label="Entry" value={incomingDate.split('T')[0]} />
        )}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-end border-b border-border/10 pb-4">
      <span className="micro-label text-[var(--muted-foreground)]">
        {label}
      </span>
      <span className="text-lg font-bold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function SaveButton({
  onClick,
  isSaving,
}: {
  onClick: () => void;
  isSaving: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={isSaving}
      className="w-full h-14 rounded-full text-[10px] font-black tracking-[0.3em]"
    >
      {isSaving ? 'Saving...' : 'CONFIRM CHANGES'}
    </Button>
  );
}

function FooterBadge() {
  return (
    <div className="px-10 flex items-center gap-3 text-[var(--muted-foreground)]">
      <Activity size={14} aria-hidden="true" />
      <p className="text-[9px] font-bold uppercase tracking-luxury">
        MIPSYS Enterprise AAA Standard
      </p>
    </div>
  );
}
