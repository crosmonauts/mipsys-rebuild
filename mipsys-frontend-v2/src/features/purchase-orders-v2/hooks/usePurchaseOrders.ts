import { useState, useEffect, useCallback } from 'react';
import { poApi, PurchaseOrder } from '../api/po-api';
import { toast } from 'react-hot-toast';

export const usePurchaseOrders = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await poApi.getAll();
      setOrders(data);
    } catch {
      toast.error('Gagal memuat data purchase orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, refetch: fetchOrders };
};
