"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { srApi } from "../services/sr-api";
import { useState } from "react";

// 1. KONTRAK VALIDASI ZOD (Sudah Diperbaiki 100%)
const srFormSchema = z.object({
  // WAJIB
  customer_name: z.string().min(1, "Nama Pelanggan wajib diisi"),
  phone_number: z.string().min(1, "Nomor Telepon wajib diisi"),
  address_1: z.string().min(1, "Alamat Utama wajib diisi"),
  address_3: z.string().min(1, "Kota/Kecamatan wajib diisi"),
  machine_model: z.string().min(1, "Model Mesin wajib diisi"),
  problem_desc: z.string().min(1, "Deskripsi Masalah wajib diisi"),
  warranty_status: z.string().min(1, "Status Garansi wajib diisi"),
  service_mode: z.string().min(1, "Mode Servis wajib diisi"),

  // OPSIONAL
  customer_type: z.string().optional(),
  service_action: z.string().optional(),
  contact_person: z.string().optional(),
  address_2: z.string().optional(),
  email: z.string().email("Format email salah").optional().or(z.literal("")),
  serial_number: z.string().optional(),
  ink_type: z.string().optional(),
  accessories: z.string().optional(),

  // DIPERBAIKI: Tanpa .optional() karena default(0) sudah menutupi nilai kosong
  onsite_cost: z.coerce.number().default(0),
  other_cost: z.coerce.number().default(0),
});

type SRFormValues = z.infer<typeof srFormSchema>;

export function CreateSRForm() {
  // 2. INISIALISASI FORM STATE
  const form = useForm<SRFormValues>({
    resolver: zodResolver(srFormSchema),
    defaultValues: {
      customer_name: "",
      phone_number: "",
      address_1: "",
      address_3: "",
      machine_model: "",
      problem_desc: "",
      warranty_status: "",
      service_mode: "",
      customer_type: "",
      service_action: "",
      contact_person: "",
      address_2: "",
      email: "",
      serial_number: "",
      ink_type: "",
      accessories: "",
      onsite_cost: 0,
      other_cost: 0,
    },
  });

  // 1. Pantau perubahan biaya secara real-time
  const onsite = form.watch("onsite_cost");
  const other = form.watch("other_cost");

  // 2. Kalkulasi Total (Bisa ditampilkan di UI nantinya)
  const totalEstimasi = (Number(onsite) || 0) + (Number(other) || 0);

  // FORMAT RUPIAH HELPER
  const toRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  <div className="p-4 bg-muted/50 rounded-lg border border-dashed mb-4">
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">Total Estimasi Awal:</span>
      <span className="font-bold text-lg text-primary">{toRupiah(totalEstimasi)}</span>
    </div>
  </div>;

  // 3. LOGIKA SUBMIT
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(data: SRFormValues) {
    setIsLoading(true); // Mulai loading
    try {
      const result = await srApi.create(data);
      console.log("Berhasil disimpan ke Backend:", result);
      alert("Service Request Berhasil Dibuat!");
      form.reset(); // Bersihkan form setelah sukses
    } catch (error: any) {
      console.error("Gagal mengirim data:", error);
      alert("Gagal: " + (error.response?.data?.message || "Terjadi kesalahan koneksi"));
    } finally {
      setIsLoading(false); // Selesai loading
    }
  }

  return (
    <div className="p-6 bg-card border rounded-lg shadow-sm w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Buat Service Request Baru</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informasi Pelanggan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pelanggan *</FormLabel>
                    <FormControl>
                      <Input placeholder="PT Maju Jaya / Budi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor Telepon *</FormLabel>
                    <FormControl>
                      <Input placeholder="0812..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@contoh.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama Perwakilan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Detail Alamat</h3>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="address_1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Utama (Jalan/Gedung) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jl. Sudirman No. 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address_3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kota & Kode Pos *</FormLabel>
                      <FormControl>
                        <Input placeholder="Semarang 50192" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detail Tambahan (RT/RW)</FormLabel>
                      <FormControl>
                        <Input placeholder="Blok C, Lantai 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informasi Teknis Mesin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="machine_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Mesin *</FormLabel>
                    <FormControl>
                      <Input placeholder="Epson L3110" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="SN-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warranty_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Garansi *</FormLabel>
                    <FormControl>
                      <Input placeholder="In Warranty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="service_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode Servis *</FormLabel>
                    <FormControl>
                      <Input placeholder="Onsite / Carry In" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="problem_desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Masalah *</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Jelaskan detail kerusakan..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Estimasi Biaya Awal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="onsite_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biaya Onsite Kunjungan (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="other_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biaya Lain-lain (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="w-full md:w-auto px-8">
              Simpan Service Request
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
