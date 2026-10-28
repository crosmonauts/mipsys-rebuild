import { BadRequestException } from '@nestjs/common';
import { fitInside, readImageSize } from '../reports/excel/image-fit';

/**
 * Layout kop dokumen (invoice PDF).
 *
 * Kop memakai beberapa posisi yang dulu tersebar sebagai angka magic
 * (x=50, x=370, y=105). Akibatnya menambahkan logo menyisakan celah
 * 64pt karena teks selalu digeser sebesar kotak logo, bukan lebar logo
 * sebenarnya; dan nama perusahaan yang panjang menabrak judul INVOICE.
 *
 * Semua koordinat kop diturunkan dari sini agar pergerakannya seragam.
 */

/** Batas kiri area kop (margin A4 = 50pt). */
export const PAGE_LEFT = 50;
/** Lebar area kop sebelum Judul di sisi kanan. */
export const KOP_WIDTH = 495;
/** Jarak aman antara isi kop kiri dan judul kanan. */
export const KOP_GUTTER = 10;
/** Jarak teks dari logo. */
export const LOGO_TEXT_GAP = 12;
/**
 * Ruang kosong di atas kop, diukur relatif terhadap margin dokumen
 * (PDFKit sudah menggeser kotak konten). Tanpa offset ini, baris pertama
 * dan logo menempel persis di batas margin atas.
 */
export const KOP_TOP_OFFSET = 50;
/** Kotak maksimum logo di kop PDF. */
export const LOGO_BOX = { width: 110, height: 46 };

export const NAME_FONT_MAX = 24;
export const NAME_FONT_MIN = 12;
const NAME_LINE_GAP = 4;
const LINE_GAP = 12;

export interface KopInput {
  /** Buffer logo mentah; null/tidak ada bila perusahaan belum mengunggah. */
  logo: Buffer | null;
  companyName: string;
  address: string;
  contact: string;
  /** Lebar area kop (default 495pt). */
  areaWidth?: number;
  /** Lebar blok judul di kanan kop (mis. 175pt). */
  titleWidth?: number;
  /** Ruang kosong di atas kop, relatif terhadap margin. Default 50pt. */
  topOffset?: number;
  /** Mengukur lebar teks; disuntik agar fungsi tetap murni & testabel. */
  measure: (text: string, font: 'bold' | 'regular', size: number) => number;
  /** Mengukur tinggi teks multi-baris dalam lebar tertentu. */
  measureHeight: (
    text: string,
    font: 'bold' | 'regular',
    size: number,
    width: number,
  ) => number;
}

export interface KopLine {
  text: string;
  font: 'bold' | 'regular';
  size: number;
  x: number;
  y: number;
}

export interface KopLayout {
  logo: { x: number; y: number; width: number; height: number } | null;
  lines: KopLine[];
  /**
   * Lebar yang harus diteruskan ke doc.text({ width }) agar teks membungkus
   * di dalam area kop, bukan meluber ke judul di kanan.
   */
  textWidth: number;
  /** Posisi garis bawah kop — dihitung dari isi, bukan konstanta. */
  bottomY: number;
}

export function layoutKop(input: KopInput): KopLayout {
  const areaWidth = input.areaWidth ?? KOP_WIDTH;
  const titleWidth = input.titleWidth ?? 175;
  const { measure, measureHeight } = input;

  if (!input.companyName || !input.companyName.trim()) {
    throw new BadRequestException('Nama perusahaan kosong pada kop.');
  }

  const titleLeft = PAGE_LEFT + areaWidth - titleWidth;
  let textX = PAGE_LEFT;
  let logo: KopLayout['logo'] = null;

  if (input.logo && input.logo.length > 0) {
    const natural = readImageSize(input.logo);
    const sized = natural ? fitInside(natural, LOGO_BOX) : LOGO_BOX;
    if (sized.width > 0 && sized.height > 0) {
      logo = { x: PAGE_LEFT, y: 0, width: sized.width, height: sized.height };
      // Teks mengikuti lebar logo yang benar-benar terpakai, bukan kotak
      // maksimum — inilah yang sebelumnya menyisakan celah kosong.
      textX = PAGE_LEFT + sized.width + LOGO_TEXT_GAP;
    }
  }

  // Area teks dibatasi agar tidak pernah menyentuh judul di kanan.
  const textWidth = Math.max(40, titleLeft - KOP_GUTTER - textX);

  // Nama diperkecil agar muat satu baris; bila tetap tidak muat, dibungkus
  // (tidak diperkecil lagi supaya tetap terbaca).
  let nameSize = NAME_FONT_MAX;
  while (
    nameSize > NAME_FONT_MIN &&
    measure(input.companyName, 'bold', nameSize) > textWidth
  ) {
    nameSize -= 1;
  }

  const lines: KopLine[] = [];
  // Selalu mulai dari ruang atas, supaya kop tidak menempel di margin.
  let y = input.topOffset ?? KOP_TOP_OFFSET;

  // Logo disejajarkan dengan baris pertama.
  if (logo) logo.y = y;

  const nameHeight = measureHeight(
    input.companyName,
    'bold',
    nameSize,
    textWidth,
  );
  lines.push({
    text: input.companyName,
    font: 'bold',
    size: nameSize,
    x: textX,
    y,
  });
  y += nameHeight + NAME_LINE_GAP;

  for (const raw of [input.address, input.contact]) {
    const text = (raw ?? '').trim();
    if (!text) continue;
    const height = measureHeight(text, 'regular', 8, textWidth);
    lines.push({ text, font: 'regular', size: 8, x: textX, y });
    y += height + 3;
  }

  if (logo) {
    // Kop setinggi logo bila logo lebih besar dari tumpukan teks.
    y = Math.max(y, logo.y + logo.height);
  }

  const bottomY = y + LINE_GAP / 2;
  return { logo, lines, textWidth, bottomY };
}
