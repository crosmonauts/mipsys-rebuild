'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  CaretLeftIcon,
  PlusIcon,
  TrashIcon,
  FloppyDiskIcon,
  PackageIcon,
  StorefrontIcon,
  PencilSimpleIcon,
  CheckIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { LoadingSkeletonCard } from '@/src/components/ui/loading-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@/src/features/part-order/hooks/usePurchaseOrder';
import { poApi } from '@/src/features/part-order/api/po-api';
import { inventoryApi } from '@/src/features/inventory/api/inventory-api';
import { cn } from '@/src/lib/utils';

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
  searchParams?: Promise<{ id?: string }>;
}) {
  const router = useRouter();
  const { create, isSubmitting } = useCreatePurchaseOrder();
  const { update, isSubmitting: isUpdating } = useUpdatePurchaseOrder();
  const [mounted, setMounted] = useState(false);
  const [supplier, setSupplier] = useState('EPSON');
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

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

  if (!mounted) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <LoadingSkeletonCard />
          </div>
          <div className="lg:col-span-2">
            <LoadingSkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const isLoading = isSubmitting || isUpdating;

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-700 text-left">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/part-order')}
          className="mb-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--muted)]/50 px-4 py-2.5 rounded-xl"
        >
          <CaretLeftIcon data-icon="inline-start" aria-hidden="true" />
          Kembali
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-[var(--foreground)] tracking-tight uppercase">
              {isEditMode ? 'Update' : 'Buat'}{' '}
              <span className="text-[var(--primary)]">Order</span>
            </h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-black px-10 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all gap-2 uppercase text-xs tracking-widest border-none"
          >
            {isLoading ? (
              <SpinnerIcon data-icon="inline-start" className="motion-safe:animate-spin" />
            ) : (
              <FloppyDiskIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {isEditMode ? 'Update Data' : 'Simpan Pesanan'}
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-[var(--destructive)]/10 border border-destructive/30 rounded-2xl p-5">
          <ul className="list-disc list-inside flex flex-col gap-1">
            {errors.map((e, i) => (
              <li key={i} className="text-sm font-bold text-[var(--destructive)]">
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="border border-border/15 rounded-[2.5rem] shadow-sm overflow-hidden bg-[var(--card)]">
            <CardHeader className="bg-[var(--muted)]/50 border-b border-border/8 p-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] flex items-center gap-2">
                <StorefrontIcon size={14} aria-hidden="true" /> Detail Pengadaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="micro-label text-[var(--muted-foreground)] ml-1">
                  Nama Supplier
                </label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Contoh: PT. Epson Indonesia"
                  className="rounded-xl border border-border/15 h-12 font-bold focus:border-primary transition-all text-[var(--foreground)] bg-[var(--muted)]/50"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-[var(--card)]">
            <CardHeader className="bg-[var(--muted)]/50 text-[var(--foreground)] p-6 border-b border-border/8">
              <div className="flex justify-between items-center">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <PackageIcon size={16} aria-hidden="true" /> Rincian Item
                  (Editable)
                </CardTitle>
                <Button
                  onClick={addItem}
                  variant="ghost"
                  className="text-[var(--foreground)] hover:bg-[var(--muted)] font-black text-[10px] uppercase tracking-widest gap-2 border-none"
                >
                  <PlusIcon data-icon="inline-start" aria-hidden="true" /> Tambah
                  Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--muted)]/50 border-b border-border/8 text-[10px] font-black uppercase text-[var(--muted-foreground)] tracking-widest sticky top-0 z-10">
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
                              className="h-11 border border-border/30 bg-[var(--muted)]/50 font-bold focus-visible:ring-2 focus-visible:ring-primary rounded-xl text-[var(--foreground)]"
                            />
                          ) : (
                            <p className="font-bold text-[var(--foreground)] pl-3">
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
                              className="h-11 border border-border/30 bg-[var(--muted)]/50 font-bold text-center rounded-xl text-[var(--foreground)]"
                            />
                          ) : (
                            <p className="font-bold text-[var(--foreground)] text-center">
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
                              className="h-11 border border-border/30 bg-[var(--muted)]/50 font-bold rounded-xl text-[var(--foreground)]"
                            />
                          ) : (
                            <p className="font-bold text-[var(--foreground)] font-mono">
                              Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {item.isEditing ? (
                            <Select
                              value={item.modelName}
                              onValueChange={(value) =>
                                updateItem(item.id, 'modelName', value)
                              }
                            >
                              <SelectTrigger className="w-full" aria-label="Pilih model printer">
                                <SelectValue placeholder="Pilih Model" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="font-bold text-[var(--foreground)] pl-3">
                              {item.modelName || '-'}
                            </p>
                          )}
                        </td>
                        <td className="p-4 text-center pr-8">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => toggleEdit(item.id)}
                              variant={item.isEditing ? 'secondary' : 'ghost'}
                              size="icon"
                              className={cn(
                                'rounded-xl',
                                item.isEditing && 'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)]/90',
                              )}
                              title={
                                item.isEditing ? 'Simpan Baris' : 'Edit Baris'
                              }
                              aria-label={
                                item.isEditing ? 'Simpan baris' : 'Edit baris'
                              }
                            >
                              {item.isEditing ? (
                                <CheckIcon aria-hidden="true" />
                              ) : (
                                <PencilSimpleIcon aria-hidden="true" />
                              )}
                            </Button>

                            <Button
                              onClick={() => removeItem(item.id)}
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-[var(--muted-foreground)] hover:text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]"
                              title="Hapus Baris"
                              aria-label="Hapus baris"
                            >
                              <TrashIcon aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 bg-[var(--muted)]/50 border-t border-border/8 flex flex-col items-end">
                <div className="flex flex-col gap-1 text-right">
                  <p className="text-[10px] font-black uppercase text-[var(--muted-foreground)] tracking-widest">
                    Total Estimasi
                  </p>
                  <h2 className="text-4xl font-bold text-[var(--foreground)] tracking-tighter">
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
