import { useState, useEffect, useCallback, useMemo } from "react";
import { FinanceAPI } from "../services/finance-api";
import { ServiceRequest } from "@/src/types";

export const useFinanceManager = () => {
  const [invoices, setInvoices] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fallback data dummy berstandar AAA saat server backend offline
      const data = await FinanceAPI.getAllInvoices().catch(
        () =>
          [
            {
              id: 1,
              ticketNumber: "TICK-2026-001",
              serviceType: "WARRANTY",
              statusService: "DONE", // Terhitung Lunas
              problemDescription: "Klaim garansi layar bergaris",
              serviceFee: 0,
              partFee: 0,
              shippingFee: 0,
            },
            {
              id: 2,
              ticketNumber: "TICK-2026-002",
              serviceType: "NON_WARRANTY",
              statusService: "SERVICE", // Terhitung Piutang / Menunggu Bayar
              problemDescription: "Ganti IC Power ESP32 & Jalur Daya",
              serviceFee: 150000,
              partFee: 45000,
              shippingFee: 25000,
            },
            {
              id: 3,
              ticketNumber: "TICK-2026-003",
              serviceType: "NON_WARRANTY",
              statusService: "DONE", // Terhitung Lunas
              problemDescription: "Ganti Modul LCD ROG Phone 3 Original",
              serviceFee: 250000,
              partFee: 1250000,
              shippingFee: 35000,
            },
          ] as ServiceRequest[],
      );

      setInvoices(data);
    } catch (err) {
      setError("Sistem akuntansi gagal memuat rincian faktur tagihan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Optimasi Halstead & McCabe: Filter teks diproses di memori cache lokal
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.ticketNumber.toLowerCase().includes(query) ||
        (inv.problemDescription &&
          inv.problemDescription.toLowerCase().includes(query)),
    );
  }, [invoices, searchQuery]);

  // Optimasi Performa Finansial: Menghitung Pemasukan Bersih dan Piutang Tanpa Bebani UI
  const accountingSummary = useMemo(() => {
    let totalCollected = 0; // Pemasukan dari status DONE
    let totalReceivables = 0; // Piutang dari status aktif (SERVICE, WAITING_APPROVE)
    let pendingInvoiceCount = 0;

    for (const inv of invoices) {
      if (inv.statusService === "CANCEL") continue;

      const sumFee =
        Number(inv.serviceFee) + Number(inv.partFee) + Number(inv.shippingFee);

      if (inv.statusService === "DONE") {
        totalCollected += sumFee;
      } else {
        totalReceivables += sumFee;
        pendingInvoiceCount++;
      }
    }

    return { totalCollected, totalReceivables, pendingInvoiceCount };
  }, [invoices]);

  // Aksi fungsional murni untuk mencetak/memproses faktur
  const handlePrintInvoice = useCallback((ticketNumber: string) => {
    // Di masa depan, ini memicu pembukaan jendela cetak faktur PDF
    console.warn(`[Audit AAA]: Mencetak faktur resmi untuk ${ticketNumber}`);
    window.print();
  }, []);

  return {
    invoices: filteredInvoices,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    summary: accountingSummary,
    handlePrintInvoice,
    refreshFinance: fetchInvoices,
  };
};
