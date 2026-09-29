'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
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
  sparePartId?: number;
  partName: string;
  modelName: string;
  qty: number;
  price: number;
  stock?: number;
  isEditing: boolean;
}

interface MasterPartOption {
  id: number;
  partCode: string;
  partName: string;
  stock: number;
  minStock: number;
  price: number;
  modelName?: string;
  isUniversal?: boolean;
  compatibleModels?: string[];
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
  const [supplierCustom, setSupplierCustom] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', partName: '', modelName: '', qty: 1, price: 0, isEditing: true },
  ]);
  const [partSearch, setPartSearch] = useState<Record<string, MasterPartOption[]>>({});
  const [searchingRowId, setSearchingRowId] = useState<string | null>(null);
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
          setSupplierCustom(
            !!po.supplierName && po.supplierName.trim().toUpperCase() !== 'EPSON'
          );
          setItems(
            po.items?.map((item, i) => ({
              id: String(item.id || i),
              sparePartId: item.sparePartId,
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
    return () => {
      Object.values(searchTimers.current).forEach(clearTimeout);
    };
  }, [isEditMode, editId]);

  const normalizeName = (v: string) => v.trim().toLowerCase();

  const isDuplicatePart = (candidate: { sparePartId?: number; partName: string; modelName: string }, excludeId?: string) =>
    items.some((it) => {
      if (it.id === excludeId) return false;
      if (candidate.sparePartId && it.sparePartId) return it.sparePartId === candidate.sparePartId;
      return (
        normalizeName(it.partName) === normalizeName(candidate.partName) &&
        normalizeName(it.modelName || '') === normalizeName(candidate.modelName || '')
      );
    });

  const handlePartSearch = (rowId: string, query: string) => {
    updateItem(rowId, 'partName', query);
    updateItem(rowId, 'sparePartId', undefined as unknown as number);
    if (searchTimers.current[rowId]) clearTimeout(searchTimers.current[rowId]);
    if (query.trim().length < 2) {
      setPartSearch((prev) => ({ ...prev, [rowId]: [] }));
      setSearchingRowId(null);
      return;
    }
    setSearchingRowId(rowId);
    searchTimers.current[rowId] = setTimeout(async () => {
      try {
        const results = await inventoryApi.searchParts(query.trim());
        const filtered = (Array.isArray(results) ? results : []).filter(
          (p: any) =>
            !items.some(
              (it) => it.id !== rowId && it.sparePartId && it.sparePartId === p.id,
            ),
        ) as unknown as MasterPartOption[];
        setPartSearch((prev) => ({ ...prev, [rowId]: filtered }));
      } catch {
        setPartSearch((prev) => ({ ...prev, [rowId]: [] }));
      } finally {
        setSearchingRowId(null);
      }
    }, 400);
  };

  const handleSelectMasterPart = (rowId: string, part: MasterPartOption) => {
    if (
      items.some((it) => it.id !== rowId && it.sparePartId && it.sparePartId === part.id)
    ) {
      toast.error('Part sudah ada di PO, qty akan digabung saat simpan.');
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.id === rowId
          ? {
              ...it,
              sparePartId: part.id,
              partName: part.partName,
              modelName:
                part.compatibleModels?.[0] || part.modelName || it.modelName,
              price: Number(part.price ?? 0),
              stock: part.stock,
            }
          : it,
      ),
    );
    setPartSearch((prev) => ({ ...prev, [rowId]: [] }));
  };

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
    value: string | number | undefined,
  ) => {
    setItems((prev) =>
      prev.map((item) =>
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
    if (!supplier.trim()) errs.push('Nama supplier wajib diisi.');
    const seen = new Set<string>();
    for (const item of items) {
      if (!item.partName.trim())
        errs.push('Setiap item harus memiliki nama part.');
      if (item.qty < 1) errs.push('Qty minimal 1.');
      if (item.price < 1) errs.push('Harga minimal Rp 1.');
      const key = item.sparePartId
        ? `sp:${item.sparePartId}`
        : `name:${normalizeName(item.partName)}|${normalizeName(item.modelName || '')}`;
      if (seen.has(key)) errs.push(`Duplikat part: ${item.partName || '(tanpa nama)'}. Gabung qty dalam satu baris.`);
      seen.add(key);
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
        sparePartId: item.sparePartId,
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
                <Select
                  value={supplierCustom ? 'LAINNYA' : 'EPSON'}
                  onValueChange={(value) => {
                    if (value === 'LAINNYA') {
                      setSupplierCustom(true);
                      setSupplier('');
                    } else {
                      setSupplierCustom(false);
                      setSupplier('EPSON');
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl border border-border/15 bg-[var(--muted)]/50 font-bold" aria-label="Pilih supplier">
                    <SelectValue placeholder="Pilih Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EPSON">EPSON</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya (input manual)</SelectItem>
                  </SelectContent>
                </Select>
                {supplierCustom && (
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Nama supplier lain"
                    className="rounded-xl border border-border/15 h-12 font-bold focus:border-primary transition-all text-[var(--foreground)] bg-[var(--muted)]/50"
                  />
                )}
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
                            <div className="relative">
                              <Input
                                value={item.partName}
                                onChange={(e) =>
                                  handlePartSearch(item.id, e.target.value)
                                }
                                placeholder="Ketik min. 2 huruf / pilih dari master..."
                                className="h-11 border border-border/30 bg-[var(--muted)]/50 font-bold focus-visible:ring-2 focus-visible:ring-primary rounded-xl text-[var(--foreground)]"
                              />
                              {item.sparePartId ? (
                                <p className="mt-1 text-[10px] font-bold text-[var(--accent)]">
                                  Dari master #{item.sparePartId}
                                  {typeof item.stock === 'number' ? ` • Stok: ${item.stock}` : ''}
                                </p>
                              ) : (
                                item.partName.trim().length >= 2 && (
                                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                                    Tidak ketemu? Akan disimpan sebagai part baru (manual fallback).
                                  </p>
                                )
                              )}
                              {searchingRowId === item.id && (
                                <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">Mencari master...</p>
                              )}
                              {(partSearch[item.id]?.length ?? 0) > 0 && (
                                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border/30 bg-[var(--card)] shadow-xl">
                                  {partSearch[item.id].map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => handleSelectMasterPart(item.id, p)}
                                      className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-[var(--primary)]/10"
                                    >
                                      <span>
                                        <span className="block text-sm font-bold text-[var(--foreground)]">{p.partName}</span>
                                        <span className="block text-[10px] text-[var(--muted-foreground)]">
                                          {p.partCode} • {p.modelName || '-'} • Stok: {p.stock}
                                          {p.isUniversal
                                            ? ' • Universal'
                                            : (p.compatibleModels ?? []).length > 0
                                              ? ` • ${(p.compatibleModels ?? []).join(', ')}`
                                              : ''}
                                        </span>
                                      </span>
                                      <span className="text-sm font-black text-[var(--primary)]">
                                        Rp {Number(p.price ?? 0).toLocaleString('id-ID')}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="font-bold text-[var(--foreground)] pl-3">
                              {item.partName || '-'}
                              {item.sparePartId ? (
                                <span className="ml-2 rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--accent)]">
                                  Master
                                </span>
                              ) : (
                                <span className="ml-2 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-500">
                                  Baru
                                </span>
                              )}
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
