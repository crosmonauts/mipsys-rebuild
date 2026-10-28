/**
 * Perkiraan tinggi teks di dalam sel spreadsheet.
 *
 * ExcelJS tidak menghitung tinggi baris otomatis, sedangkan menebaknya
 * dari panjang karakter (mis. `t.length > 55`) meleset begitu metode
 * pembayaran atau redaksi ketentuan berubah. Di sini lebar kolom dan
 * ukuran font dikonversi dulu ke perkiraan karakter yang muat per baris.
 */

/** Lebar satu unit kolom spreadsheet ≈ 7 piksel (Calibri 11). */
export const EXCEL_COLUMN_PX = 7;
/** Lebar rata-rata satu karakter ≈ 5,5 piksel pada font 11pt. */
export const EXCEL_CHAR_PX = 5.5;

/**
 * Lebar gabungan beberapa kolom, dikembalikan dalam satuan font default
 * (11pt) agar bisa dibandingkan langsung dengan lebar teks.
 */
export function mergedWidthChars(
  widths: number[],
  fromColumn: number,
  toColumn: number,
): number {
  const start = Math.max(1, fromColumn);
  const end = Math.min(widths.length, toColumn);
  let chars = 0;
  for (let c = start; c <= end; c++) {
    chars += widths[c - 1] ?? 8.43;
  }
  return chars;
}

/** Kapasitas karakter per baris untuk ukuran font tertentu. */
export function charsPerLine(
  widthChars: number,
  fontSize: number,
  referenceFontSize = 11,
): number {
  if (widthChars <= 0) return 1;
  // Lebar dalam piksel tidak berubah, jadi karakter yang muat bertambah
  // saat font mengecil.
  const widthPx = widthChars * EXCEL_COLUMN_PX;
  const charPx = (EXCEL_CHAR_PX * fontSize) / referenceFontSize;
  return Math.max(1, Math.floor(widthPx / charPx));
}

/** Perkiraan jumlah baris setelah teks dibungkus. */
export function estimateWrappedLines(
  text: string,
  fontSize: number,
  widthChars: number,
): number {
  const perLine = charsPerLine(widthChars, fontSize);
  const words = (text ?? '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 1;

  let lines = 1;
  let current = 0;
  for (const word of words) {
    const need = current === 0 ? word.length : current + 1 + word.length;
    if (need > perLine && current > 0) {
      lines++;
      current = word.length;
    } else {
      current = need;
    }
  }
  return lines;
}
