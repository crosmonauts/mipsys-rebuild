export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  date: string;
  amount: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  method: string;
}
