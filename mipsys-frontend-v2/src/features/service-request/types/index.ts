export type ServiceStatus = 'PENDING' | 'PROSES' | 'SELESAI' | 'BATAL' | 'AWAITING_PARTS';
export type CustomerType = 'PERSONAL' | 'CORPORATE' | 'CONTRACT';
export type ServiceType = 'WARRANTY' | 'NON_WARRANTY';

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  customerName: string;
  phone: string;
  address: string;
  customerPhone?: string;
  customerAddress?: string;
  modelName: string;
  serialNumber: string;
  problemDescription: string;
  serviceType: ServiceType;
  customerType: CustomerType;
  statusService: ServiceStatus;
  statusSystem?: string;
  incomingDate?: string;
  serviceFee?: string;
  partFee?: string;
  remarksHistory?: string;
  parts?: Array<{ partName: string; quantity: number; unitPrice: string }>;
  createdAt: string;
  updatedAt: string;
}

// Untuk keperluan update (Partial agar tidak wajib semua field)
export type UpdateSRPayload = Partial<
  Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt'>
>;
