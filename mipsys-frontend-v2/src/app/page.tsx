import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Mipsys Rebuild
        </h1>
        <p className="text-xl text-muted-foreground max-w-150 mx-auto">
          Sistem Manajemen Enterprise untuk Pelacakan Service Request dan Operasional Teknisi.
        </p>
      </div>
      
      <Link href="/service-request">
        <Button size="lg" className="px-8">
          Masuk ke Dashboard
        </Button>
      </Link>
    </div>
  );
}