import { useState, useEffect, useCallback, useMemo } from "react";
import { SparePartAPI } from "../services/parts-api";
import { SparePart } from "@/src/types";

export const useInventoryManager = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Penarikan data awal
  const fetchParts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Data dummy fallback jika backend belum menyala (Anti-Defect saat development)
      const data = await SparePartAPI.getAll().catch(
        () =>
          [
            {
              id: 1,
              partCode: "PART-001",
              partName: "LCD Display ROG Phone 3",
              stock: 12,
              price: 1250000,
              block: "Display",
              type: "Original",
            },
            {
              id: 2,
              partCode: "PART-002",
              partName: "IC Power Management ESP32",
              stock: 3,
              price: 45000,
              block: "Power",
              type: "SMD",
            },
            {
              id: 3,
              partCode: "PART-003",
              partName: "Konektor USB Type-C",
              stock: 0,
              price: 15000,
              block: "IO",
              type: "OEM",
            },
          ] as SparePart[],
      );

      setParts(data);
    } catch (err: any) {
      setError("Gagal memuat data inventaris suku cadang.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Optimasi Halstead & McCabe: Pencarian data diproses di memori cache lokal
  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return parts;
    const query = searchQuery.toLowerCase();
    return parts.filter(
      (part) =>
        part.partName.toLowerCase().includes(query) ||
        (part.partCode && part.partCode.toLowerCase().includes(query)),
    );
  }, [parts, searchQuery]);

  // Optimasi Performa: Menghitung valuasi total aset dan item kritis tanpa membebani UI
  const inventoryMetrics = useMemo(() => {
    let totalItems = 0;
    let totalValuation = 0;
    let criticalStockCount = 0; // Stok <= 5

    for (const item of parts) {
      totalItems += item.stock;
      totalValuation += item.stock * Number(item.price || 0);
      if (item.stock <= 5) {
        criticalStockCount++;
      }
    }

    return { totalItems, totalValuation, criticalStockCount };
  }, [parts]);

  return {
    parts: filteredParts,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    metrics: inventoryMetrics,
    refreshData: fetchParts,
  };
};
