import * as z from 'zod';

export const addStockSchema = z.object({
  quantity: z.coerce
    .number()
    .min(1, 'Jumlah restock minimal 1 unit')
    .max(1000, 'Maksimal input restock 1000 unit per transaksi'),
});

export type AddStockFormValues = z.infer<typeof addStockSchema>;
