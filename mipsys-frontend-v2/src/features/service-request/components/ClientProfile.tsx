'use client';

import React from 'react';
import { User, Smartphone, MapPin } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';

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
          icon={<User size={14} aria-hidden="true" />}
          isEditing={isEditing}
          onChange={(v) => onChange('customerName', v)}
        />
        <EditableField
          label="WhatsApp"
          value={phone}
          icon={<Smartphone size={14} aria-hidden="true" />}
          isEditing={isEditing}
          onChange={(v) => onChange('phone', v)}
        />
        <div className="md:col-span-2">
          <EditableField
            label="Service Address"
            value={address}
            icon={<MapPin size={14} aria-hidden="true" />}
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
    <h2 className="micro-label text-[var(--primary)] flex items-center gap-6">
      {number}. {label}{' '}
      <span className="h-[1px] flex-1 bg-[var(--border)]/20"></span>
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
      <label className="micro-label text-[var(--muted-foreground)] flex items-center gap-2">
        {icon} {label}
      </label>
      {isEditing ? (
        isTextarea ? (
          <Textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="border-0 border-b border-border/30 rounded-none px-0 focus-visible:border-primary min-h-[80px] resize-none font-bold"
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="border-0 border-b border-border/30 rounded-none px-0 focus-visible:border-primary font-bold"
          />
        )
      ) : (
        <p className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-none pt-1">
          {value || (
            <span className="text-[var(--muted-foreground)]/40 font-normal italic">N/A</span>
          )}
        </p>
      )}
    </div>
  );
}
