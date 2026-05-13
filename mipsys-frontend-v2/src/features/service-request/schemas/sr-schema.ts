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
  problemDescription: z.string().min(1, 'Keluhan wajib diisi'),
  serviceFee: z.coerce.number().default(0),
});

// ==========================================
// 2. SCHEMA UNTUK PART ITEM (AUTO-REGISTRATION)
// ==========================================
export const partItemSchema = z
  .object({
    sparePartId: z.number().nullable().optional(),
    refNo: z.string().optional().default(''),
    partName: z.string().min(1, 'Nama barang wajib diisi'),
    quantity: z.coerce.number().min(1, 'Minimal 1 unit'),
    unitPrice: z.coerce.number().min(0, 'Harga wajib diisi'),

    // Transform string kosong atau null/undefined menjadi 'N/A' secara otomatis
    partCode: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val : 'N/A')),

    modelName: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val?.trim() ? val : 'N/A')),

    block: z.string().optional().default(''),
    ipStatus: z.enum(['IP', 'Non IP']).default('Non IP'),
  })
  .superRefine((data, ctx) => {
    // Validasi tambahan hanya jika barang baru tanpa ID terdaftar
    if (!data.sparePartId && data.partName) {
      // Jika modelName masih bernilai 'N/A' dan ingin divalidasi ketat:
      if (data.modelName === 'N/A') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Model Name wajib diisi untuk barang baru',
          path: ['modelName'],
        });
      }
    }
  });

// ==========================================
// 3. SCHEMA UNTUK UPDATE DIAGNOSIS
// ==========================================
export const updateDiagnosisSchema = z.object({
  technicianCheckId: z.number().min(1, 'Pilih teknisi'),
  remarksHistory: z.string().min(5, 'Berikan diagnosa yang jelas'),
  statusService: z.string(),
  serviceFee: z.coerce.number().default(0),
  parts: z.array(partItemSchema).default([]),
});

export type SRFormValues = z.infer<typeof serviceRequestSchema>;
export type UpdateDiagnosisValues = z.infer<typeof updateDiagnosisSchema>;
