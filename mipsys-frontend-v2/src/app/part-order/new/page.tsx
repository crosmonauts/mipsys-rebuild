'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Store,
  Pencil,
  Check,
  LayoutList,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';

// 1. Definisi Tipe Data
interface OrderItem {
  id: string;
  partName: string;
  qty: number;
  price: number;
  isEditing: boolean;
}

export default function NewPartOrderPage({
  params,
}: {
  params?: { id?: string };
}) {
  const [mounted, setMounted] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('Printhead');
  const [status, setStatus] = useState('PROSES'); // State untuk Status Pesanan

  // 2. State untuk daftar item
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', partName: '', qty: 1, price: 0, isEditing: true },
  ]);

  const isEditMode = !!params?.id;

  useEffect(() => {
    setMounted(true);
    if (isEditMode) {
      // Simulasi data saat masuk mode EDIT
      setSupplier('PT. Epson Indonesia');
      setStatus('PROSES');
      setItems([
        {
          id: '101',
          partName: 'Head L3210',
          qty: 1,
          price: 1500000,
          isEditing: false,
        },
      ]);
    }
  }, [isEditMode]);

  // 3. FUNGSI ACTIONS
  const addItem = () => {
    const disabledEditItems = items.map((item) => ({
      ...item,
      isEditing: false,
    }));
    setItems([
      ...disabledEditItems,
      {
        id: Date.now().toString(),
        partName: '',
        qty: 1,
        price: 0,
        isEditing: true,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const toggleEdit = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, isEditing: !item.isEditing } : item,
      ),
    );
  };

  const updateItem = (
    id: string,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const grandTotal = items.reduce(
    (acc, item) => acc + item.qty * item.price,
    0,
  );

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/part-order">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-2 border-slate-200 hover:border-slate-950 transition-all"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight uppercase">
              {isEditMode ? 'Update' : 'Buat'}{' '}
              <span className="text-blue-700">Order</span>
            </h1>
            <p className="text-sm text-slate-500 font-bold italic">
              "Lengkapi rincian pengadaan dan status unit."
            </p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
          <Save size={18} strokeWidth={3} />{' '}
          {isEditMode ? 'Update Data' : 'Simpan Pesanan'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: INFO SUPPLIER & STATUS */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none rounded-[2.5rem] shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b-2 border-slate-100 p-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Store size={14} /> Detail Pengadaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Nama Supplier
                </label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Contoh: PT. Epson Indonesia"
                  className="rounded-xl border-2 border-slate-100 h-12 font-bold focus:border-blue-600 transition-all text-slate-900"
                />
              </div>

              {/* DROPDOWN STATUS PESANAN */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Status Pesanan
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-slate-100 bg-transparent px-3 font-bold text-sm outline-none focus:border-blue-600 transition-all appearance-none text-slate-900"
                  >
                    <option value="PENDING">WAITING (PENDING)</option>
                    <option value="PROSES">IN PROGRESS (PROSES)</option>
                    <option value="SELESAI">COMPLETED (SELESAI)</option>
                    <option value="BATAL">CANCELLED (BATAL)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <LayoutList size={14} className="text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-100 bg-transparent px-3 font-bold text-sm outline-none focus:border-blue-600 transition-all appearance-none text-slate-900"
                >
                  <option>Printhead</option>
                  <option>Roller / Gear</option>
                  <option>Mainboard</option>
                  <option>Tinta / Toner</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: TABLE DENGAN FUNGSI EDIT */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-950 text-white p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Package size={16} /> Rincian Item (Editable)
                </CardTitle>
                <Button
                  onClick={addItem}
                  variant="ghost"
                  className="text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest flex gap-2 border-none"
                >
                  <Plus size={14} strokeWidth={3} /> Tambah Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="p-5 pl-8">Nama Part</th>
                      <th className="p-5 w-24 text-center">Qty</th>
                      <th className="p-5">Harga (Rp)</th>
                      <th className="p-5 text-center pr-8">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <tr key={item.id} className="group transition-colors">
                        <td className="p-4 pl-8">
                          {item.isEditing ? (
                            <Input
                              value={item.partName}
                              onChange={(e) =>
                                updateItem(item.id, 'partName', e.target.value)
                              }
                              placeholder="Input sparepart..."
                              className="h-11 border-none bg-slate-50 font-bold focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl text-slate-900"
                            />
                          ) : (
                            <p className="font-bold text-slate-700 pl-3">
                              {item.partName || '-'}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {item.isEditing ? (
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  'qty',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="h-11 border-none bg-slate-50 font-bold text-center rounded-xl text-slate-900"
                            />
                          ) : (
                            <p className="font-bold text-slate-700 text-center">
                              {item.qty}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {item.isEditing ? (
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  'price',
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="h-11 border-none bg-slate-50 font-bold rounded-xl text-slate-900"
                            />
                          ) : (
                            <p className="font-bold text-slate-700">
                              Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center pr-8">
                          <div className="flex items-center justify-center gap-2">
                            {/* TOMBOL EDIT / SAVE (DENGAN LOGIKA TOGGLE) */}
                            <button
                              onClick={() => toggleEdit(item.id)}
                              className={`p-2.5 rounded-xl transition-all shadow-sm ${
                                item.isEditing
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
                              }`}
                              title={
                                item.isEditing ? 'Simpan Baris' : 'Edit Baris'
                              }
                            >
                              {item.isEditing ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <Pencil size={18} />
                              )}
                            </button>

                            {/* TOMBOL HAPUS */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2.5 text-slate-300 hover:text-white hover:bg-red-600 transition-all bg-slate-50 rounded-xl"
                              title="Hapus Baris"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FOOTER TOTAL */}
              <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex flex-col items-end">
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    Total Estimasi
                  </p>
                  <h2 className="text-4xl font-black text-slate-950 tracking-tighter">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </h2>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
