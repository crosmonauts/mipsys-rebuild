import { apiClient } from '@/src/lib/api-client';

export interface CompanyProfile {
  name: string;
  address: string;
  city: string | null;
  phone: string;
  email: string | null;
  npwp: string | null;
  isPkp: boolean;
  hasLogo: boolean;
  logoMime: string | null;
  logoSize: number | null;
  updatedAt: string | null;
  /** true bila masih memakai nilai bawaan, perlu diisi sebelum go-live. */
  isDefault: boolean;
}

export interface UpdateCompanyProfileInput {
  name: string;
  address: string;
  city?: string;
  phone: string;
  email?: string;
  npwp?: string;
  isPkp?: boolean;
}

export const companyProfileApi = {
  get: async (): Promise<CompanyProfile> => {
    const response = await apiClient.get<CompanyProfile>('/company-profile');
    return response.data;
  },

  update: async (input: UpdateCompanyProfileInput): Promise<CompanyProfile> => {
    const response = await apiClient.patch<CompanyProfile>(
      '/company-profile',
      input,
    );
    return response.data;
  },

  uploadLogo: async (file: File): Promise<CompanyProfile> => {
    const form = new FormData();
    form.append('logo', file);
    const response = await apiClient.post<CompanyProfile>(
      '/company-profile/logo',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  removeLogo: async (): Promise<CompanyProfile> => {
    const response = await apiClient.delete<CompanyProfile>(
      '/company-profile/logo',
    );
    return response.data;
  },

  /**
   * Logo dilayani endpoint ber-token, sehingga <img src> biasa tidak
   * cukup: berkas diambil lewat axios (header ikut terpasang) lalu
   * dikembalikan sebagai object URL.
   */
  fetchLogo: async (): Promise<string | null> => {
    const response = await apiClient.get<Blob>('/company-profile/logo', {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },
};
