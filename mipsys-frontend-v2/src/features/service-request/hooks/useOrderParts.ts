import { useState, useEffect, useCallback } from 'react';
import { orderPartsApi, OrderPart, AddPartDto } from '../api/order-parts-api';
import { toast } from 'react-hot-toast';

export const useOrderParts = (serviceRequestId: number | null) => {
  const [parts, setParts] = useState<OrderPart[]>([]);
  const [totalFee, setTotalFee] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParts = useCallback(async () => {
    if (!serviceRequestId) return;
    try {
      setIsLoading(true);
      const [partsData, totalData] = await Promise.all([
        orderPartsApi.getBySR(serviceRequestId),
        orderPartsApi.getTotal(serviceRequestId),
      ]);
      setParts(Array.isArray(partsData) ? partsData : []);
      setTotalFee(totalData?.totalPartsCost ?? 0);
    } catch (error) {
      toast.error('Gagal memuat data part yang digunakan');
    } finally {
      setIsLoading(false);
    }
  }, [serviceRequestId]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const addPart = async (data: AddPartDto) => {
    try {
      await orderPartsApi.addPart(data);
      toast.success('Part berhasil ditambahkan');
      await fetchParts();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menambahkan part';
      toast.error(message);
      throw error;
    }
  };

  const removePart = async (id: number) => {
    try {
      await orderPartsApi.removePart(id);
      toast.success('Part berhasil dihapus');
      await fetchParts();
    } catch (error) {
      toast.error('Gagal menghapus part');
      throw error;
    }
  };

  return { parts, totalFee, isLoading, addPart, removePart, refetch: fetchParts };
};
