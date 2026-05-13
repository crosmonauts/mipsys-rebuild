import React from "react";
import { ServiceRequest, StatusServiceType } from "@/src/types";

interface FinanceTableProps {
  items: ServiceRequest[];
  onPrintInvoice: (ticketNumber: string) => void;
}

// O(1) Lookup Table berstandar WCAG AAA (Ikon + Border + Kontras Absolut)
// Menekan McCabe = 1 untuk pemetaan status penagihan
const InvoiceStatusLookup: Record<
  StatusServiceType,
  { label: string; icon: string; borderStyle: string }
> = {
  WAITING_CHECK: {
    label: "Estimasi Awal",
    icon: "?",
    borderStyle: "bg-white text-slate-950 border-slate-400 border-dashed",
  },
  CHECK: {
    label: "Estimasi Awal",
    icon: "?",
    borderStyle: "bg-white text-slate-950 border-slate-400 border-dashed",
  },
  WAITING_APPROVE: {
    label: "Menunggu Bayar",
    icon: "!",
    borderStyle: "bg-amber-50 text-amber-950 border-amber-950 border-solid",
  },
  SERVICE: {
    label: "Menunggu Bayar",
    icon: "!",
    borderStyle: "bg-amber-50 text-amber-950 border-amber-950 border-solid",
  },
  DONE: {
    label: "Lunas (Paid)",
    icon: "✓",
    borderStyle: "bg-green-50 text-green-950 border-green-950 border-solid",
  },
  CANCEL: {
    label: "Dibatalkan",
    icon: "✕",
    borderStyle: "bg-red-50 text-red-950 border-red-950 border-solid",
  },
};

export const FinanceTable: React.FC<FinanceTableProps> = ({
  items,
  onPrintInvoice,
}) => {
  if (items.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center text-slate-950 bg-white border-2 border-slate-950 font-bold"
      >
        Tidak ada catatan faktur atau tagihan yang ditemukan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border-2 border-slate-950 shadow-sm">
      <table
        aria-label="Tabel Rincian Pembukuan dan Tagihan Pelanggan"
        className="w-full text-left border-collapse"
      >
        <caption className="sr-only">
          Rincian biaya jasa, suku cadang, dan status kelunasan per tiket
        </caption>
        <thead>
          <tr className="bg-slate-200 border-b-2 border-slate-950 text-slate-950 font-black text-xs uppercase tracking-wider">
            <th scope="col" className="p-4">
              No Faktur / Tiket
            </th>
            <th scope="col" className="p-4">
              Rincian Tagihan (Jasa + Part + Ongkir)
            </th>
            <th scope="col" className="p-4">
              Total Akhir
            </th>
            <th scope="col" className="p-4">
              Status Pembukuan
            </th>
            <th scope="col" className="p-4">
              Aksi Kasir
            </th>
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-slate-200 text-slate-950 font-medium">
          {items.map((inv) => {
            const statusCfg = InvoiceStatusLookup[inv.statusService] || {
              label: "Tidak Diketahui",
              icon: "▪",
              borderStyle:
                "bg-white text-slate-950 border-slate-950 border-solid",
            };

            const feeJasa = Number(inv.serviceFee);
            const feePart = Number(inv.partFee);
            const feeOngkir = Number(inv.shippingFee);
            const grandTotal = feeJasa + feePart + feeOngkir;

            return (
              <tr
                key={inv.id}
                className="hover:bg-slate-100 transition-colors focus-within:bg-slate-100"
              >
                <td className="p-4 font-mono font-black text-slate-950">
                  {inv.ticketNumber}
                </td>

                {/* Rincian Komponen Biaya Berstandar AAA (Tegas & Terbaca) */}
                <td className="p-4">
                  <div className="text-xs space-y-0.5 font-bold">
                    <div>
                      Jasa:{" "}
                      <span className="font-mono text-slate-900">
                        Rp {feeJasa.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div>
                      Part:{" "}
                      <span className="font-mono text-slate-900">
                        Rp {feePart.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div>
                      Ongkir:{" "}
                      <span className="font-mono text-slate-900">
                        Rp {feeOngkir.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-4 font-black text-base text-slate-950">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </td>

                <td className="p-4">
                  {/* Indikator Status Non-Warna (Tegas dengan Border) */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 font-black text-xs rounded-none ${statusCfg.borderStyle}`}
                  >
                    <span aria-hidden="true" className="font-mono text-sm">
                      {statusCfg.icon}
                    </span>
                    <span>{statusCfg.label}</span>
                  </span>
                </td>

                <td className="p-4">
                  <button
                    type="button"
                    onClick={() => onPrintInvoice(inv.ticketNumber)}
                    aria-label={`Cetak struk tagihan untuk nomor faktur ${inv.ticketNumber}`}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-indigo-950 text-white font-black text-xs uppercase tracking-wider border-2 border-slate-950 rounded-none focus:outline-none focus:ring-4 focus:ring-slate-950 focus:ring-offset-1 transition-all"
                  >
                    🖨️ Cetak Faktur
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
