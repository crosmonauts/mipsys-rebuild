'use client';

import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Package,
  Search,
  Plus,
  RefreshCcw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

type TabType = 'customers' | 'staff' | 'products';

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  type: 'PERSONAL' | 'CORPORATE';
  totalService: number;
}

interface Staff {
  id: number;
  name: string;
  role: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const mockCustomers: Customer[] = [
  { id: 1, name: 'Bpk. Ahmad Fauzi', phone: '081234567890', address: 'Jl. Gajahmada No. 10', type: 'PERSONAL', totalService: 5 },
  { id: 2, name: 'PT. Global Tech', phone: '024123456', address: 'Jl. Pemuda No. 45', type: 'CORPORATE', totalService: 12 },
  { id: 3, name: 'Ibu Sari Dewi', phone: '085678901234', address: 'Jl. Pandanaran No. 8', type: 'PERSONAL', totalService: 2 },
];

const mockStaff: Staff[] = [
  { id: 1, name: 'Nanda Pratama', role: 'Administrator', phone: '081234567890', status: 'ACTIVE' },
  { id: 2, name: 'Rudi Hermawan', role: 'Teknisi', phone: '085678901234', status: 'ACTIVE' },
  { id: 3, name: 'Siti Nurhaliza', role: 'Kasir', phone: '087890123456', status: 'ACTIVE' },
];

const mockProducts: Product[] = [
  { id: 1, name: 'Head L3210', category: 'Printhead', price: 1500000, stock: 10 },
  { id: 2, name: 'Roller Assy L3110', category: 'Roller', price: 250000, stock: 25 },
  { id: 3, name: 'Mainboard L3250', category: 'Mainboard', price: 850000, stock: 5 },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const filteredStaff = mockStaff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'customers' as TabType, label: 'Pelanggan', icon: <Users size={16} />, count: mockCustomers.length },
    { id: 'staff' as TabType, label: 'Staff', icon: <UserCheck size={16} />, count: mockStaff.length },
    { id: 'products' as TabType, label: 'Produk', icon: <Package size={16} />, count: mockProducts.length },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
            Master <span className="text-blue-700">Database</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold italic">
            "Manajemen data master pelanggan, staff, dan produk."
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border-2 border-slate-100 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-slate-950 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
            <Badge className="bg-white/20 text-inherit border-none font-black text-[9px] px-2">
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-950"
            size={18}
          />
          <Input
            placeholder={`Cari ${activeTab === 'customers' ? 'pelanggan' : activeTab === 'staff' ? 'staff' : 'produk'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-2 border-slate-200 rounded-xl font-bold focus:border-blue-600 text-slate-900"
          />
        </div>
        <Button className="bg-slate-950 hover:bg-blue-700 text-white font-black px-6 py-6 rounded-xl shadow-lg flex gap-2 uppercase text-xs tracking-widest">
          <Plus size={16} strokeWidth={3} /> Tambah Data
        </Button>
      </div>

      {/* Content */}
      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-950 text-white p-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            {tabs.find((t) => t.id === activeTab)?.icon}
            Data {tabs.find((t) => t.id === activeTab)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {activeTab === 'customers' && (
                  <tr>
                    <th className="p-5 pl-8">Nama</th>
                    <th className="p-5">Telepon</th>
                    <th className="p-5">Alamat</th>
                    <th className="p-5 text-center">Tipe</th>
                    <th className="p-5 text-center">Total Servis</th>
                    <th className="p-5 text-center pr-8">Aksi</th>
                  </tr>
                )}
                {activeTab === 'staff' && (
                  <tr>
                    <th className="p-5 pl-8">Nama</th>
                    <th className="p-5">Role</th>
                    <th className="p-5">Telepon</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5 text-center pr-8">Aksi</th>
                  </tr>
                )}
                {activeTab === 'products' && (
                  <tr>
                    <th className="p-5 pl-8">Nama Produk</th>
                    <th className="p-5">Kategori</th>
                    <th className="p-5 text-right">Harga</th>
                    <th className="p-5 text-center">Stok</th>
                    <th className="p-5 text-center pr-8">Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeTab === 'customers' &&
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5 pl-8 font-bold text-slate-950">{customer.name}</td>
                      <td className="p-5 text-slate-700 font-medium">{customer.phone}</td>
                      <td className="p-5 text-sm text-slate-500">{customer.address}</td>
                      <td className="p-5 text-center">
                        <Badge className={customer.type === 'CORPORATE' ? 'bg-blue-100 text-blue-700 border-none font-black text-[9px]' : 'bg-slate-100 text-slate-700 border-none font-black text-[9px]'}>
                          {customer.type}
                        </Badge>
                      </td>
                      <td className="p-5 text-center font-black text-slate-950">{customer.totalService}</td>
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white transition-all">
                            <Pencil size={16} />
                          </button>
                          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {activeTab === 'staff' &&
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5 pl-8 font-bold text-slate-950">{staff.name}</td>
                      <td className="p-5 text-slate-700 font-medium">{staff.role}</td>
                      <td className="p-5 text-slate-700 font-medium">{staff.phone}</td>
                      <td className="p-5 text-center">
                        <Badge className={staff.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-none font-black text-[9px]' : 'bg-red-100 text-red-700 border-none font-black text-[9px]'}>
                          {staff.status}
                        </Badge>
                      </td>
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white transition-all">
                            <Pencil size={16} />
                          </button>
                          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {activeTab === 'products' &&
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-5 pl-8 font-bold text-slate-950">{product.name}</td>
                      <td className="p-5 text-slate-700 font-medium">{product.category}</td>
                      <td className="p-5 text-right font-black text-blue-800">Rp {product.price.toLocaleString('id-ID')}</td>
                      <td className="p-5 text-center font-black text-slate-950">{product.stock}</td>
                      <td className="p-5 text-center pr-8">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white transition-all">
                            <Pencil size={16} />
                          </button>
                          <button className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 text-center bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Data master untuk referensi sistem
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
