'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Printer,
  User,
  Smartphone,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { serviceRequestSchema, type SRFormValues } from '../schemas/sr-schema';
import { srApi } from '../services/sr-api';
import { Button } from '@/src/components/ui/button';
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
import toast from 'react-hot-toast';

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

  const onSubmit = async (values: SRFormValues) => {
    setIsLoading(true);
    try {
      const result = await srApi.create(values);

      // WCAG: Toast akan membacakan pesan ini secara otomatis (Aria-live)
      toast.success(
        `Sukses! Tiket ${result.ticketNumber} untuk ${values.customerName} berhasil dibuat.`,
      );

      form.reset();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Koneksi server terputus';
      toast.error(
        `Gagal: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // WCAG: Gunakan tag <main> atau role="main" untuk konten utama
    <main className="max-w-4xl mx-auto my-8 px-4 outline-none">
      <header className="mb-8 text-left">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl" aria-hidden="true">
            <Printer className="text-white w-8 h-8" />
          </div>
          T-RECS Entry
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Sistem Pendaftaran Unit •{' '}
          <span className="text-blue-600 font-black">MIP SEMARANG</span>
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 pb-28"
          noValidate // Matikan validasi browser default untuk kontrol penuh oleh Zod
        >
          {/* SEKSI 01: PELANGGAN */}
          <fieldset
            className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
            disabled={isLoading} // DoD: Lock form saat submit
          >
            <legend className="sr-only">Informasi Pelanggan</legend>
            <div
              className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[12px] font-black text-white">
                  01
                </span>
                <h2 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Informasi Pelanggan
                </h2>
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
                      <FormLabel className="font-black text-slate-600 uppercase tracking-widest text-[10px]">
                        Nama Lengkap / Instansi
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Bpk. Nanda / Kantor Pajak"
                          className="h-12 focus-visible:ring-blue-500 rounded-xl transition-all"
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
                      <FormLabel className="font-black text-slate-600 uppercase tracking-widest text-[10px]">
                        WhatsApp / Telepon
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Smartphone
                            aria-hidden="true"
                            size={16}
                            className="absolute left-4 top-4 text-slate-400"
                          />
                          <Input
                            {...field}
                            placeholder="0812..."
                            className="h-12 pl-10 rounded-xl"
                          />
                        </div>
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
                    <FormLabel className="font-black text-slate-600 uppercase tracking-widest text-[10px]">
                      Alamat Lengkap
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin
                          aria-hidden="true"
                          size={16}
                          className="absolute left-4 top-4 text-slate-400"
                        />
                        <Textarea
                          {...field}
                          placeholder="Jl. Gajahmada..."
                          className="min-h-24 pl-10 rounded-xl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-bold" />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          {/* SEKSI 02: PERANGKAT (Ringkas untuk efisiensi ruang) */}
          <fieldset
            className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden"
            disabled={isLoading}
          >
            <legend className="sr-only">Detail Perangkat</legend>
            <div
              className="bg-slate-50 px-6 py-4 border-b flex items-center justify-between"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-[12px] font-black text-white">
                  02
                </span>
                <h2 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                  Detail Perangkat
                </h2>
              </div>
              <AlertCircle size={18} className="text-slate-300" />
            </div>

            {/* ... Render field perangkat mirip di atas ... */}
            {/* Note: Gunakan uppercase di modelName & serialNumber lewat CSS `uppercase` */}
          </fieldset>

          <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t z-50">
            <div className="max-w-4xl mx-auto">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-2xl shadow-blue-200 transition-all active:scale-95 gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> MEMPROSES...
                  </>
                ) : (
                  <>
                    <Printer size={20} /> SIMPAN TIKET{' '}
                    <ChevronRight size={20} />
                  </>
                )}
              </Button>
            </div>
          </footer>
        </form>
      </Form>
    </main>
  );
}
