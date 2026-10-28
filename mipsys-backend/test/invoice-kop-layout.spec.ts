import PDFDocument from 'pdfkit';
import {
  KOP_TOP_OFFSET,
  KOP_WIDTH,
  PAGE_LEFT,
  layoutKop,
} from '../src/finance/invoice-kop-layout';

/**
 * Layout kop invoice.
 *
 * Yang diuji: logo kecil tidak boleh menyisakan celah besar, dan nama
 * perusahaan panjang tidak boleh menabrak judul "INVOICE" di kanan kop.
 */

const doc = new PDFDocument({ size: 'A4', margin: 50 });

// Stub pengukur yang meniru PDFKit Helvetica.
const measure = (text: string, font: 'bold' | 'regular', size: number) =>
  doc.font(font === 'bold' ? 'Helvetica-Bold' : 'Helvetica').fontSize(size)
    .widthOfString(text);

const measureHeight = (
  text: string,
  font: 'bold' | 'regular',
  size: number,
  width: number,
) => doc.font(font === 'bold' ? 'Helvetica-Bold' : 'Helvetica').fontSize(size)
    .heightOfString(text, { width });

function png(width: number, height: number): Buffer {
  const b = Buffer.alloc(33);
  [0x89, 0x50, 0x4e, 0x47].forEach((v, i) => b.writeUInt8(v, i));
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

const BASE = {
  areaWidth: KOP_WIDTH,
  titleWidth: 175,
  measure,
  measureHeight,
};

describe('layoutKop tanpa logo', () => {
  it('menaruh teks di margin kiri', () => {
    const kop = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Jl. Raya Industri No. 88, Bekasi',
      contact: '(021) 8899-1234',
    });

    expect(kop.logo).toBeNull();
    expect(kop.lines[0].x).toBe(PAGE_LEFT);
  });

  it('menolak nama perusahaan kosong', () => {
    expect(() =>
      layoutKop({
        ...BASE,
        logo: null,
        companyName: '   ',
        address: 'Alamat',
        contact: 'Telepon',
      }),
    ).toThrow(/nama perusahaan/i);
  });
});

describe('layoutKop dengan logo', () => {
  it('menempel teks ke logo, bukan ke kotak maksimum', () => {
    // Logo kecil 40x40 -> pasti lebih kecil dari LOGO_BOX (110x46).
    const kop = layoutKop({
      ...BASE,
      logo: png(40, 40),
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Alamat',
      contact: 'Telepon',
    });

    expect(kop.logo).not.toBeNull();
    // Celah = lebar logo + LOGO_TEXT_GAP, bukan 110.
    expect(kop.lines[0].x).toBe(kop.logo!.x + kop.logo!.width + 12);
    expect(kop.logo!.width).toBeLessThan(110);
  });

  it('menjaga rasio aspek logo', () => {
    const kop = layoutKop({
      ...BASE,
      logo: png(300, 100),
      companyName: 'PT X',
      address: '',
      contact: '',
    });

    expect(kop.logo!.width / kop.logo!.height).toBeCloseTo(3, 1);
  });

  it('tidak menghasilkan celah kosong untuk logo kecil', () => {
    const withLogo = layoutKop({
      ...BASE,
      logo: png(40, 40),
      companyName: 'PT X',
      address: 'A',
      contact: 'C',
    });
    const withoutLogo = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT X',
      address: 'A',
      contact: 'C',
    });
    // Selisih hanya lebar logo + gap, bukan lebar kotak maksimum.
    expect(withLogo.lines[0].x - withoutLogo.lines[0].x).toBe(
      withLogo.logo!.width + 12,
    );
  });
});

describe('layoutKop tidak menabrak judul kanan', () => {
  const titleLeft = PAGE_LEFT + KOP_WIDTH - 175;

  /**
   * Batas yang diuji adalah area teks yang diteruskan ke PDFKit. Teks
   * panjang membungkus di dalam area itu, jadi yang dijamin adalah
   * lebarnya tidak pernah menyentuh blok judul di kanan.
   */
  const textAreaSafe = (kop: ReturnType<typeof layoutKop>) => {
    const rightEdge = kop.lines[0].x + kop.textWidth;
    return rightEdge <= titleLeft - 10 && kop.textWidth > 0;
  };

  it('area teks berhenti sebelum judul kanan', () => {
    const kop = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Alamat',
      contact: 'Kontak',
    });

    expect(textAreaSafe(kop)).toBe(true);
  });

  it('area teks menyempit saat logo lebar, bukan menabrak', () => {
    const tanpaLogo = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT X',
      address: 'A',
      contact: 'C',
    });
    const denganLogo = layoutKop({
      ...BASE,
      logo: png(400, 400),
      companyName: 'PT X',
      address: 'A',
      contact: 'C',
    });

    expect(denganLogo.textWidth).toBeLessThan(tanpaLogo.textWidth);
    expect(textAreaSafe(denganLogo)).toBe(true);
  });

  it('memperkecil font untuk nama panjang agar muat satu baris', () => {
    const kop = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT BENGKEL MANDIRI JAYA ABADI',
      address: 'Jl. Raya Industri No. 88',
      contact: '(021) 8899-1234',
    });

    // Nama diperkecil agar muat satu baris, bukan dibungkus.
    expect(kop.lines[0].size).toBeLessThan(24);
    expect(measure(kop.lines[0].text, 'bold', kop.lines[0].size)).toBeLessThanOrEqual(
      kop.textWidth,
    );
  });

  it('menjaga nama tetap terbaca pada font minimum', () => {
    const kop = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'CV SEJAHTERA MANDIRI UTAMA INDONESIA TANGERANG',
      address: 'Alamat',
      contact: 'Kontak',
    });

    expect(kop.lines[0].size).toBeGreaterThanOrEqual(12);
  });

  it('membungkus alamat panjang di dalam area kop', () => {
    const kop = layoutKop({
      ...BASE,
      logo: png(300, 100),
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Jl. Raya Industri KM 12 No. 345 RT 004 RW 011 Cikarang Barat',
      contact: '(021) 8899-1234 | sparepart@bengkelmandiri.co.id',
    });

    // Alamat + kontak = 2 baris tambahan di bawah nama.
    expect(kop.lines).toHaveLength(3);
    expect(textAreaSafe(kop)).toBe(true);
  });

  it('tetap muat untuk kombinasi terburuk: logo besar + nama panjang', () => {
    const kop = layoutKop({
      ...BASE,
      logo: png(400, 400),
      companyName: 'PT BENGKEL MANDIRI JAYA ABADI SENTOSA',
      address: 'Jl. Raya Industri KM 12 No. 345 RT 004 RW 011 Cikarang Barat',
      contact: '(021) 8899-1234 | sparepart@bengkelmandiri.co.id',
    });

    expect(textAreaSafe(kop)).toBe(true);
    expect(kop.bottomY).toBeGreaterThan(0);
  });
});

describe('layoutKop garis bawah', () => {
  it('ikut turun saat isi bertambah', () => {
    const pendek = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT X',
      address: 'A',
      contact: 'C',
    });
    const panjang = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT X',
      address: 'Alamat yang sangat panjang sekali sehingga membungkus dua baris penuh di dalam area kop',
      contact: 'Kontak',
    });

    expect(panjang.bottomY).toBeGreaterThan(pendek.bottomY);
  });

  it('minimal tinggi logo bila teks lebih pendek dari logo', () => {
    const kop = layoutKop({
      ...BASE,
      logo: png(400, 400),
      companyName: 'PT X',
      address: '',
      contact: '',
    });

    expect(kop.bottomY).toBeGreaterThanOrEqual(kop.logo!.height);
  });
});

describe('ruang atas kop', () => {
  it('tidak menempel di margin atas secara bawaan', () => {
    const kop = layoutKop({
      ...BASE,
      logo: null,
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Alamat',
      contact: 'Kontak',
    });

    expect(KOP_TOP_OFFSET).toBe(50);
    expect(kop.lines[0].y).toBe(KOP_TOP_OFFSET);
  });

  it('memberi ruang atas yang sama pada logo', () => {
    const kop = layoutKop({
      ...BASE,
      logo: png(300, 100),
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Alamat',
      contact: 'Kontak',
    });

    expect(kop.logo!.y).toBe(KOP_TOP_OFFSET);
    expect(kop.lines[0].y).toBe(kop.logo!.y);
  });

  it('menghormati offset khusus', () => {
    const kop = layoutKop({
      ...BASE,
      logo: png(300, 100),
      topOffset: 64,
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Alamat',
      contact: 'Kontak',
    });

    expect(kop.logo!.y).toBe(64);
    expect(kop.lines[0].y).toBe(64);
  });

  it('menggeser seluruh isi kop, bukan hanya baris pertama', () => {
    const args = {
      ...BASE,
      logo: png(300, 100) as Buffer | null,
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Jl. Raya Industri No. 88, Bekasi',
      contact: '(021) 8899-1234',
    };
    const atas = layoutKop({ ...args, topOffset: 0 });
    const bawah = layoutKop({ ...args, topOffset: 50 });

    // Setiap baris bergeser sebesar offset (bukan hanya yang pertama).
    // Selisih dihitung dari tinggi teks bertumpuk, jadi boleh selisih
    // pembulatan floating point.
    bawah.lines.forEach((line, i) => {
      expect(line.y - atas.lines[i].y).toBeCloseTo(50, 6);
    });
    expect(bawah.bottomY - atas.bottomY).toBeCloseTo(50, 6);
  });

  it('offset nol tetap diizinkan, agar regresi nilainya tercatat', () => {
    const kop = layoutKop({
      ...BASE,
      logo: null,
      topOffset: 0,
      companyName: 'PT BENGKEL MANDIRI',
      address: 'Alamat',
      contact: 'Kontak',
    });

    expect(kop.lines[0].y).toBe(0);
  });
});
