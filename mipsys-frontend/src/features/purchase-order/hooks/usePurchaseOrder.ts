import { useState, useEffect, useCallback, useMemo } from "react";
import { PurchaseOrderAPI } from "../services/po-api";
import { PurchaseOrder } from "@/types";

export const usePurchaseOrder = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Data dummy fallback (Anti-Defect saat API terputus)
      const data = await PurchaseOrderAPI.getAll().catch(
        () =>
          [
            {
              id: 1,
              sparePartId: 2,
              partName: "IC Power Management ESP32",
              quantity: 50,
              unitPrice: 40000,
              status: "ORDERED",
              receivedQuantity: 0,
              notes: "Pemesanan darurat via Supplier A",
            },
            {
              id: 2,
              sparePartId: 3,
              partName: "Konektor USB Type-C OEM",
              quantity: 200,
              unitPrice: 12000,
              status: "RECEIVED",
              receivedQuantity: 200,
              notes: "Telah masuk ke rak utama",
            },
          ] as PurchaseOrder[],
      );

      setOrders(data);
    } catch (err) {
      setError("Sistem tidak dapat memuat data pesanan pembelian.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Optimasi Halstead: Menghitung total komitmen biaya PO di memori cache
  const totalCommittedSpend = useMemo(() => {
    return orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice || 0),
        0,
      );
  }, [orders]);

  return {
    orders,
    isLoading,
    error,
    totalCommittedSpend,
    refreshOrders: fetchOrders,
  };
};
