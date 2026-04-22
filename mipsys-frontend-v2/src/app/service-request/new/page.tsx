// src/app/service-request/new/page.tsx

import { CreateSRForm } from '@/src/features/service-request/service-ui/CreateSRForm';

// WAJIB ada "export default" agar Next.js bisa merender halamannya
export default function NewServiceRequestPage() {
  return (
    <main className="container mx-auto py-10">
      <CreateSRForm />
    </main>
  );
}
