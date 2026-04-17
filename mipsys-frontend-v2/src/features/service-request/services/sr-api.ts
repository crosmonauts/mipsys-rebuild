import { apiClient } from "@/lib/api-client";
import { CreateServiceRequest } from "../types";

export const srApi = {
  getAll: async (search: string = "", page: number = 1, limit: number = 20) => {
    // Sesuaikan dengan route di backend tadi
    const response = await apiClient.get("/service-requests/dashboard", {
      params: { search, page, limit },
    });
    return response.data;
  },
};
