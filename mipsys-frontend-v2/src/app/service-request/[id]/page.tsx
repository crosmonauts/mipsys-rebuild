import ServiceRequestDetail from '@/src/features/service-request/components/ServiceRequestDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
        <ServiceRequestDetail />
      </div>
    </main>
  );
}
