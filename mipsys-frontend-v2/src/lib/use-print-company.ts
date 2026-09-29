'use client';

import { useEffect, useState } from 'react';
import { companyProfileApi } from '@/src/features/master-data/api/company-profile-api';

export interface PrintCompany {
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  /** Object URL logo, null bila perusahaan belum mengunggah logo. */
  logoUrl?: string | null;
}

/**
 * Identitas perusahaan untuk template cetakan. Dimuat sekali lalu
 * disimpan di cache modul agar tidak diambil ulang tiap buka dialog.
 */
let cached: PrintCompany | null = null;
let inflight: Promise<PrintCompany> | null = null;

const FALLBACK: PrintCompany = {
  name: 'MiPSys',
  address: 'Jl. Raya Service No. 1',
  phone: '(021) 1234-5678',
  logoUrl: null,
};

export function usePrintCompany(): PrintCompany | null {
  const [company, setCompany] = useState<PrintCompany | null>(cached);

  useEffect(() => {
    let active = true;
    if (cached) return;
    if (!inflight) {
      inflight = companyProfileApi
        .get()
        .then((profile) => {
          const value: PrintCompany = {
            name: profile.name,
            address: [profile.address, profile.city].filter(Boolean).join(', '),
            phone: [profile.phone, profile.email].filter(Boolean).join(' | '),
            email: profile.email,
          };
          cached = value;
          return value;
        })
        .catch(() => FALLBACK)
        .finally(() => {
          inflight = null;
        });
    }
    inflight
      .then((value) => {
        if (active) setCompany(value);
      })
      .catch(() => {
        if (active) setCompany(FALLBACK);
      });
    return () => {
      active = false;
    };
  }, []);

  return company;
}

/** Dipanggil setelah profil diperbarui agar cetakan berikutnya memakai data baru. */
export function invalidatePrintCompanyCache(): void {
  cached = null;
}
