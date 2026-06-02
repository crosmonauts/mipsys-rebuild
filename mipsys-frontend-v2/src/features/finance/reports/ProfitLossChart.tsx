'use client';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { financeApi } from '../api/finance-api';
import { DashboardData } from '../types';

export function ProfitLossChart() {
  const [data, setData] = useState<DashboardData['monthly']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    financeApi.getDashboard()
      .then((res) => setData(res.monthly || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-muted-foreground">Memuat grafik...</div>;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="font-black text-sm mb-4 text-foreground">Revenue vs Expense (12 Bulan Terakhir)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#059669" name="Pendapatan" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#dc2626" name="Pengeluaran" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
