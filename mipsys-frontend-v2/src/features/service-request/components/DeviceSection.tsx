import React from 'react';
import { AlertCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { UseFormReturn } from 'react-hook-form';

interface DeviceSectionProps {
  form: UseFormReturn<any>;
}

export function DeviceSection({ form }: DeviceSectionProps) {
  return (
    <section className="bg-[var(--card)] border border-border/20 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-primary/30">
      <SectionHeader
        number="02"
        title="Detail Unit & Masalah"
        icon={        <AlertCircle size={18} className="text-[var(--muted-foreground)]" />}
      />

      <div className="p-8 space-y-6">
        <ModelSerialGrid form={form} />
        <ProblemField form={form} />
        <TypeSelectors form={form} />
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

function ModelSerialGrid({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ModelField form={form} />
      <SerialField form={form} />
    </div>
  );
}

function ModelField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="modelName"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Model Mesin
          </FormLabel>
          <FormControl>
            <Input
              className="h-12 bg-[var(--card)] border-border/30 rounded-xl uppercase font-bold"
              placeholder="L3110"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SerialField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="serialNumber"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Serial Number (S/N)
          </FormLabel>
          <FormControl>
            <Input
              className="h-12 bg-[var(--card)] border-border/30 rounded-xl uppercase font-mono"
              placeholder="X7YZ..."
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ProblemField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="problemDescription"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Keluhan Pelanggan
          </FormLabel>
          <FormControl>
            <Textarea
              className="min-h-32 bg-[var(--card)] border-border/30 rounded-xl italic"
              placeholder="Contoh: Hasil print garis, mati total..."
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TypeSelectors({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ServiceTypeField form={form} />
      <CustomerTypeField form={form} />
    </div>
  );
}

function ServiceTypeField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="serviceType"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Tipe Service
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="h-12 bg-[var(--card)] border-border/30 rounded-xl">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="WARRANTY">Warranty</SelectItem>
              <SelectItem value="NON_WARRANTY">Non-Warranty</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CustomerTypeField({ form }: { form: UseFormReturn<any> }) {
  return (
    <FormField
      control={form.control}
      name="customerType"
      render={({ field }) => (
        <FormItem>
            <FormLabel className="micro-label text-[var(--muted-foreground)]">
            Tipe Pelanggan
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="h-12 bg-[var(--card)] border-border/30 rounded-xl">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="PERSONAL">Personal</SelectItem>
              <SelectItem value="CORPORATE">Corporate</SelectItem>
              <SelectItem value="INTERNAL">Internal</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
