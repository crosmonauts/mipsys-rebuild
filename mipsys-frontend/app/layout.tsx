import type { Metadata } from "next";
import { Sidebar } from "@/src/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mipsys Enterprise Portal",
  description: "Sistem Manajemen Inventaris & Service Request Terintegrasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen flex">
        {/* Lorong Navigasi Utama Kiri (Tanpa Navbar Atas) */}
        <Sidebar />

        {/* Ruang Kerja / Pabrik Utama Kanan */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
