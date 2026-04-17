import { DashboardTable } from "@/src/features/service-request/components/DashboardTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ServiceRequestDashboardPage() {
  return (
    <div className="container mx-auto py-10 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Service Request</h1>
          <p className="text-muted-foreground mt-1">Daftar seluruh tiket permintaan servis yang terdaftar di sistem Mipsys.</p>
        </div>
        
        {/* Tombol Navigasi ke Form Baru */}
        <Link href="/service-request/new">
          <Button>+ Buat SR Baru</Button>
        </Link>
      </div>
      
      {/* Memanggil komponen tabel utama */}
      <DashboardTable />
    </div>
  );
}