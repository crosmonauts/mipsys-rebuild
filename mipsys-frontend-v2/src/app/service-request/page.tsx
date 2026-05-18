'use client';

import { SrDashboard } from '@/src/features/service-request/components/SrDashboard';

export default function ServiceRequestPage() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
        <SrDashboard />
      </div>
    </main>
  );
}
