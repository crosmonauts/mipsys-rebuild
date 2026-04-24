export interface ServiceRequest {
  id: number;
  ticketNumber: string;

  // IDENTITAS (Hasil Join)
  customerName: string;
  customerPhone: string;
  customerAddress: string;

  // PERANGKAT (Hasil Join)
  modelName: string;
  serialNumber: string;
  serviceType: 'WARRANTY' | 'NON_WARRANTY';
  statusService:
    | 'WAITING CHECK'
    | 'PENDING CHECK'
    | 'PENDING APPROVAL'
    | 'PENDING PART'
    | 'SERVICE'
    | 'DONE'
    | 'CANCEL';

  statusSystem: 'OPEN' | 'CLOSED';
  parts: UpdateDiagnosisPayload['parts'] | null;

  // DESKRIPSI & TANGGAL
  problemDescription: string;
  remarksHistory: string;
  incomingDate: string;
  createdAt: string;

  // ID STAFF
  technicianCheckId?: number | null;
  technicianFixId?: number | null;

  // FINANSIAL (Pisahkan sesuai kebutuhan bisnis)
  partFee: string;
  serviceFee: string;
}

export interface UpdateDiagnosisPayload {
  ticketNumber: string;
  technicianFixId: number;
  remarksHistory: string;
  statusService: ServiceRequest['statusService'];
  parts: {
    partName: string;
    quantity: number;
    unitPrice: number;
  }[];
}
