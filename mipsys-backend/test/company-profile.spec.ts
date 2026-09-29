import { BadRequestException } from '@nestjs/common';
import {
  ALLOWED_LOGO_MIME,
  MAX_LOGO_BYTES,
  CompanyProfileService,
  DEFAULT_COMPANY,
  SINGLETON_ID,
  normalizeNpwp,
} from '../src/company-profile/company-profile.service';

/**
 * Master data perusahaan.
 *
 * Aturan yang dikunci test:
 * - Baris selalu tunggal (id=1) — bukan multi tenant.
 * - Field wajib tervalidasi; NPWP hanya angka 15-16 digit (format resmi).
 * - Logo hanya png/jpeg/webp dan maksimal 1 MB (SVG ditolak agar tidak
 *   menjadi celah XSS saat disajikan).
 */

function makeService(options: {
  row?: Record<string, unknown> | null;
  failInsert?: boolean;
}) {
  let current: Record<string, unknown> | null = options.row ?? null;
  let saved: any = null;

  const load = async () => (current ? [current] : []);

  const db: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ limit: jest.fn(load) }),
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn((v: any) => {
        saved = v;
        // onConflictDoUpdate: bila baris belum ada, baris baru dibuat.
        const upsert = jest.fn(async () => {
          current = { ...current, ...v };
        });
        return { onConflictDoUpdate: upsert, onConflictDoNothing: upsert };
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn((v: any) => {
        saved = v;
        return {
          where: jest.fn(async () => {
            current = { ...(current ?? {}), ...v };
          }),
        };
      }),
    }),
  };

  const service = new CompanyProfileService(db);
  return { db, service, getSaved: () => saved, getRow: () => current };
}

describe('normalizeNpwp', () => {
  it('mempertahankan digit yang sah', () => {
    expect(normalizeNpwp('09.254.294.3-407.000')).toBe('092542943407000');
  });

  it('membuang spasi, tanda hubung, dan titik', () => {
    expect(normalizeNpwp(' 01 234 567 8 012 000 ')).toBe('012345678012000');
  });

  it('mengembalikan null bila kosong', () => {
    expect(normalizeNpwp('')).toBeNull();
    expect(normalizeNpwp(undefined)).toBeNull();
  });

  it('menolak panjang selain 15 atau 16 digit', () => {
    expect(() => normalizeNpwp('1234')).toThrow(BadRequestException);
    expect(() => normalizeNpwp('12345678901234567')).toThrow(
      BadRequestException,
    );
  });

  it('menolak karakter non-digit', () => {
    expect(() => normalizeNpwp('ABCDEFGHIJKLMNO')).toThrow(
      BadRequestException,
    );
  });
});

describe('CompanyProfileService.getProfile', () => {
  it('mengembalikan profil tersimpan tanpa kolom logo biner', async () => {
    const { service } = makeService({
      row: {
        id: SINGLETON_ID,
        name: 'PT Bengkel Mandiri',
        address: 'Jl. Raya No. 1',
        city: 'Bekasi',
        phone: '(021) 1234-5678',
        email: 'info@bengkel.co.id',
        npwp: '092542943407000',
        isPkp: true,
        logoData: Buffer.from('binary'),
        logoMime: 'image/png',
        logoSize: 7,
      },
    });

    const profile = await service.getProfile();

    expect(profile.name).toBe('PT Bengkel Mandiri');
    expect(profile.isPkp).toBe(true);
    expect(profile).not.toHaveProperty('logoData');
  });

  it('memberi tahu apakah logo tersedia tanpa mengirim binernya', async () => {
    const { service } = makeService({
      row: { ...DEFAULT_COMPANY, logoData: Buffer.from('x'), logoMime: 'image/png' },
    });

    const profile = await service.getProfile();

    expect(profile.hasLogo).toBe(true);
  });

  it('mengembalikan profil default bila tabel masih kosong', async () => {
    const { service } = makeService({ row: null });

    const profile = await service.getProfile();

    expect(profile.name).toBe(DEFAULT_COMPANY.name);
    expect(profile.hasLogo).toBe(false);
  });
});

describe('CompanyProfileService.updateProfile', () => {
  const valid = {
    name: 'PT Bengkel Mandiri',
    address: 'Jl. Raya No. 1',
    city: 'Bekasi',
    phone: '(021) 1234-5678',
    email: 'info@bengkel.co.id',
    npwp: '09.254.294.3-407.000',
    isPkp: true,
  };

  it('menyimpan profil yang valid', async () => {
    const { service, getSaved } = makeService({ row: DEFAULT_COMPANY });

    const result = await service.updateProfile(valid, 1);

    expect(result.name).toBe('PT Bengkel Mandiri');
    expect(result.npwp).toBe('092542943407000');
    expect(getSaved()).toBeDefined();
  });

  it('menolak nama kosong', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateProfile({ ...valid, name: '   ' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak alamat kosong', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateProfile({ ...valid, address: '' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak telepon kosong', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateProfile({ ...valid, phone: '' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak email tidak valid bila diisi', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateProfile({ ...valid, email: 'bukan-email' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menerima email kosong (opsional)', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    const result = await service.updateProfile(
      { ...valid, email: '' },
      1,
    );
    expect(result.email).toBeNull();
  });

  it('menolak NPWP dengan panjang salah', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateProfile({ ...valid, npwp: '123' }, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('membuat baris singleton bila tabel kosong', async () => {
    const { service, db } = makeService({ row: null });

    await service.updateProfile(valid, 1);

    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it('memperbarui baris yang sudah ada tanpa insert baru', async () => {
    const { service, db } = makeService({ row: DEFAULT_COMPANY });

    await service.updateProfile(valid, 1);

    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });
});

describe('CompanyProfileService.updateLogo', () => {
  const png = Buffer.from('89504e470d0a1a0a', 'hex');

  it('menyimpan logo png yang valid', async () => {
    const { service, getSaved } = makeService({ row: DEFAULT_COMPANY });

    const result = await service.updateLogo(png, 'image/png', 1);

    expect(result.hasLogo).toBe(true);
    expect(result.logoMime).toBe('image/png');
    expect(getSaved().logoMime).toBe('image/png');
  });

  it('menolak tipe di luar daftar putih', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    for (const mime of ALLOWED_LOGO_MIME) {
      await expect(
        service.updateLogo(png, mime, 1),
      ).resolves.toBeDefined();
    }
    await expect(
      service.updateLogo(png, 'image/svg+xml', 1),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.updateLogo(png, 'application/pdf', 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak logo melebihi batas ukuran', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    const tooBig = Buffer.alloc(MAX_LOGO_BYTES + 1);

    await expect(
      service.updateLogo(tooBig, 'image/png', 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak file kosong', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateLogo(Buffer.alloc(0), 'image/png', 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('menolak logo bila data bukan buffer', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });
    await expect(
      service.updateLogo('bukan-buffer' as unknown as Buffer, 'image/png', 1),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('CompanyProfileService.removeLogo', () => {
  it('mengosongkan logo', async () => {
    const { service } = makeService({ row: DEFAULT_COMPANY });

    const result = await service.removeLogo();

    expect(result.hasLogo).toBe(false);
  });
});

describe('DTO company profile', () => {
  /** Bug nyata: string kosong dari form tidak melewati @IsOptional(). */
  it('menerima string kosong untuk field opsional', async () => {
    const { plainToInstance } = require('class-transformer');
    const { validate } = require('class-validator');
    const { UpdateCompanyProfileDto } = require('../src/company-profile/dto/update-company-profile.dto');

    const dto = plainToInstance(UpdateCompanyProfileDto, {
      name: 'PT X',
      address: 'Jl. 1',
      phone: '(021) 1',
      city: '',
      email: '',
      npwp: '',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.email).toBeUndefined();
    expect(dto.npwp).toBeUndefined();
  });
});
