import { DashboardTable } from "@/src/features/service-request/service-ui/DashboardTable";
import ServiceRequestDetail from "@/src/features/service-request/service-ui/ServiceRequestDetail";
// Menggunakan params sebagai Promise (Standar Next.js 15)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ServiceRequestDetail id={id} />;
}