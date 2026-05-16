export interface Invoice {
  id: number;
  invoiceNumber: string;
  ticketNumber: string;
  clientName: string;
  serviceFee: string;
  partFee: string;
  shippingFee: string;
  ppn: string;
  total: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  paymentMethod?: string;
  invoiceDate: string;
  paidDate?: string;
}
