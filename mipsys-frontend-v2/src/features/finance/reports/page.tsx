'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ProfitLossChart } from './ProfitLossChart';
import { PpnReportView } from './PpnReport';
import { PageHeader } from '@/src/components/ui/page-header';
import { useAuth } from '@/src/lib/auth-context';

export default function ReportsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  React.useEffect(() => {
    if (!isLoading && user && !isSuperAdmin) {
      toast.error('Halaman laporan keuangan hanya untuk superadmin');
      router.replace('/');
    }
  }, [isLoading, user, isSuperAdmin, router]);

  if (isLoading || !user || !isSuperAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="Laporan Keuangan" />
        <p className="text-sm text-[var(--muted-foreground)]">
          Memverifikasi akses…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Laporan Keuangan" />
      <ProfitLossChart />
      <PpnReportView />
    </div>
  );
}
