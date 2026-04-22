'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Smartphone,
  MapPin,
  Printer,
  AlertCircle,
  BadgeDollarSign,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// UI Components (Shadcn/UI)
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

// Schema & API
import { serviceRequestSchema, type SRFormValues } from '../schemas/sr-schema';
import { srApi } from '../services/sr-api';

export function CreateSRForm() {
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. INISIALISASI FORM & LOGIKA ---
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
      serviceFee: 0,
      customerType: 'PERSONAL',
    },
  });

  // Watch biaya untuk update total estimasi secara real-time
  const sFee = form.watch('serviceFee');
  const totalEstimasi = Number(sFee) || 0;

  // --- 2. HANDLER SUBMIT ---
  const onSubmit = async (data: SRFormValues) => {
    setIsLoading(true);
    try {
      const result = await srApi.create(data);
      alert(
        `Sukses! Tiket ${result.ticketNumber} untuk ${data.customerName} berhasil dibuat.`,
      );
      form.reset();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Gagal menyambung ke server';
      alert(
        'Gagal: ' + (Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. TAMPILAN (UI) ---
  return (
    <div className="max-w-4xl mx-auto my-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER PAGE */}
      <div className="mb-8 text-left px-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Printer className="text-white w-8 h-8" />
          </div>
          T-RECS Entry
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          Pendaftaran Unit Epson Masuk •{' '}
          <span className="text-blue-600 font-black">MIP SEMARANG</span>
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 px-4 pb-28"
        >
          {/* SEKSI 01: PELANGGAN */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-blue-200">
            <div className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[12px] font-black text-white">
                  01
                </span>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Informasi Pelanggan
                </h3>
              </div>
              <User size={18} className="text-slate-300" />
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Nama Lengkap / Instansi
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                          placeholder="Contoh: Bpk. Nanda / Kantor Pajak"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        WhatsApp / Telepon
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Smartphone
                            size={16}
                            className="absolute left-4 top-4 text-slate-400"
                          />
                          <Input
                            className="h-12 pl-10 bg-slate-50/50 border-slate-200 rounded-xl"
                            placeholder="0812..."
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
                      Alamat Penjemputan / Unit
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin
                          size={16}
                          className="absolute left-4 top-4 text-slate-400"
                        />
                        <Textarea
                          className="min-h-24 pl-10 bg-slate-50/50 border-slate-200 rounded-xl"
                          placeholder="Jl. Gajahmada No. XX, Semarang..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* SEKSI 02: PERANGKAT */}
          <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-orange-200">
            <div className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-[12px] font-black text-white">
                  02
                </span>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Detail Perangkat & Masalah
                </h3>
              </div>
              <AlertCircle size={18} className="text-slate-300" />
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="modelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
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
                      <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Status Garansi
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-bold">
                            <SelectValue placeholder="Pilih Tipe Servis" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            value="WARRANTY"
                            className="font-bold text-green-600"
                          >
                            WARRANTY (Resmi)
                          </SelectItem>
                          <SelectItem
                            value="NON_WARRANTY"
                            className="font-bold text-blue-600"
                          >
                            NON-WARRANTY (Berbayar)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Kategori Pelanggan
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PERSONAL">Personal</SelectItem>
                          <SelectItem value="CORPORATE">Corporate</SelectItem>
                          <SelectItem value="CONTRACT">
                            Maintenance Contract
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black text-slate-500 uppercase tracking-widest">
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

          {/* SECTION 03: FINANCIAL (FLOATING FOOTER) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl bg-slate-900 p-4 md:p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 z-50">
            <div className="flex gap-4 items-center">
              <div className="hidden md:flex p-3 bg-blue-600/20 rounded-2xl">
                <BadgeDollarSign className="text-blue-500 w-8 h-8" />
              </div>
              <div className="flex gap-4 border-r border-slate-700 pr-6 mr-2">
                <FormField
                  control={form.control}
                  name="serviceFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Biaya Service
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="w-24 md:w-32 bg-slate-800 border-none text-white h-10 font-bold"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Total Estimasi Awal
                </p>
                <h4 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                  <span className="text-blue-500 mr-1">Rp</span>
                  {totalEstimasi.toLocaleString('id-ID')}
                </h4>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  SIMPAN TIKET
                  <ChevronRight size={20} />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
