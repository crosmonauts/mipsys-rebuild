export type ServiceStatus = 'PENDING' | 'PROSES' | 'SELESAI' | 'BATAL';
export type CustomerType = 'PERSONAL' | 'CORPORATE' | 'CONTRACT';
export type ServiceType = 'WARRANTY' | 'NON_WARRANTY';

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  customerName: string;
  phone: string;
  address: string;
  modelName: string;
  serialNumber: string;
  problemDescription: string;
  serviceType: ServiceType;
  customerType: CustomerType;
  statusService: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

// Untuk keperluan update (Partial agar tidak wajib semua field)
export type UpdateSRPayload = Partial<
  Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt'>
>;
