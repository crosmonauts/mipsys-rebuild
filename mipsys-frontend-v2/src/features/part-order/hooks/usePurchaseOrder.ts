import { useState, useEffect, useCallback } from 'react';
import { poApi } from '../api/po-api';
import type { PurchaseOrder, CreatePurchaseOrderDto, PoStatus } from '../types';
import { toast } from 'react-hot-toast';

export const usePurchaseOrders = () => {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await poApi.getAll();
      setData(Array.isArray(result) ? result : result.data || []);
    } catch {
      toast.error('Gagal memuat data purchase orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, isLoading, refetch: fetchAll };
};

export const usePurchaseOrder = (id: number | null) => {
  const [data, setData] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOne = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const result = await poApi.getById(id);
      setData(result);
    } catch {
      toast.error('Gagal memuat detail purchase order');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  return { data, isLoading, refetch: fetchOne };
};

export const useUpdatePurchaseOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = async (id: number, data: CreatePurchaseOrderDto) => {
    setIsSubmitting(true);
    try {
      const result = await poApi.update(id, data);
      toast.success('Purchase order berhasil diperbarui');
      return result;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Gagal memperbarui purchase order';
      toast.error(Array.isArray(message) ? message[0] : message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { update, isSubmitting };
};

export const useCreatePurchaseOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const create = async (data: CreatePurchaseOrderDto) => {
    setIsSubmitting(true);
    try {
      const result = await poApi.create(data);
      toast.success('Purchase order berhasil dibuat');
      return result;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Gagal membuat purchase order';
      toast.error(Array.isArray(message) ? message[0] : message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { create, isSubmitting };
};

export const useUpdatePurchaseOrderStatus = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = async (id: number, status: PoStatus) => {
    setIsSubmitting(true);
    try {
      const result = await poApi.updateStatus(id, status);
      toast.success('Status purchase order berhasil diperbarui');
      return result;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Gagal memperbarui status';
      toast.error(Array.isArray(message) ? message[0] : message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateStatus, isSubmitting };
};
