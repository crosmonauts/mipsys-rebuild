import React from "react";
import { PurchaseOrder, PurchaseOrderStatusType } from "@/types";

interface PurchaseOrderTableProps {
  items: PurchaseOrder[];
}

// O(1) Lookup Table berstandar WCAG AAA (Ikon + Teks Kontras Tinggi)
// Menekan McCabe = 1, tanpa if/else bersarang
const AccessiblePOStatusLookup: Record<
  PurchaseOrderStatusType,
  { label: string; icon: string; styleClass: string }
> = {
  REQUESTED: {
    label: "Diminta",
    icon: "📝",
    styleClass: "bg-slate-100 text-slate-950 border-slate-900",
  },
  ORDERED: {
    label: "Dipesan",
    icon: "🛒",
    styleClass: "bg-blue-50 text-blue-950 border-blue-900",
  },
  SHIPPED: {
    label: "Dikirim",
    icon: "🚚",
    styleClass: "bg-amber-50 text-amber-950 border-amber-900",
  },
  RECEIVED: {
    label: "Diterima",
    icon: "✓",
    styleClass: "bg-green-50 text-green-950 border-green-900",
  },
  CANCELLED: {
    label: "Batal",
    icon: "✕",
    styleClass: "bg-red-50 text-red-950 border-red-900",
  },
};

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  items,
}) => {
  if (items.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center text-slate-950 bg-white rounded-lg border-2 border-slate-900 font-medium"
      >
        Tidak ada data pesanan pembelian.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border-2 border-slate-900 shadow-sm">
      {/* Atribut aria-label wajib untuk WCAG AAA agar tabel terbaca oleh Screen Reader */}
      <table
        aria-label="Tabel Daftar Pesanan Pembelian Suku Cadang"
        className="w-full text-left border-collapse"
      >
        {/* Caption tersembunyi secara visual tapi dibaca oleh sistem tunanetra */}
        <caption className="sr-only">
          Ringkasan status pengadaan barang dan harga satuan dari pemasok
        </caption>
        <thead>
          <tr className="bg-slate-200 border-b-2 border-slate-900 text-slate-950 font-extrabold text-sm uppercase tracking-wider">
            <th scope="col" className="p-4">
              Nama Suku Cadang
            </th>
            <th scope="col" className="p-4">
              Jumlah Pesanan
            </th>
            <th scope="col" className="p-4">
              Harga Satuan
            </th>
            <th scope="col" className="p-4">
              Total Biaya
            </th>
            <th scope="col" className="p-4">
              Status Pengadaan
            </th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-200 text-slate-950 text-base font-medium">
          {items.map((order) => {
            const statusCfg = AccessiblePOStatusLookup[order.status] || {
              label: order.status,
              icon: "▪",
              styleClass: "bg-white text-slate-950 border-slate-900",
            };
            const totalCost = order.quantity * Number(order.unitPrice);

            return (
              <tr
                key={order.id}
                className="hover:bg-slate-100 transition-colors focus-within:bg-slate-100"
              >
                <td className="p-4 font-bold text-slate-950">
                  {order.partName}
                </td>
                <td className="p-4">
                  {order.quantity}{" "}
                  <span className="text-xs font-normal text-slate-900">
                    Unit
                  </span>
                </td>
                <td className="p-4">
                  Rp {Number(order.unitPrice).toLocaleString("id-ID")}
                </td>
                <td className="p-4 font-extrabold text-slate-950">
                  Rp {totalCost.toLocaleString("id-ID")}
                </td>
                <td className="p-4">
                  {/* Indikator WCAG AAA: Menggabungkan Border Tegas + Ikon + Teks Jelas */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none border-2 font-extrabold text-sm ${statusCfg.styleClass}`}
                  >
                    <span aria-hidden="true" className="font-mono text-base">
                      {statusCfg.icon}
                    </span>
                    <span>{statusCfg.label}</span>
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
