'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  Package,
  Store,
  Pencil,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { useCreatePurchaseOrder, useUpdatePurchaseOrder } from '@/src/features/part-order/hooks/usePurchaseOrder';
import { poApi } from '@/src/features/part-order/api/po-api';
import { inventoryApi } from '@/src/features/inventory/api/inventory-api';

// 1. Definisi Tipe Data
interface OrderItem {
  id: string;
  partName: string;
  modelName: string;
  qty: number;
  price: number;
  isEditing: boolean;
}

export default function NewPartOrderPage({
  searchParams,
}: {
  searchParams?: { id?: string };
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

  const sp = searchParams ? React.use(searchParams) : {};
  const editId = sp?.id ? Number(sp.id) : null;
  const isEditMode = editId !== null;

  useEffect(() => {
    setMounted(true);
    inventoryApi.getModels().then(setCategories).catch(() => {});

    if (isEditMode && editId) {
      poApi.getById(editId).then((po) => {
        setSupplier(po.supplierName);
        setItems(
          po.items?.map((item, i) => ({
            id: String(item.id || i),
            partName: item.partName || '',
            modelName: item.modelName || '',
            qty: item.quantity,
            price: parseFloat(item.unitPrice || '0'),
            isEditing: false,
          })) || []
        );
      }).catch(() => {});
    }
  }, [isEditMode, editId]);

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
        modelName: '',
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

  const validate = (): string[] => {
    const errs: string[] = [];
    for (const item of items) {
      if (!item.partName.trim()) errs.push('Setiap item harus memiliki nama part.');
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
    <main className="planner-bg min-h-screen">
    <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8 animate-in slide-in-from-bottom-4 duration-700 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/part-order">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-2 border-border/20 hover:border-foreground transition-all"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase">
              {isEditMode ? 'Update' : 'Buat'}{' '}
              <span className="text-primary">Order</span>
            </h1>
            <p className="text-sm text-muted-foreground font-bold italic">
              "Lengkapi rincian pengadaan dan status unit."
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isUpdating}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-10 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isUpdating ? (
            <Loader2 size={18} strokeWidth={3} className="animate-spin" />
          ) : (
            <Save size={18} strokeWidth={3} />
          )}{' '}
          {isEditMode ? 'Update Data' : 'Simpan Pesanan'}
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-sm font-bold text-red-400">{e}</li>
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
                <Store size={14} /> Detail Pengadaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">
                  Nama Supplier
                </label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Contoh: PT. Epson Indonesia"
                  className="rounded-xl border border-border/20 h-12 font-bold focus:border-primary transition-all text-foreground bg-card"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: TABLE DENGAN FUNGSI EDIT */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
            <CardHeader className="bg-card text-foreground p-6 border-b border-border/20">
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
                  <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    <tr>
                      <th className="p-5 pl-8">Nama Part</th>
                      <th className="p-5 w-24 text-center">Qty</th>
                      <th className="p-5">Harga (Rp)</th>
                      <th className="p-5">Model</th>
                      <th className="p-5 text-center pr-8">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
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
                              className="h-11 border-none bg-muted/50 font-bold focus-visible:ring-2 focus-visible:ring-primary rounded-xl text-foreground"
                            />
                          ) : (
                            <p className="font-bold text-muted-foreground pl-3">
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
                              className="h-11 border-none bg-muted/50 font-bold text-center rounded-xl text-foreground"
                            />
                          ) : (
                            <p className="font-bold text-muted-foreground text-center">
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
                              className="h-11 border-none bg-muted/50 font-bold rounded-xl text-foreground"
                            />
                          ) : (
                            <p className="font-bold text-muted-foreground">
                              Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {item.isEditing ? (
                            <select
                              value={item.modelName}
                              onChange={(e) => updateItem(item.id, 'modelName', e.target.value)}
                              className="w-full h-11 rounded-xl border border-border/20 bg-muted/50 px-3 font-bold text-sm outline-none focus:border-primary transition-all appearance-none text-foreground"
                            >
                              <option value="">Pilih Model</option>
                              {categories.map((model) => (
                                <option key={model} value={model}>{model}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="font-bold text-muted-foreground pl-3">
                              {item.modelName || '-'}
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
                                  : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                              }`}
                              title={item.isEditing ? 'Simpan Baris' : 'Edit Baris'}
                              aria-label={item.isEditing ? 'Simpan baris' : 'Edit baris'}
                            >
                              {item.isEditing ? (
                                <Check size={18} strokeWidth={3} />
                              ) : (
                                <Pencil size={18} />
                              )}
                            </button>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2.5 text-muted-foreground hover:text-white hover:bg-destructive transition-all bg-muted/50 rounded-xl"
                              title="Hapus Baris"
                              aria-label="Hapus baris"
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
              <div className="p-8 bg-muted/30 border-t border-border/10 flex flex-col items-end">
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                    Total Estimasi
                  </p>
                  <h2 className="text-4xl font-bold text-foreground tracking-tighter">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </h2>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </main>
  );
}
