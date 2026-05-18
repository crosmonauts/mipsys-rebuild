import { CreateSRForm } from '@/src/features/service-request/components/CreateSRForm';

export default function NewServiceRequestPage() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
        <CreateSRForm />
      </div>
    </main>
  );
}
