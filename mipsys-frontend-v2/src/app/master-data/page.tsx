'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Package,
  Tags,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
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
import { Badge } from '@/src/components/ui/badge';
import ConfirmModal from '@/src/components/ui/confirm-modal';
import { Label } from '@/src/components/ui/label';
import { toast } from 'react-hot-toast';
import { masterDataApi } from '@/src/features/master-data/api/master-data-api';
import type { CustomerData, StaffData, ProductData, CategoryModelData } from '@/src/features/master-data/api/master-data-api';

type TabType = 'customers' | 'staff' | 'products' | 'category-models';

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  id?: number;
}

export default function MasterDataPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categoryModels, setCategoryModels] = useState<CategoryModelData[]>([]);

  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number } | null>(null);

  const tabs = [
    { id: 'customers' as TabType, label: 'Pelanggan', icon: <Users size={16} /> },
    { id: 'staff' as TabType, label: 'Staff', icon: <UserCheck size={16} /> },
    { id: 'products' as TabType, label: 'Produk', icon: <Package size={16} /> },
    { id: 'category-models' as TabType, label: 'Model', icon: <Tags size={16} /> },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s, p, m] = await Promise.all([
        masterDataApi.customers.getAll(),
        masterDataApi.staff.getAll(),
        masterDataApi.products.getAll(),
        masterDataApi.categoryModels.getAll(),
      ]);
      setCustomers(c);
      setStaff(s);
      setProducts(p);
      setCategoryModels(m);
    } catch {
      toast.error('Gagal memuat data master');
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const openCreate = () => {
    setFormData({});
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (data: Record<string, any>) => {
    setFormData(data);
    setModal({ open: true, mode: 'edit', id: data.id });
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'create' });
    setFormData({});
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (activeTab === 'customers') {
        if (modal.mode === 'create') {
          await masterDataApi.customers.create(formData as any);
        } else {
          await masterDataApi.customers.update(modal.id!, formData as any);
        }
      } else if (activeTab === 'staff') {
        if (modal.mode === 'create') {
          await masterDataApi.staff.create(formData as any);
        } else {
          await masterDataApi.staff.update(modal.id!, formData as any);
        }
      } else if (activeTab === 'products') {
        if (modal.mode === 'create') {
          await masterDataApi.products.create(formData as any);
        } else {
          await masterDataApi.products.update(modal.id!, formData as any);
        }
      } else if (activeTab === 'category-models') {
        if (modal.mode === 'create') {
          await masterDataApi.categoryModels.create(formData as any);
        } else {
          await masterDataApi.categoryModels.update(modal.id!, formData as any);
        }
      }
      closeModal();
      fetchData();
    } catch {
      toast.error('Gagal menyimpan data');
    }
    setSubmitting(false);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ id });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      if (activeTab === 'customers') await masterDataApi.customers.delete(confirmDelete.id);
      else if (activeTab === 'staff') await masterDataApi.staff.delete(confirmDelete.id);
      else if (activeTab === 'products') await masterDataApi.products.delete(confirmDelete.id);
      else if (activeTab === 'category-models') await masterDataApi.categoryModels.delete(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)
  );
  const filteredStaff = staff.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = products.filter(
    (p) => p.modelName.toLowerCase().includes(searchTerm.toLowerCase()) || p.serialNumber.includes(searchTerm)
  );
  const filteredModels = categoryModels.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderModalFields = () => {
    if (activeTab === 'customers') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Nama</Label>
            <Input id="customer-name" placeholder="Nama" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone">Telepon</Label>
            <Input id="customer-phone" placeholder="Telepon" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-address">Alamat</Label>
            <Input id="customer-address" placeholder="Alamat" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-type">Tipe</Label>
            <select id="customer-type" value={formData.customerType || ''} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
              <option value="">Pilih Tipe</option>
              <option value="PERSONAL">Personal</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
        </div>
      );
    }
    if (activeTab === 'staff') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">Nama</Label>
            <Input id="staff-name" placeholder="Nama" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-role">Role</Label>
            <select id="staff-role" value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
              <option value="">Pilih Role</option>
              <option value="ADMIN">Admin</option>
              <option value="TECHNICIAN">Teknisi</option>
            </select>
          </div>
        </div>
      );
    }
    if (activeTab === 'products') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-model">Nama Model</Label>
            <Input id="product-model" placeholder="Nama Model" value={formData.modelName || ''} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-serial">Serial Number</Label>
            <Input id="product-serial" placeholder="Serial Number" value={formData.serialNumber || ''} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
        </div>
      );
    }
    if (activeTab === 'category-models') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="model-name">Nama Model</Label>
            <Input id="model-name" placeholder="Nama Model" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model-desc">Deskripsi (opsional)</Label>
            <Input id="model-desc" placeholder="Deskripsi (opsional)" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTable = () => {
    if (activeTab === 'customers') {
      return (
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <tr>
              <th className="p-5 pl-8">Nama</th>
              <th className="p-5">Telepon</th>
              <th className="p-5">Alamat</th>
              <th className="p-5 text-center">Tipe</th>
              <th className="p-5 text-center pr-8">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-5 pl-8 font-bold text-foreground">{c.name}</td>
                <td className="p-5 text-muted-foreground font-medium">{c.phone || '-'}</td>
                <td className="p-5 text-sm text-muted-foreground">{c.address || '-'}</td>
                <td className="p-5 text-center">
                  <Badge className={c.customerType === 'CORPORATE' ? 'bg-primary/10 text-primary border-none font-black text-[9px]' : 'bg-muted/50 text-muted-foreground border-none font-black text-[9px]'}>
                    {c.customerType || '-'}
                  </Badge>
                </td>
                <td className="p-5 text-center pr-8">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(c)} aria-label="Edit" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} aria-label="Hapus" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'staff') {
      return (
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <tr>
              <th className="p-5 pl-8">Nama</th>
              <th className="p-5">Role</th>
              <th className="p-5 text-center pr-8">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {filteredStaff.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-5 pl-8 font-bold text-foreground">{s.name}</td>
                <td className="p-5 text-muted-foreground font-medium">
                  <Badge className={s.role === 'ADMIN' ? 'bg-primary/10 text-primary border-none font-black text-[9px]' : 'bg-amber-100/20 text-amber-400 border-none font-black text-[9px]'}>
                    {s.role === 'ADMIN' ? 'Admin' : 'Teknisi'}
                  </Badge>
                </td>
                <td className="p-5 text-center pr-8">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(s)} aria-label="Edit" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(s.id)} aria-label="Hapus" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'products') {
      return (
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <tr>
              <th className="p-5 pl-8">Nama Model</th>
              <th className="p-5">Serial Number</th>
              <th className="p-5 text-center pr-8">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-5 pl-8 font-bold text-foreground">{p.modelName}</td>
                <td className="p-5 text-muted-foreground font-medium">{p.serialNumber}</td>
                <td className="p-5 text-center pr-8">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(p)} aria-label="Edit" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} aria-label="Hapus" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (activeTab === 'category-models') {
      return (
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 border-b border-border/10 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <tr>
              <th className="p-5 pl-8">Nama Model</th>
              <th className="p-5">Deskripsi</th>
              <th className="p-5 text-center pr-8">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {filteredModels.map((m) => (
              <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-5 pl-8 font-bold text-foreground">{m.name}</td>
                <td className="p-5 text-sm text-muted-foreground">{m.description || '-'}</td>
                <td className="p-5 text-center pr-8">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(m)} aria-label="Edit" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(m.id)} aria-label="Hapus" className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  if (!mounted) return null;

  return (
    <main className="planner-bg min-h-screen">
    <div className="max-w-[1500px] mx-auto px-4 py-8 lg:py-12 space-y-8 animate-in fade-in duration-700 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase">
            Master <span className="text-primary">Database</span>
          </h1>
          <p className="text-sm text-muted-foreground font-bold italic">
            &ldquo;Manajemen data master pelanggan, staff, produk, dan model.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex gap-2 bg-card p-2 rounded-2xl border border-border/20 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground" size={18} />
          <Input
            placeholder={`Cari ${activeTab === 'customers' ? 'pelanggan' : activeTab === 'staff' ? 'staff' : activeTab === 'products' ? 'produk' : 'model'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border border-border/20 rounded-xl font-bold focus:border-primary text-foreground bg-card"
          />
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 py-6 rounded-xl shadow-lg flex gap-2 uppercase text-xs tracking-widest">
          <Plus size={16} strokeWidth={3} /> Tambah Data
        </Button>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card">
        <CardHeader className="bg-card text-foreground p-6 border-b border-border/20">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            {tabs.find((t) => t.id === activeTab)?.icon}
            Data {tabs.find((t) => t.id === activeTab)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">{renderTable()}</div>
          )}
          <div className="p-8 text-center bg-muted/30">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
              Data master untuk referensi sistem
            </p>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        open={!!confirmDelete}
        message="Data yang dihapus tidak bisa dikembalikan."
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />

      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-border/20">
            <div className="bg-card text-foreground p-6 flex justify-between items-center border-b border-border/20">
              <h2 className="text-xs font-black uppercase tracking-widest">
                {modal.mode === 'create' ? 'Tambah' : 'Edit'} {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {renderModalFields()}
              <div className="flex gap-3 pt-2">
                <Button onClick={closeModal} variant="outline" className="flex-1 h-12 rounded-xl border-2 font-black text-xs uppercase tracking-widest">
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest border-none disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}
