import { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/finance-api';
import { Expense } from '../types';
import { toast } from 'react-hot-toast';

export const useExpenses = (filters?: { type?: string; category?: string }) => {
  const [data, setData] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await financeApi.getExpenses(filters);
      setData(Array.isArray(result) ? result : []);
    } catch {
      toast.error('Gagal memuat data expense');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { data, isLoading, refetch: fetchAll };
};
