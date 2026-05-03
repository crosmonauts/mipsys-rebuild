import { useFormContext } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Trash2, PackagePlus, AlertCircle, Info } from 'lucide-react';
import { srApi } from '../services/sr-api';

interface PartItemRowProps {
  index: number;
  onRemove: () => void;
}

export function PartItemRow({ index, onRemove }: PartItemRowProps) {
  // 1. AREA LOGIKA (DAPUR)
  const { register, setValue, watch } = useFormContext();

  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pantau nilai input secara real-time dari form state
  const partNameValue = watch(`parts.${index}.partName`) || '';
  const sparePartId = watch(`parts.${index}.sparePartId`);

  // Menentukan kapan form "Tambah Part Baru" (kuning) muncul
  const showNewPartForm =
    !sparePartId &&
    partNameValue.length > 2 &&
    (!isOpen || results.length === 0);

  // Debounced Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (partNameValue.length > 2 && !sparePartId) {
        setIsLoading(true);
        try {
          const data = await srApi.searchSpareParts(partNameValue);
          setResults(data);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [partNameValue, sparePartId]);

  // Handler saat item dari dropdown dipilih
  const handleSelect = (part: any) => {
    setValue(`parts.${index}.sparePartId`, part.id);
    setValue(`parts.${index}.partName`, part.partName);
    setValue(`parts.${index}.partCode`, part.partCode);
    setValue(`parts.${index}.modelName`, part.modelName || '');
    setValue(`parts.${index}.block`, part.block || '');
    setValue(`parts.${index}.refNo`, part.refNo || '');

    // Decimal di DB MySQL harus dikirim sebagai string agar presisi
    setValue(`parts.${index}.unitPrice`, String(part.price || '0'));

    setIsOpen(false);
  };

  // Close dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. AREA TAMPILAN (MEJA MAKAN)
  return (
    <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6 relative animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-6 items-end">
        {/* INPUT NAMA BARANG & SEARCH */}
        <div className="col-span-6 relative" ref={dropdownRef}>
          <Label className="text-[12px] font-extrabold uppercase text-slate-800 tracking-wider mb-3 block">
            Nama Barang <span className="text-red-700">*</span>
          </Label>
          <div className="relative">
            <Input
              {...register(`parts.${index}.partName`)}
              placeholder="Ketik nama sparepart..."
              className="h-14 rounded-2xl border-2 border-slate-300 focus:border-blue-700 font-bold text-slate-900 pr-10"
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            )}
          </div>

          {/* DROPDOWN HASIL PENCARIAN */}
          {isOpen && results.length > 0 && (
            <ul className="absolute z-[100] w-full mt-2 bg-white rounded-[1.5rem] shadow-2xl border-2 border-slate-100 overflow-hidden py-3 animate-in slide-in-from-top-2">
              {results.map((part) => (
                <li
                  key={part.id}
                  onClick={() => handleSelect(part)}
                  className="px-6 py-4 cursor-pointer flex justify-between items-center hover:bg-blue-50 transition-all border-b border-slate-50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="font-extrabold text-[15px] text-slate-900">
                      {part.partName}
                    </span>
                    <div className="flex gap-3 items-center mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Code: {part.partCode}
                      </span>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        Stok: {part.stock}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-xl">
                    Rp{Number(part.price || 0).toLocaleString('id-ID')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* KOLOM JUMLAH */}
        <div className="col-span-2">
          <Label className="text-[11px] font-extrabold text-slate-800 uppercase mb-3 block text-center">
            Jumlah
          </Label>
          <Input
            type="number"
            {...register(`parts.${index}.quantity`, { valueAsNumber: true })}
            className="h-14 bg-slate-50 rounded-2xl text-center font-black text-lg text-slate-900 border-none shadow-inner"
          />
        </div>

        {/* KOLOM HARGA SATUAN */}
        <div className="col-span-3">
          <Label className="text-[11px] font-extrabold text-slate-800 uppercase mb-3 block">
            Harga Satuan
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-800">
              IDR
            </span>
            <Input
              {...register(`parts.${index}.unitPrice`)}
              className="h-14 bg-slate-50 rounded-2xl pl-12 font-black text-blue-800 text-lg border-none shadow-inner"
            />
          </div>
        </div>

        {/* TOMBOL HAPUS BARIS */}
        <div className="col-span-1 pb-1 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
            className="h-14 w-14 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-colors"
          >
            <Trash2 size={24} />
          </Button>
        </div>
      </div>

      {/* FORM PENDAFTARAN OTOMATIS (Mencegah Kolom NULL di DB) */}
      {showNewPartForm && (
        <div className="grid grid-cols-2 gap-5 p-6 bg-amber-50 rounded-[2rem] border-2 border-dashed border-amber-300 animate-in zoom-in-95 duration-300">
          <div className="col-span-2 flex items-center gap-2 mb-1">
            <PackagePlus size={18} className="text-amber-800" />
            <p className="text-[11px] font-black text-amber-900 uppercase tracking-widest">
              Suku Cadang Baru Terdeteksi - Lengkapi Data Inventaris
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-amber-900 uppercase flex items-center gap-1">
              Part Code <span className="text-red-600">*</span>
            </Label>
            <Input
              {...register(`parts.${index}.partCode`)}
              placeholder="Contoh: MB-L321-NEW"
              className="h-11 bg-white border-amber-200 focus:border-amber-500 font-bold placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-amber-900 uppercase">
              Model Name
            </Label>
            <Input
              {...register(`parts.${index}.modelName`)}
              placeholder="Contoh: EPSON L3210"
              className="h-11 bg-white border-amber-200 focus:border-amber-500 font-bold placeholder:font-normal"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-amber-900 uppercase">
              Block / Category
            </Label>
            <Input
              {...register(`parts.${index}.block`)}
              placeholder="Contoh: Electronic Parts"
              className="h-11 bg-white border-amber-200 focus:border-amber-500 font-bold placeholder:font-normal"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-extrabold text-amber-900 uppercase">
              Ref No
            </Label>
            <Input
              {...register(`parts.${index}.refNo`)}
              placeholder="Contoh: 516"
              className="h-11 bg-white border-amber-200 focus:border-amber-500 font-bold placeholder:font-normal"
            />
          </div>

          <div className="col-span-2 mt-2 py-2 px-4 bg-amber-100/50 rounded-xl flex items-center gap-3">
            <Info size={14} className="text-amber-800 shrink-0" />
            <p className="text-[10px] font-medium text-amber-900 italic">
              Data ini akan didaftarkan sebagai suku cadang baru di database
              pusat Mipsys saat Anda menyimpan perubahan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
