import ServiceRequestDetail from '@/src/features/service-request/components/ServiceRequestDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ServiceRequestDetail />;
}
