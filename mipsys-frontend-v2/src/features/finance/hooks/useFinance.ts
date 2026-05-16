import { useState, useEffect, useCallback } from 'react';
import { financeApi, Invoice, FinanceStats } from '../api/finance-api';
import { toast } from 'react-hot-toast';

export const useInvoices = (search = '', status = '') => {
  const [data, setData] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await financeApi.getAll(search, status);
      setData(Array.isArray(result) ? result : result.data || []);
    } catch (error) {
      toast.error('Gagal memuat data invoice');
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, isLoading, refetch: fetchAll };
};

export const useFinanceStats = () => {
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    pendingPayment: 0,
    overdueAmount: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await financeApi.getStats();
      setStats(result);
    } catch (error) {
      toast.error('Gagal memuat statistik finance');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
};

export const useMarkInvoicePaid = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markPaid = async (id: number, method: string) => {
    setIsSubmitting(true);
    try {
      await financeApi.markAsPaid(id, method);
      toast.success('Invoice berhasil ditandai sebagai lunas');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memperbarui invoice';
      toast.error(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { markPaid, isSubmitting };
};
