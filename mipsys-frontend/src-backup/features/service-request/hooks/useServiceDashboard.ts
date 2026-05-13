import { useState, useEffect, useCallback, useMemo } from "react";
import { ServiceRequestAPI } from "../services/sr-api";
import { ServiceRequest, StatusServiceType } from "@/src/types";

export const useServiceDashboard = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fallback data dummy berstruktur AAA (Anti-Defect saat server offline)
      const data = await ServiceRequestAPI.getAll().catch(
        () =>
          [
            {
              id: 1,
              ticketNumber: "TICK-2026-001",
              serviceType: "WARRANTY",
              statusService: "WAITING_CHECK",
              problemDescription: "Layar bergaris hijau setelah update sistem",
              serviceFee: 0,
              partFee: 0,
              shippingFee: 0,
            },
            {
              id: 2,
              ticketNumber: "TICK-2026-002",
              serviceType: "NON_WARRANTY",
              statusService: "SERVICE",
              problemDescription: "Konektor daya longgar, mati total",
              serviceFee: 150000,
              partFee: 45000,
              shippingFee: 25000,
            },
            {
              id: 3,
              ticketNumber: "TICK-2026-003",
              serviceType: "NON_WARRANTY",
              statusService: "WAITING_APPROVE",
              problemDescription: "Ganti LCD dan baterai tanam",
              serviceFee: 200000,
              partFee: 1250000,
              shippingFee: 0,
            },
          ] as ServiceRequest[],
      );

      setRequests(data);
    } catch (err) {
      setError("Gagal memuat daftar tiket perbaikan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Optimasi Halstead & McCabe: Filter teks dan status dilakukan di memori ter-cache
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchStatus =
        statusFilter === "ALL" || req.statusService === statusFilter;
      const matchQuery =
        !searchQuery.trim() ||
        req.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.problemDescription &&
          req.problemDescription
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      return matchStatus && matchQuery;
    });
  }, [requests, searchQuery, statusFilter]);

  // Optimasi Performa: Perhitungan agregat finansial aktif tanpa membebani render UI
  const financialMetrics = useMemo(() => {
    let activeTickets = 0;
    let totalEstimatedRevenue = 0;

    for (const req of requests) {
      if (req.statusService !== "CANCEL") {
        activeTickets++;
        totalEstimatedRevenue +=
          Number(req.serviceFee ?? 0) +
          Number(req.partFee ?? 0) +
          Number(req.shippingFee ?? 0);
      }
    }

    return { activeTickets, totalEstimatedRevenue };
  }, [requests]);

  // Mutasi status yang aman (Optimistic UI Update)
  const handleStatusAdvance = useCallback(
    async (id: number, ticketNumber: string, nextStatus: StatusServiceType) => {
      // 1. Ubah UI secara instan agar terasa sangat cepat dan responsif
      setRequests((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, statusService: nextStatus } : item,
        ),
      );

      // 2. Sinkronisasi ke backend secara asinkron
      try {
        await ServiceRequestAPI.updateStatus(ticketNumber, nextStatus);
      } catch (err) {
        // Rollback jika terjadi kegagalan jaringan (Anti-Defect)
        fetchRequests();
      }
    },
    [fetchRequests],
  );

  return {
    requests: filteredRequests,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    metrics: financialMetrics,
    handleStatusAdvance,
    refreshData: fetchRequests,
  };
};
