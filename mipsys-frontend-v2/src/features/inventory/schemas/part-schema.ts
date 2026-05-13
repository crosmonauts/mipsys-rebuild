import * as z from 'zod';

export const stockActionSchema = z
  .object({
    type: z.enum(['ADD', 'SUBTRACT', 'RESET']),
    quantity: z.coerce.number().min(0, 'Jumlah tidak boleh negatif'),
  })
  .refine(
    (data) => {
      if (data.type !== 'RESET' && data.quantity <= 0) return false;
      return true;
    },
    {
      message: 'Jumlah harus lebih dari 0',
      path: ['quantity'],
    },
  );

export type StockActionValues = z.infer<typeof stockActionSchema>;
