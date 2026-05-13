import { apiClient } from "@/src/lib/api-clients";
import { PurchaseOrder } from "@/src/types";
export const PurchaseOrderAPI = {
  /**
   * Menarik data pesanan pembelian dari backend
   */
  async getAll(): Promise<PurchaseOrder[]> {
    const response = await apiClient.get<PurchaseOrder[]>(
      "/api/purchase-orders",
    );
    return response.data;
  },
};
