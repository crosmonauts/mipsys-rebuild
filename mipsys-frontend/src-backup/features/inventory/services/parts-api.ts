import { apiClient } from "@/src/lib/api-clients";
import { SparePart } from "@/src/types";

export const SparePartAPI = {
  /**
   * Mengambil seluruh data master inventaris
   */
  async getAll(): Promise<SparePart[]> {
    // Menggunakan endpoint standar, sesuaikan dengan rute backend NestJS Anda
    const response = await apiClient.get<SparePart[]>("/api/spare-parts");
    return response.data;
  },
};
