'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Check, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import {
  companyProfileApi,
  type CompanyProfile,
  type UpdateCompanyProfileInput,
} from '../api/company-profile-api';
import { extractApiError } from '@/src/lib/api-error';
import { invalidatePrintCompanyCache } from '@/src/lib/use-print-company';

const MAX_LOGO_MB = 1;
// Hanya png/jpeg: webp tidak bisa dirender di XLSX (ExcelJS).
const ACCEPTED = ['image/png', 'image/jpeg'];

interface CompanyProfilePanelProps {
  profile: CompanyProfile | null;
  canEdit: boolean;
  onSaved: () => void | Promise<void>;
}

export function CompanyProfilePanel({
  profile,
  canEdit,
  onSaved,
}: CompanyProfilePanelProps) {
  const [form, setForm] = useState<UpdateCompanyProfileInput>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    npwp: '',
    isPkp: false,
  });
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? '',
      address: profile.address ?? '',
      city: profile.city ?? '',
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      npwp: profile.npwp ?? '',
      isPkp: profile.isPkp,
    });
  }, [profile]);

  useEffect(() => {
    let revoked: string | null = null;
    if (!profile?.hasLogo) {
      setLogoUrl(null);
      return;
    }
    companyProfileApi
      .fetchLogo()
      .then((url) => {
        if (url) {
          revoked = url;
          setLogoUrl(url);
        }
      })
      .catch(() => setLogoUrl(null));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [profile?.hasLogo, profile?.logoSize, profile?.logoMime]);

  function set<K extends keyof UpdateCompanyProfileInput>(
    key: K,
    value: UpdateCompanyProfileInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await companyProfileApi.update(form);
      invalidatePrintCompanyCache();
      toast.success('Profil perusahaan disimpan');
      await onSaved();
    } catch (error) {
      toast.error(extractApiError(error, 'Gagal menyimpan profil perusahaan'));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(`Format logo harus ${ACCEPTED.join(', ')}`);
      return;
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast.error(`Ukuran logo maksimal ${MAX_LOGO_MB} MB`);
      return;
    }
    setLogoBusy(true);
    try {
      await companyProfileApi.uploadLogo(file);
      invalidatePrintCompanyCache();
      toast.success('Logo diperbarui');
      await onSaved();
    } catch (error) {
      toast.error(extractApiError(error, 'Gagal mengunggah logo'));
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleRemoveLogo() {
    setLogoBusy(true);
    try {
      await companyProfileApi.removeLogo();
      setLogoUrl(null);
      toast.success('Logo dihapus');
      await onSaved();
    } catch (error) {
      toast.error(extractApiError(error, 'Gagal menghapus logo'));
    } finally {
      setLogoBusy(false);
    }
  }

  const disabled = !canEdit;

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-8 space-y-6 border border-border/20">
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)] flex items-center gap-2">
          <Building2 size={16} aria-hidden="true" /> Identitas Perusahaan
        </h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Data ini tercetak pada kop invoice, surat penawaran, dan semua
          laporan. Hanya Super Admin yang dapat mengubah.
        </p>
        {profile?.isDefault && (
          <p className="text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/40 rounded-xl px-3 py-2">
            Masih memakai data bawaan. Isi data perusahaan sebenarnya sebelum
            go-live.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-name">Nama Perusahaan *</Label>
            <Input
              id="cp-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              disabled={disabled}
              className="h-11 rounded-xl border-2 font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-address">Alamat *</Label>
            <Input
              id="cp-address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              disabled={disabled}
              className="h-11 rounded-xl border-2 font-bold"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-city">Kota</Label>
              <Input
                id="cp-city"
                value={form.city ?? ''}
                onChange={(e) => set('city', e.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-phone">Telepon *</Label>
              <Input
                id="cp-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl border-2 font-bold"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cp-email">Email</Label>
              <Input
                id="cp-email"
                type="email"
                value={form.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-npwp">NPWP</Label>
              <Input
                id="cp-npwp"
                inputMode="numeric"
                placeholder="15 atau 16 digit"
                value={form.npwp ?? ''}
                onChange={(e) => set('npwp', e.target.value)}
                disabled={disabled}
                className="h-11 rounded-xl border-2 font-bold"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={form.isPkp ?? false}
              onChange={(e) => set('isPkp', e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Perusahaan PKP (wajib faktur pajak)
          </label>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/40 bg-[var(--muted)]/20">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo perusahaan"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Building2 size={28} className="text-[var(--muted-foreground)]" aria-hidden="true" />
                )}
              </div>
              <div className="space-y-2">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--primary)]/40 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 ${
                    disabled ? 'pointer-events-none opacity-40' : ''
                  }`}
                >
                  {logoBusy ? (
                    <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload size={14} aria-hidden="true" />
                  )}
                  {logoUrl ? 'Ganti Logo' : 'Unggah Logo'}
                  <input
                    type="file"
                    accept={ACCEPTED.join(',')}
                    className="sr-only"
                    disabled={disabled}
                    onChange={(e) => {
                      void handleLogoChange(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
                {logoUrl && !disabled && (
                  <Button
                    onClick={handleRemoveLogo}
                    variant="ghost"
                    className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--destructive)]"
                  >
                    <Trash2 size={13} aria-hidden="true" /> Hapus Logo
                  </Button>
                )}
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  PNG/JPG, maks {MAX_LOGO_MB} MB.
                </p>
              </div>
            </div>
          </div>

          <div className="paper-card rounded-2xl p-4 border border-border/20 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">
              Pratinjau Kop
            </p>
            <p className="text-sm font-black text-[var(--foreground)]">
              {form.name || 'Nama Perusahaan'}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {[form.address, form.city].filter(Boolean).join(', ') || 'Alamat'}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {[form.phone, form.email].filter(Boolean).join(' | ') || 'Telepon'}
            </p>
            {form.npwp && (
              <p className="text-[10px] text-[var(--muted-foreground)]">
                NPWP {form.npwp} {form.isPkp ? '(PKP)' : '(Non PKP)'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canEdit ? (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-12 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 font-black text-xs uppercase tracking-widest px-8 border-none"
          >
            {saving ? (
              <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Check size={16} aria-hidden="true" />
            )}
            Simpan Profil
          </Button>
        ) : (
          <p className="text-xs font-bold text-[var(--muted-foreground)]">
            Hanya Super Admin yang dapat mengubah data ini.
          </p>
        )}
      </div>
    </div>
  );
}
