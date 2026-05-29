import React, { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trash2, PackagePlus, Info, AlertTriangle } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { srApi } from '../../features/service-request/api/sr-api';

interface PartItemRowProps {
  index: number;
  onRemove: () => void;
}

export const PartItemRow = React.memo(function PartItemRow({ index, onRemove }: PartItemRowProps) {
  const { register, setValue, watch } = useFormContext();
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Pantau nilai form
  const partNameValue = watch(`parts.${index}.partName`) || '';
  const sparePartId = watch(`parts.${index}.sparePartId`);
  const currentQty = watch(`parts.${index}.quantity`) || 0;
  const availableStock = watch(`parts.${index}.stock`) || 0;

  // Logika Validasi
  const isStockInsufficient = sparePartId && currentQty > availableStock;
  const showNewPartForm =
    !sparePartId &&
    partNameValue.length > 2 &&
    (!isOpen || results.length === 0);

  // Search Sparepart (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (partNameValue.length > 2 && !sparePartId) {
        setIsLoading(true);
        try {
          const data = await srApi.searchSpareParts(partNameValue);
          setResults(data);
          setIsOpen(true);
        } finally {
          setIsLoading(false);
        }
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [partNameValue, sparePartId]);

  const handleSelect = (part: any) => {
    setValue(`parts.${index}.sparePartId`, part.id);
    setValue(`parts.${index}.partName`, part.partName);
    setValue(`parts.${index}.partCode`, part.partCode);
    setValue(`parts.${index}.stock`, part.stock);
    setValue(`parts.${index}.unitPrice`, String(part.price || '0'));
    setIsOpen(false);
  };

  return (
    <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 mb-6 transition-all hover:border-primary/30 shadow-sm">
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-6 relative" ref={dropdownRef}>
          <Label className="text-xs font-extrabold text-foreground/80 uppercase mb-3 block">
            Nama Suku Cadang
          </Label>
          <Input
            {...register(`parts.${index}.partName`)}
            className="h-14 bg-muted/30 rounded-2xl px-6 font-bold text-foreground border-none shadow-inner"
            placeholder="Ketik nama part..."
          />
          {isOpen && results.length > 0 && (
            <ul className="absolute z-[100] w-full mt-2 bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden py-2 animate-in slide-in-from-top-2">
              {results.map((part) => (
                <li
                  key={part.id}
                  onClick={() => handleSelect(part)}
                  className="px-6 py-4 cursor-pointer hover:bg-primary/10 flex justify-between items-center transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-extrabold text-foreground">
                      {part.partName}
                    </span>
                    <span className="text-[10px] font-black text-primary">
                      Stok: {part.stock}
                    </span>
                  </div>
                  <span className="font-black text-foreground/80">
                    Rp{Number(part.price).toLocaleString('id-ID')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-span-2">
          <Label
            className={`text-xs font-extrabold uppercase mb-3 block text-center ${isStockInsufficient ? 'text-destructive' : 'text-foreground/80'}`}
          >
            {isStockInsufficient ? 'Kurang' : 'Jumlah'}
          </Label>
          <Input
            type="number"
            {...register(`parts.${index}.quantity`, { valueAsNumber: true })}
            className={`h-14 rounded-2xl text-center font-black text-lg transition-all ${
              isStockInsufficient
                ? 'bg-destructive/10 text-destructive ring-2 ring-destructive'
                : 'bg-muted/30'
            }`}
          />
        </div>

        <div className="col-span-3">
          <Label className="text-xs font-extrabold text-foreground/80 uppercase mb-3 block">
            Harga Satuan
          </Label>
          <Input
            {...register(`parts.${index}.unitPrice`)}
            className="h-14 bg-muted/30 rounded-2xl px-6 font-black text-primary text-lg border-none"
          />
        </div>

        <div className="col-span-1 pt-8 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onRemove}
            className="text-destructive/70 hover:text-destructive h-14 w-14"
            aria-label="Hapus part"
          >
            <Trash2 size={24} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {showNewPartForm && (
        <div className="mt-6 grid grid-cols-2 gap-4 p-6 bg-amber-500/10 rounded-3xl border-2 border-dashed border-amber-500/30 animate-in zoom-in-95">
          <div className="col-span-2 flex items-center gap-2">
            <PackagePlus size={18} className="text-amber-400" aria-hidden="true" />
            <p className="text-[10px] font-black text-amber-300 uppercase">
              Part Baru - Lengkapi Data
            </p>
          </div>
          <Input
            {...register(`parts.${index}.partCode`)}
            placeholder="Kode Part *"
            className="bg-background"
          />
          <Input
            {...register(`parts.${index}.modelName`)}
            placeholder="Model Mesin"
            className="bg-background"
          />
        </div>
      )}
    </div>
  );
});
