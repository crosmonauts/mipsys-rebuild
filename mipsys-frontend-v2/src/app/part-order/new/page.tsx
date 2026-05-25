'use client';

<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
=======
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
>>>>>>> main
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Store,
  Pencil,
  Check,
<<<<<<< HEAD
  LayoutList,
=======
  Loader2,
>>>>>>> main
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
<<<<<<< HEAD
=======
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@/src/features/part-order/hooks/usePurchaseOrder';
import { poApi } from '@/src/features/part-order/api/po-api';
import { inventoryApi } from '@/src/features/inventory/api/inventory-api';
>>>>>>> main

// 1. Definisi Tipe Data
interface OrderItem {
  id: string;
  partName: string;
<<<<<<< HEAD
=======
  modelName: string;
>>>>>>> main
  qty: number;
  price: number;
  isEditing: boolean;
}

export default function NewPartOrderPage({
<<<<<<< HEAD
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
=======
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const { create, isSubmitting } = useCreatePurchaseOrder();
  const { update, isSubmitting: isUpdating } = useUpdatePurchaseOrder();
  const [mounted, setMounted] = useState(false);
  const [supplier, setSupplier] = useState('EPSON');
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // 2. State untuk daftar item
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', partName: '', modelName: '', qty: 1, price: 0, isEditing: true },
  ]);

  const sp = use(searchParams ?? Promise.resolve<{ id?: string }>({}));
  const editId = sp.id ? Number(sp.id) : null;
  const isEditMode = editId !== null;

  useEffect(() => {
    setMounted(true);
    inventoryApi
      .getModels()
      .then(setCategories)
      .catch(() => {});

    if (isEditMode && editId) {
      poApi
        .getById(editId)
        .then((po) => {
          setSupplier(po.supplierName);
          setItems(
            po.items?.map((item, i) => ({
              id: String(item.id || i),
              partName: item.partName || '',
              modelName: item.modelName || '',
              qty: item.quantity,
              price: parseFloat(item.unitPrice || '0'),
              isEditing: false,
            })) || [],
          );
        })
        .catch(() => {});
    }
  }, [isEditMode, editId]);
>>>>>>> main

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
<<<<<<< HEAD
=======
        modelName: '',
>>>>>>> main
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

<<<<<<< HEAD
  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-700 text-left">
=======
  const validate = (): string[] => {
    const errs: string[] = [];
    for (const item of items) {
      if (!item.partName.trim())
        errs.push('Setiap item harus memiliki nama part.');
      if (item.qty < 1) errs.push('Qty minimal 1.');
      if (item.price < 1) errs.push('Harga minimal Rp 1.');
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    const payload = {
      supplierName: supplier,
      requestedBy: 1,
      items: items.map((item) => ({
        partName: item.partName || undefined,
        modelName: item.modelName || undefined,
        quantity: item.qty,
        unitPrice: item.price,
      })),
    };

    if (isEditMode && editId) {
      await update(editId, payload);
    } else {
      await create(payload);
    }
    router.push('/part-order');
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 text-left">
>>>>>>> main
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/part-order">
<<<<<<< HEAD
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
=======
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Kembali
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase">
              {isEditMode ? 'Update' : 'Buat'}{' '}
              <span className="text-primary">Order</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold italic">
>>>>>>> main
              "Lengkapi rincian pengadaan dan status unit."
            </p>
          </div>
        </div>
<<<<<<< HEAD
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
          <Save size={18} strokeWidth={3} />{' '}
=======
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isUpdating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isUpdating ? (
            <Loader2
              size={18}
              strokeWidth={3}
              className="motion-safe:animate-spin"
            />
          ) : (
            <Save size={18} strokeWidth={3} aria-hidden="true" />
          )}{' '}
>>>>>>> main
          {isEditMode ? 'Update Data' : 'Simpan Pesanan'}
        </Button>
      </div>

<<<<<<< HEAD
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: INFO SUPPLIER & STATUS */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none rounded-[2.5rem] shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50 border-b-2 border-slate-100 p-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Store size={14} /> Detail Pengadaan
=======
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-sm font-bold text-destructive">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: INFO SUPPLIER & STATUS */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none rounded-[2.5rem] shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/50 border-b border-border/10 p-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Store size={14} aria-hidden="true" /> Detail Pengadaan
>>>>>>> main
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
=======
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
>>>>>>> main
                  Nama Supplier
                </label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Contoh: PT. Epson Indonesia"
<<<<<<< HEAD
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
=======
                  className="rounded-xl border border-border/20 h-12 font-bold focus:border-primary transition-all text-foreground bg-card"
                />
              </div>
>>>>>>> main
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: TABLE DENGAN FUNGSI EDIT */}
        <div className="lg:col-span-2">
<<<<<<< HEAD
          <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-950 text-white p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Package size={16} /> Rincian Item (Editable)
=======
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
            <CardHeader className="bg-card text-foreground p-6 border-b border-border/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Package size={16} aria-hidden="true" /> Rincian Item
                  (Editable)
>>>>>>> main
                </CardTitle>
                <Button
                  onClick={addItem}
                  variant="ghost"
<<<<<<< HEAD
                  className="text-white hover:bg-white/10 font-black text-[10px] uppercase tracking-widest flex gap-2 border-none"
                >
                  <Plus size={14} strokeWidth={3} /> Tambah Row
=======
                  className="text-foreground hover:bg-muted font-black text-[10px] uppercase tracking-widest flex gap-2 border-none"
                >
                  <Plus size={14} strokeWidth={3} aria-hidden="true" /> Tambah
                  Row
>>>>>>> main
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
<<<<<<< HEAD
                  <thead className="bg-slate-50 border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
=======
                  <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
>>>>>>> main
                    <tr>
                      <th className="p-5 pl-8">Nama Part</th>
                      <th className="p-5 w-24 text-center">Qty</th>
                      <th className="p-5">Harga (Rp)</th>
<<<<<<< HEAD
                      <th className="p-5 text-center pr-8">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
=======
                      <th className="p-5">Model</th>
                      <th className="p-5 text-center pr-8">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
>>>>>>> main
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
<<<<<<< HEAD
                              className="h-11 border-none bg-slate-50 font-bold focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl text-slate-900"
                            />
                          ) : (
                            <p className="font-bold text-slate-700 pl-3">
=======
                              className="h-11 border-none bg-muted/50 font-bold focus-visible:ring-2 focus-visible:ring-primary rounded-xl text-foreground"
                            />
                          ) : (
                            <p className="font-bold text-muted-foreground pl-3">
>>>>>>> main
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
<<<<<<< HEAD
                              className="h-11 border-none bg-slate-50 font-bold text-center rounded-xl text-slate-900"
                            />
                          ) : (
                            <p className="font-bold text-slate-700 text-center">
=======
                              className="h-11 border-none bg-muted/50 font-bold text-center rounded-xl text-foreground"
                            />
                          ) : (
                            <p className="font-bold text-muted-foreground text-center">
>>>>>>> main
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
<<<<<<< HEAD
                              className="h-11 border-none bg-slate-50 font-bold rounded-xl text-slate-900"
                            />
                          ) : (
                            <p className="font-bold text-slate-700">
=======
                              className="h-11 border-none bg-muted/50 font-bold rounded-xl text-foreground"
                            />
                          ) : (
                            <p className="font-bold text-muted-foreground">
>>>>>>> main
                              Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </td>
<<<<<<< HEAD
=======
                        <td className="p-4">
                          {item.isEditing ? (
                            <select
                              value={item.modelName}
                              onChange={(e) =>
                                updateItem(item.id, 'modelName', e.target.value)
                              }
                              className="w-full h-11 rounded-xl border border-border/20 bg-muted/50 px-3 font-bold text-sm outline-none focus:border-primary transition-all appearance-none text-foreground"
                            >
                              <option value="">Pilih Model</option>
                              {categories.map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-bold text-muted-foreground pl-3">
                              {item.modelName || '-'}
                            </p>
                          )}
                        </td>
>>>>>>> main
                        <td className="p-4 text-center pr-8">
                          <div className="flex items-center justify-center gap-2">
                            {/* TOMBOL EDIT / SAVE (DENGAN LOGIKA TOGGLE) */}
                            <button
                              onClick={() => toggleEdit(item.id)}
                              className={`p-2.5 rounded-xl transition-all shadow-sm ${
                                item.isEditing
<<<<<<< HEAD
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
=======
                                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                                  : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
>>>>>>> main
                              }`}
                              title={
                                item.isEditing ? 'Simpan Baris' : 'Edit Baris'
                              }
<<<<<<< HEAD
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
=======
                              aria-label={
                                item.isEditing ? 'Simpan baris' : 'Edit baris'
                              }
                            >
                              {item.isEditing ? (
                                <Check
                                  size={18}
                                  strokeWidth={3}
                                  aria-hidden="true"
                                />
                              ) : (
                                <Pencil size={18} aria-hidden="true" />
                              )}
                            </button>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2.5 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive transition-all bg-muted/50 rounded-xl"
                              title="Hapus Baris"
                              aria-label="Hapus baris"
                            >
                              <Trash2 size={18} aria-hidden="true" />
>>>>>>> main
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FOOTER TOTAL */}
<<<<<<< HEAD
              <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex flex-col items-end">
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    Total Estimasi
                  </p>
                  <h2 className="text-4xl font-black text-slate-950 tracking-tighter">
=======
              <div className="p-8 bg-muted/30 border-t border-border/10 flex flex-col items-end">
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Total Estimasi
                  </p>
                  <h2 className="text-4xl font-bold text-foreground tracking-tighter">
>>>>>>> main
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
