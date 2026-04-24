import { DashboardTable } from '@/src/features/service-request/service-ui/DashboardTable';

export default function ServiceRequestPage() {
  return (
    <main className="p-4 md:p-8 min-h-screen bg-[#f8fafc]">
      {/* Jangan tulis header lagi di sini karena sudah ada di dalam DashboardTable */}
      <DashboardTable />
    </main>
  );
}
