import { useState, useEffect, useCallback } from 'react';
import { inventoryApi, InventoryPart } from '../api/inventory-api';
import { toast } from 'react-hot-toast';

export const useInventory = (search?: string, status?: 'ok' | 'low' | 'empty') => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await inventoryApi.getParts(search, status);
      setParts(data);
    } catch {
      toast.error('Gagal memuat data inventory');
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  return { parts, isLoading, refetch: fetchParts };
};
