import React from "react";
import { ServiceRequest, StatusServiceType } from "@/src/types";

interface ServiceDashboardTableProps {
  items: ServiceRequest[];
  onAdvanceStatus: (
    id: number,
    ticketNumber: string,
    nextStatus: StatusServiceType,
  ) => void;
}

const AccessibleStatusLookup: Record<
  StatusServiceType,
  {
    label: string;
    icon: string;
    styleClass: string;
    nextActionLabel: string | null;
    nextStatus: StatusServiceType | null;
  }
> = {
  WAITING_CHECK: {
    label: "Menunggu Cek",
    icon: "⏳",
    styleClass: "bg-yellow-50 text-yellow-950 border-yellow-950",
    nextActionLabel: "Mulai Pengecekan",
    nextStatus: "CHECK",
  },
  CHECK: {
    label: "Sedang Dicek",
    icon: "🔍",
    styleClass: "bg-blue-50 text-blue-950 border-blue-950",
    nextActionLabel: "Ajukan Biaya",
    nextStatus: "WAITING_APPROVE",
  },
  WAITING_APPROVE: {
    label: "Menunggu Persetujuan",
    icon: "📋",
    styleClass: "bg-amber-50 text-amber-950 border-amber-950",
    nextActionLabel: "Setujui & Servis",
    nextStatus: "SERVICE",
  },
  SERVICE: {
    label: "Proses Servis",
    icon: "🔧",
    styleClass: "bg-purple-50 text-purple-950 border-purple-950",
    nextActionLabel: "Selesaikan Servis",
    nextStatus: "DONE",
  },
  DONE: {
    label: "Selesai",
    icon: "✓",
    styleClass: "bg-green-50 text-green-950 border-green-950",
    nextActionLabel: null,
    nextStatus: null,
  },
  CANCEL: {
    label: "Dibatalkan",
    icon: "✕",
    styleClass: "bg-red-50 text-red-950 border-red-950",
    nextActionLabel: null,
    nextStatus: null,
  },
};

export const ServiceDashboardTable: React.FC<ServiceDashboardTableProps> = ({
  items,
  onAdvanceStatus,
}) => {
  if (items.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="p-8 text-center text-slate-950 bg-white border-2 border-slate-950 font-bold"
      >
        Tidak ada tiket perbaikan yang sesuai dengan kriteria pencarian.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border-4 border-slate-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <table
        aria-label="Tabel Dashboard Perbaikan"
        className="w-full text-left border-collapse"
      >
        <thead>
          <tr className="bg-slate-950 text-white font-black text-xs uppercase tracking-widest">
            <th className="p-4 border-r border-slate-800">
              No Tiket / Customer
            </th>
            <th className="p-4 border-r border-slate-800">Unit (Model & SN)</th>
            <th className="p-4 border-r border-slate-800">Keluhan / Problem</th>
            <th className="p-4 border-r border-slate-800">Status</th>
            <th className="p-4">Waktu (Masuk & Dibuat)</th>
          </tr>
        </thead>
        <tbody className="divide-y-4 divide-slate-950">
          {items.map((req) => {
            const cfg = AccessibleStatusLookup[req.statusService] || {
              label: req.statusService,
              icon: "▪",
              styleClass: "bg-white",
              nextActionLabel: null,
              nextStatus: null,
            };

            return (
              <tr
                key={req.id}
                className="hover:bg-slate-50 transition-colors focus-within:bg-slate-50"
              >
                {/* No Tiket & Customer */}
                <td className="p-4 border-r-2 border-slate-950">
                  <div className="font-black text-lg text-slate-950 leading-none">
                    {req.ticketNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-600 mt-1 uppercase italic">
                    {req.customerName}
                  </div>
                </td>

                {/* Model & Serial */}
                <td className="p-4 border-r-2 border-slate-950">
                  <div className="font-black text-slate-900">
                    {req.modelName}
                  </div>
                  <div className="font-mono text-[10px] bg-slate-100 px-1 inline-block border border-slate-300 mt-1">
                    SN: {req.serialNumber}
                  </div>
                </td>

                {/* Problem Description */}
                <td className="p-4 border-r-2 border-slate-950 max-w-xs">
                  <div className="text-sm font-bold text-slate-800 leading-tight">
                    {req.problemDescription || (
                      <span className="text-slate-400 italic font-normal">
                        Deskripsi tidak tersedia
                      </span>
                    )}
                  </div>
                </td>

                {/* Status & Action Button */}
                <td className="p-4 border-r-2 border-slate-950">
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 font-black text-[10px] ${cfg.styleClass}`}
                  >
                    <span>{cfg.icon}</span> {cfg.label}
                  </div>
                  {cfg.nextActionLabel && cfg.nextStatus && (
                    <button
                      onClick={() =>
                        onAdvanceStatus(
                          req.id,
                          req.ticketNumber,
                          cfg.nextStatus!,
                        )
                      }
                      className="block mt-2 w-full bg-slate-950 text-white text-[10px] font-black py-1 hover:bg-indigo-700 focus:ring-4 focus:ring-slate-400 outline-none"
                    >
                      {cfg.nextActionLabel.toUpperCase()} ➔
                    </button>
                  )}
                </td>

                {/* Date & Time Info */}
                <td className="p-4 text-[10px] font-bold text-slate-950">
                  <div>
                    MASUK:{" "}
                    {new Date(req.incomingDate).toLocaleDateString("id-ID")}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
