'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  Package,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/src/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { srApi } from '@/src/features/service-request/api/sr-api';
import { orderPartsApi } from '@/src/features/service-request/api/order-parts-api';
import { OrderPart } from '@/src/features/service-request/api/order-parts-api';

interface DiagnosisModalProps {
  ticketNumber: string;
  serviceRequestId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedPart {
  sparePartId: number;
  partName: string;
  partCode: string;
  price: number;
  stock: number;
  quantity: number;
}

export function DiagnosisModal({
  ticketNumber,
  serviceRequestId,
  isOpen,
  onClose,
  onSuccess,
}: DiagnosisModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [action, setAction] = useState('');
  const [newStatus, setNewStatus] = useState('SERVICE');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingParts, setExistingParts] = useState<OrderPart[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !serviceRequestId) return;
    fetchExistingParts();
  }, [isOpen, serviceRequestId]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounce = setTimeout(() => searchParts(searchQuery), 400);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  function resetForm() {
    setDiagnosis('');
    setAction('');
    setNewStatus('SERVICE');
    setTechnicianNotes('');
    setSelectedParts([]);
    setSearchQuery('');
    setSearchResults([]);
  }

  async function fetchExistingParts() {
    try {
      const data = await orderPartsApi.getBySR(serviceRequestId);
      setExistingParts(Array.isArray(data) ? data : []);
    } catch {
      setExistingParts([]);
    }
  }

  async function searchParts(query: string) {
    setIsSearching(true);
    try {
      const data = await srApi.searchSpareParts(query);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectPart(part: any) {
    const alreadySelected = selectedParts.find((p) => p.sparePartId === part.id);
    if (alreadySelected) {
      toast.error('Part sudah ditambahkan');
      return;
    }

    setSelectedParts([...selectedParts, {
      sparePartId: part.id,
      partName: part.partName,
      partCode: part.partCode,
      price: Number(part.price ?? 0),
      stock: part.stock ?? 0,
      quantity: 1,
    }]);

    setSearchQuery('');
    setSearchResults([]);
  }

  function updatePartQuantity(sparePartId: number, quantity: number) {
    setSelectedParts(selectedParts.map((p) =>
      p.sparePartId === sparePartId ? { ...p, quantity } : p
    ));
  }

  function removeSelectedPart(sparePartId: number) {
    setSelectedParts(selectedParts.filter((p) => p.sparePartId !== sparePartId));
  }

  async function handleSubmit() {
    if (!ticketNumber) return;
    if (!diagnosis.trim()) {
      toast.error('Diagnosis wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await srApi.diagnose(ticketNumber, {
        newStatus,
        problemDescription: diagnosis,
        parts: selectedParts.map((p) => ({
          sparePartId: p.sparePartId,
          quantity: p.quantity,
        })),
        performedBy: 1,
      });

      toast.success(`Status → ${newStatus}. ${selectedParts.length} part ditambahkan.`);
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan diagnosis';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalPartCost = selectedParts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white shadow-lg duration-200 sm:rounded-[2rem] p-0 overflow-hidden">
          <DialogDescription className="sr-only">
            Form diagnosis teknisi untuk service request
          </DialogDescription>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex flex-col h-full text-left"
          >
            <ModalHeader ticketNumber={ticketNumber} onClose={onClose} />

            <div className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
              <DiagnosisInput value={diagnosis} onChange={setDiagnosis} />
              <ActionInput value={action} onChange={setAction} />
              <StatusSelector value={newStatus} onChange={setNewStatus} />
              <PartsSelector
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchResults={searchResults}
                isSearching={isSearching}
                onSelectPart={handleSelectPart}
                selectedParts={selectedParts}
                onUpdateQuantity={updatePartQuantity}
                onRemovePart={removeSelectedPart}
                dropdownRef={dropdownRef}
              />
              <ExistingPartsList parts={existingParts} />
              <NotesInput value={technicianNotes} onChange={setTechnicianNotes} />
            </div>

            <ModalFooter
              isSubmitting={isSubmitting}
              totalPartCost={totalPartCost}
              onClose={onClose}
            />
          </form>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function ModalHeader({
  ticketNumber,
  onClose,
}: {
  ticketNumber: string;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-blue-600 text-white">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Diagnosis Teknisi
            </DialogTitle>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
              Tiket: {ticketNumber}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-all outline-none"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

function DiagnosisInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
        Hasil Diagnosa *
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jelaskan hasil pemeriksaan unit..."
        className="min-h-24 border-2 border-slate-200 rounded-xl focus:border-blue-600"
      />
    </div>
  );
}

function ActionInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
        Tindakan yang Dilakukan *
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Jelaskan tindakan perbaikan..."
        className="min-h-20 border-2 border-slate-200 rounded-xl focus:border-blue-600"
      />
    </div>
  );
}

function StatusSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
        Update Status
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-xl border-2 border-slate-200 bg-transparent px-3 font-bold text-sm outline-none focus:border-blue-600 transition-all appearance-none text-slate-900"
      >
        <option value="CHECK">Mulai Check</option>
        <option value="WAITING_APPROVE">Menunggu Approve</option>
        <option value="SERVICE">Dalam Pengerjaan</option>
        <option value="DONE">Selesai</option>
        <option value="CANCEL">Dibatalkan</option>
      </select>
    </div>
  );
}

function PartsSelector({
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  onSelectPart,
  selectedParts,
  onUpdateQuantity,
  onRemovePart,
  dropdownRef,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  searchResults: any[];
  isSearching: boolean;
  onSelectPart: (part: any) => void;
  selectedParts: SelectedPart[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemovePart: (id: number) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-3" ref={dropdownRef}>
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
        <Package size={14} /> Part yang Diganti
      </label>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari part dari inventory..."
          className="pl-10 h-11 border-2 border-slate-200 rounded-xl"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="max-h-40 overflow-y-auto border-2 border-slate-200 rounded-xl bg-white">
          {searchResults.map((part) => (
            <PartSearchResult
              key={part.id}
              part={part}
              onSelect={onSelectPart}
            />
          ))}
        </div>
      )}

      {isSearching && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="animate-spin" size={14} /> Mencari part...
        </div>
      )}

      {selectedParts.length > 0 && (
        <div className="space-y-2">
          {selectedParts.map((part) => (
            <SelectedPartRow
              key={part.sparePartId}
              part={part}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemovePart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PartSearchResult({
  part,
  onSelect,
}: {
  part: any;
  onSelect: (part: any) => void;
}) {
  const isLowStock = part.stock <= 3;

  return (
    <button
      type="button"
      onClick={() => onSelect(part)}
      className="w-full px-4 py-3 flex justify-between items-center hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
    >
      <div className="text-left">
        <p className="font-bold text-slate-900 text-sm">{part.partName}</p>
        <p className="text-[10px] text-slate-500">{part.partCode}</p>
      </div>
      <div className="text-right">
        <p className="font-black text-blue-800 text-sm">
          Rp {Number(part.price ?? 0).toLocaleString('id-ID')}
        </p>
        <p className={`text-[10px] font-bold ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
          Stok: {part.stock}
        </p>
      </div>
    </button>
  );
}

function SelectedPartRow({
  part,
  onUpdateQuantity,
  onRemove,
}: {
  part: SelectedPart;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  const exceedsStock = part.quantity > part.stock;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${exceedsStock ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm truncate">
          {part.partName}
          {part.stock === 0 && (
            <span className="text-xs text-red-600 font-bold ml-2">EMPTY — akan trigger PO</span>
          )}
          {part.stock <= 3 && part.stock > 0 && (
            <span className="text-xs text-amber-600 font-bold ml-2">Stock menipis</span>
          )}
        </p>
        <p className="text-[10px] text-slate-500">
          Rp {part.price.toLocaleString('id-ID')} × {part.quantity} = Rp {(part.price * part.quantity).toLocaleString('id-ID')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={part.stock}
          value={part.quantity}
          onChange={(e) => onUpdateQuantity(part.sparePartId, parseInt(e.target.value) || 1)}
          className="w-16 h-8 text-center text-sm font-bold border-2 border-slate-200 rounded-lg"
        />
        <span className="text-[10px] text-slate-500">/ {part.stock}</span>
        <button
          type="button"
          onClick={() => onRemove(part.sparePartId)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {exceedsStock && (
        <AlertTriangle size={16} className="text-red-600 shrink-0" />
      )}
    </div>
  );
}

function ExistingPartsList({ parts }: { parts: OrderPart[] }) {
  if (parts.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
        Part Sudah Terpasang
      </label>
      {parts.map((part) => (
        <div
          key={part.id}
          className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border-2 border-emerald-200"
        >
          <div>
            <p className="font-bold text-slate-900 text-sm">{part.partName}</p>
            <p className="text-[10px] text-slate-500">
              {part.partCode} × {part.quantity}
            </p>
          </div>
          <p className="font-black text-emerald-700 text-sm">
            Rp {Number(part.priceAtAction ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
      ))}
    </div>
  );
}

function NotesInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
        Catatan Teknisi
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Catatan tambahan..."
        className="min-h-16 border-2 border-slate-200 rounded-xl focus:border-blue-600"
      />
    </div>
  );
}

function ModalFooter({
  isSubmitting,
  totalPartCost,
  onClose,
}: {
  isSubmitting: boolean;
  totalPartCost: number;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-slate-50 border-t flex flex-col gap-4">
      {totalPartCost > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-slate-400">
            Estimasi Biaya Part
          </span>
          <span className="text-lg font-black text-blue-800">
            Rp {totalPartCost.toLocaleString('id-ID')}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-14 bg-white hover:bg-slate-100 text-slate-400 font-black text-xs uppercase rounded-2xl border-2 border-slate-200 transition-all"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <CheckCircle2 size={18} />
              Simpan Diagnosis
            </>
          )}
        </button>
      </div>
    </div>
  );
}
