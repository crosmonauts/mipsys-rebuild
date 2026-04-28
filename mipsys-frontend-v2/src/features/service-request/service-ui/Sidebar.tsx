'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Wallet,
  Users,
  Printer,
  LogOut,
  X,
} from 'lucide-react';

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const menuItems = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, link: '/' },
    {
      title: 'Service Request',
      icon: <ClipboardList size={20} />,
      link: '/service-request',
      count: '24',
    },
    {
      title: 'Inventory & Parts',
      icon: <Package size={20} />,
      link: '/inventory',
      count: '5',
    },
    {
      title: 'Finance & Billing',
      icon: <Wallet size={20} />,
      link: '/finance',
    },
    {
      title: 'Master Database',
      icon: <Users size={20} />,
      link: '/master-data',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#020617] text-white flex flex-col 
        transform transition-transform duration-300 ease-in-out border-r border-white/5
        md:relative md:translate-x-0 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        {/* Logo Section */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Printer size={18} strokeWidth={3} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none">
                MIPSYS
              </h1>
              <p className="text-[9px] font-black text-blue-400 tracking-widest uppercase mt-0.5">
                Enterprise AAA
              </p>
            </div>
          </div>
          <button className="md:hidden text-slate-400" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
            Modul Sistem
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.link;
            return (
              <Link
                key={item.title}
                href={item.link}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={
                      isActive ? 'text-white' : 'group-hover:text-blue-400'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold tracking-tight">
                    {item.title}
                  </span>
                </div>
                {item.count && (
                  <span className="bg-white/10 text-white px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-white/10">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Section */}
        <div className="p-4 bg-black/20">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                Nanda Pratama
              </p>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">
                Administrator
              </p>
            </div>
            <button className="p-1.5 hover:text-red-400 transition-colors text-white">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
