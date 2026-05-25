import * as z from 'zod';

// ==========================================
// 1. SCHEMA UNTUK ENTRY (INPUT AWAL)
// ==========================================
export const serviceRequestSchema = z.object({
  customerName: z.string().min(1, 'Nama pelanggan wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  modelName: z.string().min(1, 'Model mesin wajib diisi'),
  serialNumber: z.string().min(1, 'Serial Number wajib diisi'),
  serviceType: z.enum(['WARRANTY', 'NON_WARRANTY']),
  customerType: z.enum(['PERSONAL', 'CORPORATE', 'INTERNAL']),
  problemDescription: z.string().min(1, 'Keluhan wajib diisi'),
});

export type SRFormValues = z.infer<typeof serviceRequestSchema>;
