import React from 'react';
import { ShieldCheck } from 'lucide-react';

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

      {isEditing && (
        <SaveButton onClick={onSave} isSaving={isSaving} />
      )}

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
    <div className="p-10 bg-white border border-stone-100 rounded-[3rem] shadow-sm space-y-10">
      <StatusDisplay statusService={statusService} />

      <hr className="border-stone-50" />

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
      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
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
    <div className="flex justify-between items-end border-b border-stone-50 pb-4">
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-lg font-black text-stone-900">{value}</span>
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
    <button
      onClick={onClick}
      disabled={isSaving}
      className="w-full py-5 bg-amber-600 text-white rounded-full font-black text-[10px] tracking-[0.3em] hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 disabled:opacity-50"
    >
      {isSaving ? 'Saving...' : 'CONFIRM CHANGES'}
    </button>
  );
}

function FooterBadge() {
  return (
    <div className="px-10 flex items-center gap-3 text-stone-300">
      <ActivityIcon />
      <p className="text-[9px] font-bold uppercase tracking-luxury">
        MIPSYS Enterprise AAA Standard
      </p>
    </div>
  );
}

function ActivityIcon() {
  const { Activity } = require('lucide-react');
  return <Activity size={14} />;
}
