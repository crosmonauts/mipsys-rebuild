import { eq } from 'drizzle-orm';
import { companyProfiles } from '../database/schema/company-profile.schema';
import { extensionForMime } from './excel/image-fit';
import type { ReportCompanyProfile } from './excel/sheet-builder';

/** Nilai cadangan sebelum operator mengisi data perusahaan sebenarnya. */
export const DEFAULT_COMPANY_PROFILE: ReportCompanyProfile = {
  name: 'MiPSys',
  address: 'Jl. Raya Service No. 1',
  phone: '(021) 1234-5678',
  email: '',
  logo: null,
};

type CompanyDb = {
  select: (...args: any[]) => any;
};

export interface CompanyHeader {
  name: string;
  address: string;
  city: string | null;
  phone: string;
  email: string | null;
  /** Logo sebagai base64; null bila belum diunggah atau format tak didukung. */
  logo: { base64: string; mime: string } | null;
}

/**
 * Kop laporan memakai tabel company_profiles — sumber yang sama dengan
 * invoice dan template cetakan. Nilai cadangan hanya dipakai bila tabel
 * belum terisi, sehingga laporan tidak pernah gagal karena data profil.
 */
export async function loadCompanyProfile(
  db: CompanyDb,
): Promise<ReportCompanyProfile> {
  const header = await loadCompanyHeader(db);
  return {
    name: header.name,
    address: header.address,
    phone: header.phone,
    email: header.email ?? '',
    logo: header.logo,
  };
}

/** Profil + logo dalam satu pembacaan, untuk renderer yang butuh keduanya. */
export async function loadCompanyHeader(db: CompanyDb): Promise<CompanyHeader> {
  let row: {
    name: string;
    address: string;
    city: string | null;
    phone: string;
    email: string | null;
    logoData: Buffer | null;
    logoMime: string | null;
  } | null = null;

  try {
    const rows = await db
      .select({
        name: companyProfiles.name,
        address: companyProfiles.address,
        city: companyProfiles.city,
        phone: companyProfiles.phone,
        email: companyProfiles.email,
        logoData: companyProfiles.logoData,
        logoMime: companyProfiles.logoMime,
      })
      .from(companyProfiles)
      .where(eq(companyProfiles.id, 1))
      .limit(1);
    row = rows[0] ?? null;
  } catch {
    row = null;
  }

  if (!row) {
    return {
      name: DEFAULT_COMPANY_PROFILE.name,
      address: DEFAULT_COMPANY_PROFILE.address,
      city: null,
      phone: DEFAULT_COMPANY_PROFILE.phone,
      email: null,
      logo: null,
    };
  }

  const logo =
    row.logoData && row.logoMime && extensionForMime(row.logoMime)
      ? {
          base64: Buffer.from(row.logoData as unknown as Uint8Array).toString(
            'base64',
          ),
          mime: row.logoMime,
        }
      : null;

  return {
    name: row.name,
    address: [row.address, row.city].filter(Boolean).join(', '),
    city: row.city,
    phone: row.phone,
    email: row.email,
    logo,
  };
}
