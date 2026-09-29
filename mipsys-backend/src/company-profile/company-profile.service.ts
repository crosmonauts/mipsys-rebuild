import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  ALLOWED_LOGO_MIME,
  MAX_LOGO_BYTES,
  companyProfiles,
} from '../database/schema/company-profile.schema';

/** company_profiles selalu satu baris. */
export const SINGLETON_ID = 1;

export { ALLOWED_LOGO_MIME, MAX_LOGO_BYTES };

export interface CompanyProfileDefault {
  name: string;
  address: string;
  city: string | null;
  phone: string;
  email: string | null;
  npwp: string | null;
  isPkp: boolean;
}

export const DEFAULT_COMPANY: CompanyProfileDefault = {
  name: 'MiPSys',
  address: 'Jl. Raya Service No. 1',
  city: null,
  phone: '(021) 1234-5678',
  email: null,
  npwp: null,
  isPkp: false,
};

export interface CompanyProfileView extends CompanyProfileDefault {
  hasLogo: boolean;
  logoMime: string | null;
  logoSize: number | null;
  updatedAt: Date | null;
  isDefault: boolean;
}

export interface UpdateCompanyProfileDto {
  name: string;
  address: string;
  city?: string;
  phone: string;
  email?: string;
  npwp?: string;
  isPkp?: boolean;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NPWP_LENGTHS = [15, 16];

/**
 * Membersihkan NPWP ke bentuk digit polos. NPWP resmi berbentuk 15 digit
 * (perorangan) atau 16 digit (badan usaha), dan sering ditulis dengan
 * titik/tanda hubung pada dokumen.
 *
 * Hanya pemisah yang dibuang. Huruf atau karakter lain ditolak, bukan
 * dibuang — bila dibuang, "123456789012345X" akan lolos sebagai NPWP
 * 15 digit yang sah padahal salah ketik.
 */
export function normalizeNpwp(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  const digits = raw.replace(/[.\-\s]/g, '');
  if (!digits) return null;
  if (!/^\d+$/.test(digits) || !NPWP_LENGTHS.includes(digits.length)) {
    throw new BadRequestException(
      'NPWP harus terdiri dari 15 digit (perorangan) atau 16 digit (badan usaha), hanya angka.',
    );
  }
  return digits;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class CompanyProfileService {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
  ) {}

  private async loadRow() {
    const rows = await this.db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.id, SINGLETON_ID))
      .limit(1);
    return rows[0] ?? null;
  }

  private toView(row: typeof companyProfiles.$inferSelect): CompanyProfileView {
    const hasLogo = Boolean(row.logoData);
    return {
      name: row.name,
      address: row.address,
      city: row.city ?? null,
      phone: row.phone,
      email: row.email ?? null,
      npwp: row.npwp ?? null,
      isPkp: row.isPkp,
      hasLogo,
      logoMime: row.logoMime ?? null,
      logoSize: row.logoSize ?? null,
      updatedAt: row.updatedAt ?? null,
      // Menandai bahwa data masih placeholder sehingga UI dapat
      // mengingatkan operator sebelum go-live.
      isDefault:
        row.name === DEFAULT_COMPANY.name &&
        row.address === DEFAULT_COMPANY.address,
    };
  }

  async getProfile(): Promise<CompanyProfileView> {
    const row = await this.loadRow();
    if (!row) {
      return { ...DEFAULT_COMPANY, hasLogo: false, logoMime: null, logoSize: null, updatedAt: null, isDefault: true };
    }
    return this.toView(row);
  }

  async updateProfile(
    dto: UpdateCompanyProfileDto,
    updatedBy: number | null,
  ): Promise<CompanyProfileView> {
    const name = (dto.name ?? '').trim();
    const address = (dto.address ?? '').trim();
    const phone = (dto.phone ?? '').trim();
    if (!name) throw new BadRequestException('Nama perusahaan wajib diisi.');
    if (!address) throw new BadRequestException('Alamat wajib diisi.');
    if (!phone) throw new BadRequestException('Telepon wajib diisi.');

    const email = clean(dto.email);
    if (email && !EMAIL_PATTERN.test(email)) {
      throw new BadRequestException('Format email tidak valid.');
    }
    const npwp = normalizeNpwp(dto.npwp);

    const values = {
      id: SINGLETON_ID,
      name,
      address,
      city: clean(dto.city),
      phone,
      email,
      npwp,
      isPkp: Boolean(dto.isPkp),
      updatedBy,
    };

    const existing = await this.loadRow();
    if (!existing) {
      await this.db
        .insert(companyProfiles)
        .values(values)
        .onConflictDoUpdate({ target: companyProfiles.id, set: values });
    } else {
      await this.db
        .update(companyProfiles)
        .set(values)
        .where(eq(companyProfiles.id, SINGLETON_ID));
    }

    const row = await this.loadRow();
    return row
      ? this.toView(row)
      : { ...this.toView({ ...values } as any), hasLogo: false, logoMime: null, logoSize: null, updatedAt: null };
  }

  async updateLogo(
    data: Buffer,
    mime: string,
    updatedBy: number | null,
  ): Promise<CompanyProfileView> {
    if (!Buffer.isBuffer(data) || data.length === 0) {
      throw new BadRequestException('File logo kosong.');
    }
    if (!ALLOWED_LOGO_MIME.includes(mime as (typeof ALLOWED_LOGO_MIME)[number])) {
      throw new BadRequestException(
        `Format logo harus ${ALLOWED_LOGO_MIME.join(', ')}.`,
      );
    }
    if (data.length > MAX_LOGO_BYTES) {
      throw new BadRequestException(
        `Ukuran logo maksimal ${Math.round(MAX_LOGO_BYTES / 1024)} KB.`,
      );
    }

    await this.ensureRow();
    await this.db
      .update(companyProfiles)
      .set({ logoData: data, logoMime: mime, logoSize: data.length, updatedBy })
      .where(eq(companyProfiles.id, SINGLETON_ID));
    return this.getProfile();
  }

  async removeLogo(): Promise<CompanyProfileView> {
    await this.db
      .update(companyProfiles)
      .set({ logoData: null, logoMime: null, logoSize: null })
      .where(eq(companyProfiles.id, SINGLETON_ID));
    return this.getProfile();
  }

  /** Biner logo untuk disajikan, atau null bila belum ada. */
  async getLogo(): Promise<{ data: Buffer; mime: string } | null> {
    const row = await this.db
      .select({
        data: companyProfiles.logoData,
        mime: companyProfiles.logoMime,
      })
      .from(companyProfiles)
      .where(eq(companyProfiles.id, SINGLETON_ID))
      .limit(1);
    const hit = row[0];
    if (!hit?.data) return null;
    return {
      data: hit.data as unknown as Buffer,
      mime: hit.mime ?? 'application/octet-stream',
    };
  }

  /** Dipakai lapis kop (laporan/invoice) agar sumbernya tunggal. */
  async getHeader(): Promise<{
    name: string;
    address: string;
    city: string | null;
    phone: string;
    email: string | null;
  }> {
    const row = await this.loadRow();
    if (!row) {
      return {
        name: DEFAULT_COMPANY.name,
        address: DEFAULT_COMPANY.address,
        city: null,
        phone: DEFAULT_COMPANY.phone,
        email: null,
      };
    }
    return {
      name: row.name,
      address: row.address,
      city: row.city,
      phone: row.phone,
      email: row.email,
    };
  }

  private async ensureRow(): Promise<void> {
    const existing = await this.loadRow();
    if (existing) return;
    await this.db
      .insert(companyProfiles)
      .values({ id: SINGLETON_ID, ...DEFAULT_COMPANY })
      .onConflictDoNothing();
  }
}
