"use client";

import { useEffect, useState } from "react";
import { srApi } from "../services/sr-api";
import { ServiceRequest } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function DashboardTable() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE BARU: Untuk Pencarian dan Paginasi
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // State sementara untuk ketikan
  const [page, setPage] = useState(1);
  const limit = 10; // Tampilkan 10 data per halaman

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);
      // Memasukkan parameter dinamis ke dalam API
      const result = await srApi.getAll(searchTerm, page, limit);

      const dataArray = Array.isArray(result) ? result : result.data || [];
      setData(dataArray);
    } catch (error) {
      console.error("Gagal mengambil data SR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pantau perubahan pada page atau searchTerm
  useEffect(() => {
    fetchServiceRequests();
  }, [page, searchTerm]);

  // Handler saat user menekan tombol cari atau Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset ke halaman 1 setiap kali mencari kata baru
    setSearchTerm(searchInput);
  };

  return (
    <div className="space-y-4">
      {/* BAGIAN ATAS: Kotak Pencarian */}
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-sm">
          <Input
            placeholder="Cari nama, model, atau No SR..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>
      </div>

      {/* BAGIAN TENGAH: Tabel Data */}
      <div className="border rounded-md bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. SR</TableHead>
              <TableHead>Nama Pelanggan</TableHead>
              <TableHead>Model Mesin</TableHead>
              <TableHead>Mode Servis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Masuk</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground animate-pulse"
                >
                  Mencari data di server...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  {searchTerm ? "Data tidak ditemukan." : "Belum ada data Service Request."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((sr) => (
                <TableRow key={sr.id}>
                  <TableCell className="font-medium">{sr.sr_number}</TableCell>
                  <TableCell>{sr.customer_name}</TableCell>
                  <TableCell>{sr.machine_model}</TableCell>
                  <TableCell>{sr.service_mode}</TableCell>
                  <TableCell>
                    <Badge variant={sr.status === "0" ? "default" : "secondary"}>
                      {sr.status === "0" ? "Baru" : "Diproses"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(sr.created_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/service-request/${sr.id}`}>
                      <Button variant="outline" size="sm">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* BAGIAN BAWAH: Navigasi Paginasi */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
        >
          Sebelumnya
        </Button>
        <div className="text-sm text-muted-foreground font-medium">Halaman {page}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={data.length < limit || isLoading}
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
