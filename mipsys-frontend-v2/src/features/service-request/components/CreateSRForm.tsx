'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import {
  Printer,
  User,
  Smartphone,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';

// --- IMPORT DARI STRUKTUR FEATURE (Anti-Defect) ---
import { serviceRequestSchema, type SRFormValues } from '../schemas/sr-schema';
import { srApi } from '../services/sr-api';

// Shadcn UI (Sesuaikan path jika berbeda)
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
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

export function CreateSRForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SRFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      address: '',
      modelName: '',
      serialNumber: '',
      problemDescription: '',
      serviceType: 'NON_WARRANTY',
      customerType: 'PERSONAL',
    },
  });

  // --- HANDLER SUBMIT (Simple Toast & DoD Standard) ---
  const onSubmit = async (data: SRFormValues) => {
    setIsLoading(true);
    try {
      const result = await srApi.create(data);

      // Menggunakan Simple Toast (String Only) sesuai permintaan sebelumnya
      toast.success(
        `Sukses! Tiket ${result.ticketNumber} untuk ${data.customerName} berhasil dibuat.`,
      );

      form.reset();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Gagal menyambung ke server';
      toast.error(
        `Gagal: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="max-w-4xl mx-auto my-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* HEADER PAGE - MIP SEMARANG Branding */}
      <header className="mb-10 text-left px-4">
        <h1 className="text-5xl font-display font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl" aria-hidden="true">
            <Printer className="text-white w-8 h-8" />
          </div>
          T-RECS Entry
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Pendaftaran Unit Epson Masuk •{' '}
          <span className="text-primary font-bold">MIP SEMARANG</span>
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 px-4 pb-28"
        >
          {/* SEKSI 01: PELANGGAN (WCAG Labeling) */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-blue-200">
            <div
              className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between"
              aria-hidden="true"
            >
               <div className="flex items-center gap-3">
                 <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                   01
                 </span>
                 <h2 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                   Informasi Pelanggan
                 </h2>
               </div>
               <div className="relative h-10 w-10">
                 <User size={18} className="absolute inset-0 flex items-center justify-center text-slate-300" />
               </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Nama Lengkap / Instansi
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white rounded-xl"
                          placeholder="Bpk. Nanda / Kantor Pajak"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        WhatsApp / Telepon
                      </FormLabel>
                       <FormControl>
                         <div className="relative h-10 w-10">
                           <Smartphone
                             size={16}
                             className="absolute inset-0 flex items-center justify-center text-slate-400"
                             aria-hidden="true"
                           />
                         </div>
                         <Input
                           className="h-12 pl-10 bg-slate-50/50 border-slate-200 rounded-xl"
                           placeholder="0812..."
                           {...field}
                         />
                       </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Alamat Lengkap
                    </FormLabel>
                       <FormControl>
                         <div className="relative h-10 w-10">
                           <MapPin
                             size={16}
                             className="absolute inset-0 flex items-center justify-center text-slate-400"
                             aria-hidden="true"
                           />
                         </div>
                         <Textarea
                           className="min-h-24 pl-10 bg-slate-50/50 border-slate-200 rounded-xl"
                           placeholder="Jl. Gajahmada No. XX, Semarang..."
                           {...field}
                         />
                       </FormControl>
                    <FormMessage className="text-xs font-bold" />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* SEKSI 02: PERANGKAT */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-orange-200">
             <div
               className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between"
               aria-hidden="true"
             >
               <div className="flex items-center gap-3">
                 <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                   02
                 </span>
                 <h2 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                   Detail Unit & Masalah
                 </h2>
               </div>
               <div className="relative h-10 w-10">
                 <AlertCircle size={18} className="absolute inset-0 flex items-center justify-center text-slate-300" />
               </div>
             </div>

            <div className="p-8 space-y-6">
              {/* Grid untuk Model dan Serial Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="modelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Model Mesin
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-slate-50/50 border-slate-200 rounded-xl uppercase font-bold"
                          placeholder="L3110"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Serial Number (S/N)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-slate-50/50 border-slate-200 rounded-xl uppercase font-mono"
                          placeholder="X7YZ..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Keluhan Pelanggan
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32 bg-slate-50/50 border-slate-200 rounded-xl italic"
                        placeholder="Contoh: Hasil print garis, mati total..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* SUBMIT BUTTON - DoD Focus Ring */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto h-14 px-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                SIMPAN TIKET
                <ChevronRight size={20} aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
