// 1. Interface Utama (Untuk menampilkan data di Tabel/Dashboard)
export interface ServiceRequest {
  id: string; // Wajib ada dari backend (UUID)
  sr_number: string; // Hasil RMA dari Excel
  sp_number?: string | null;
  customer_name: string;
  customer_type?: string;
  service_action?: string;
  phone_number: string;
  email?: string | null;
  contact_person?: string | null;
  address_1: string; // Default: 'EASC SEMARANG'
  address_2?: string | null;
  address_3: string; // Default: 'Semarang'
  machine_model: string; // Hasil PRODUCT TYPE dari Excel
  serial_number: string; // Hasil SN dari Excel
  warranty_status: string;
  service_mode: string;
  ink_type?: string | null;
  accessories?: string | null;
  problem_desc: string; // Hasil gabungan SYMPTOM - PROBLEM
  
  // Status & Biaya (Penting untuk Fitur Teknisi/Kasir)
  status: string; // '0', '1', '2'
  technician_name?: string | null;
  tech_remarks?: string | null;
  labor_cost: number;
  part_cost: number;
  onsite_cost: number;
  other_cost: number;
  tax_amount: number;
  total_amount: number;
  
  created_at: string; // Format ISO Date dari Backend
  location_id: number;
}

// 2. Interface Khusus Create (Untuk Form Resepsionis Baru)
// Kita gunakan "Omit" untuk membuang field yang otomatis dibuat backend (id, sr_number, status)
export type CreateServiceRequest = Omit<
  ServiceRequest, 
  'id' | 'sr_number' | 'status' | 'created_at' | 'tax_amount' | 'total_amount' | 'sp_number'
>;