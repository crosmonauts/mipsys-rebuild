import { Suspense } from 'react';
import FinancePage from '@/src/features/finance/page';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FinancePage />
    </Suspense>
  );
}
