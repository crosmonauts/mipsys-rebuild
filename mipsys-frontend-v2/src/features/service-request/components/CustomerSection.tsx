import React from 'react';
import { User, Smartphone, MapPin } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';

interface CustomerSectionProps {
  form: UseFormReturn<any>;
}

export function CustomerSection({ form }: CustomerSectionProps) {
  return (
    <section className="bg-[var(--card)] border border-border/20 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-primary/30">
      <SectionHeader
        number="01"
        title="Informasi Pelanggan"
        icon={        <User size={18} className="text-[var(--muted-foreground)]" />}
      />

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NameField form={form} />
          <PhoneField form={form} />
        </div>
        <AddressField form={form} />
      </div>
    </section>
  );
}

function SectionHeader({
  number,
  title,
  icon,
}: {
  number: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="bg-[var(--muted)]/50 px-6 py-4 border-b border-border/20 flex items-center justify-between"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
          {number}
        </span>
        <h2 className="text-[var(--foreground)] uppercase tracking-wider text-xs font-bold">
          {title}
        </h2>
      </div>
      {icon}
    </div>
  );
}

function NameField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="customerName"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Nama Lengkap / Instansi
          </FormLabel>
          <FormControl>
            <Input
              className="h-12 bg-[var(--card)] border-border/30 focus:bg-[var(--card)] rounded-xl"
              placeholder="Bpk. Nanda / Kantor Pajak"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-xs font-bold" />
        </FormItem>
      )}
    />
  );
}

function PhoneField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            WhatsApp / Telepon
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Smartphone
                size={16}
                className="absolute left-4 top-4 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <Input
                className="h-12 pl-10 bg-[var(--card)] border-border/30 rounded-xl"
                placeholder="0812..."
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage className="text-xs font-bold" />
        </FormItem>
      )}
    />
  );
}

function AddressField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Alamat Lengkap
          </FormLabel>
          <FormControl>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-4 top-4 text-[var(--muted-foreground)]"
                aria-hidden="true"
              />
              <Textarea
                className="min-h-24 pl-10 bg-[var(--card)] border-border/30 rounded-xl"
                placeholder="Jl. Gajahmada No. XX, Semarang..."
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage className="text-xs font-bold" />
        </FormItem>
      )}
    />
  );
}
