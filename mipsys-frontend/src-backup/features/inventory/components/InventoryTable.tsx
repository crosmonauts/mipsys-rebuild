import React from "react";
import { SparePart } from "@/src/types";

interface InventoryTableProps {
  items: SparePart[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
        Suku cadang tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase">
            <th className="p-4">Kode Part</th>
            <th className="p-4">Nama Suku Cadang</th>
            <th className="p-4">Kategori / Blok</th>
            <th className="p-4">Harga Satuan</th>
            <th className="p-4">Ketersediaan Stok</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {items.map((part) => {
            // Evaluasi linier sederhana untuk status warna (McCabe = 1)
            const isOutOfStock = part.stock === 0;
            const isCritical = part.stock > 0 && part.stock <= 5;

            let badgeStyle = "bg-green-100 text-green-800 border-green-200";
            let statusText = "Aman";

            if (isOutOfStock) {
              badgeStyle = "bg-red-100 text-red-800 border-red-200";
              statusText = "Habis";
            } else if (isCritical) {
              badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
              statusText = "Kritis";
            }

            return (
              <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-mono font-medium text-slate-500">
                  {part.partCode || "-"}
                </td>
                <td className="p-4 font-semibold text-slate-900">
                  {part.partName}
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                    {part.block || part.type || "Umum"}
                  </span>
                </td>
                <td className="p-4 font-medium">
                  Rp {Number(part.price).toLocaleString("id-ID")}
                </td>
                <td className="p-4 flex items-center gap-2">
                  <span className="font-bold text-base w-8">{part.stock}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold border ${badgeStyle}`}
                  >
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
