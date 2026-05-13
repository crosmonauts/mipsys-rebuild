import { apiClient } from "@/src/lib/api-clients";
import { ServiceRequest } from "@/src/types";

export const FinanceAPI = {
  /**
   * Menarik seluruh data tagihan dari sistem perbaikan
   */
  async getAllInvoices(): Promise<ServiceRequest[]> {
    const response = await apiClient.get<ServiceRequest[]>(
      "/api/service-requests",
    );
    return response.data;
  },
};
