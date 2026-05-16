'use client';

import React from 'react';
import { User, Smartphone, MapPin } from 'lucide-react';

interface ClientProfileProps {
  customerName: string;
  phone: string;
  address: string;
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
}

export function ClientProfile({
  customerName,
  phone,
  address,
  isEditing,
  onChange,
}: ClientProfileProps) {
  return (
    <section className="space-y-8">
      <SectionHeader label="Client Profile" number="01" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
        <EditableField
          label="Full Name"
          value={customerName}
          icon={<User size={14} />}
          isEditing={isEditing}
          onChange={(v) => onChange('customerName', v)}
        />
        <EditableField
          label="WhatsApp"
          value={phone}
          icon={<Smartphone size={14} />}
          isEditing={isEditing}
          onChange={(v) => onChange('phone', v)}
        />
        <div className="md:col-span-2">
          <EditableField
            label="Service Address"
            value={address}
            icon={<MapPin size={14} />}
            isEditing={isEditing}
            isTextarea
            onChange={(v) => onChange('address', v)}
          />
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ label, number }: { label: string; number: string }) {
  return (
    <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.5em] flex items-center gap-6">
      {number}. {label}{' '}
      <span className="h-[1px] flex-1 bg-stone-100"></span>
    </h2>
  );
}

function EditableField({
  label,
  value,
  icon,
  isEditing,
  isTextarea,
  onChange,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  isEditing: boolean;
  isTextarea?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="group space-y-3">
      <label className="text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] flex items-center gap-2">
        {icon} {label}
      </label>
      {isEditing ? (
        isTextarea ? (
          <Textarea value={value} onChange={onChange} />
        ) : (
          <TextInput value={value} onChange={onChange} />
        )
      ) : (
        <DisplayValue value={value} />
      )}
    </div>
  );
}

function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <input
      className="w-full p-0 bg-transparent border-b border-stone-200 focus:border-amber-600 outline-none transition-all font-bold text-stone-900 py-2"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

function Textarea({
  value,
  onChange,
}: {
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <textarea
      className="w-full p-0 bg-transparent border-b border-stone-200 focus:border-amber-600 outline-none transition-all font-bold text-stone-900 py-2 min-h-[80px] resize-none"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}

function DisplayValue({ value }: { value: string }) {
  return (
    <p className="text-2xl font-black text-stone-900 tracking-tight leading-none pt-1">
      {value || (
        <span className="text-stone-200 font-normal italic">N/A</span>
      )}
    </p>
  );
}
