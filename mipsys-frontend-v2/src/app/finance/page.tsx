import FinancePage from '@/src/features/finance/page';

export default function Page() {
  return (
    <main className="planner-bg min-h-screen">
      <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12">
        <FinancePage />
      </div>
    </main>
  );
}
