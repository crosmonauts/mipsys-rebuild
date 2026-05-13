"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Kamus Menu Statis - Menjaga LoC dan Halstead sangat rendah
const MENU_ITEMS = [
  { id: "sr", label: "Service Request", path: "/service-request", icon: "🔧" },
  { id: "inv", label: "Master Inventory", path: "/inventory", icon: "📦" },
  { id: "po", label: "Purchase Order", path: "/purchase-order", icon: "🛒" },
  { id: "fin", label: "Finance & Fee", path: "/finance", icon: "💳" },
] as const;

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Header Logo Pabrik */}
      <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
        <span className="font-mono font-extrabold text-lg text-white tracking-wider">
          MIPSYS<span className="text-indigo-500">V2</span>
        </span>
      </div>

      {/* Area Daftar Navigasi (FDD Sektoral) */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Modul Produksi
        </div>
        {MENU_ITEMS.map((item) => {
          // Evaluasi O(1) untuk menentukan menu aktif tanpa if/else bersarang
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="text-base" role="img" aria-label={item.label}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Profil (Statis / Anti-Defect) */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-500">
        <div className="font-medium text-slate-400 truncate">
          Administrator Portal
        </div>
        <div>Sistem Terintegrasi</div>
      </div>
    </aside>
  );
};
