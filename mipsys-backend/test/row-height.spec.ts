import {
  charsPerLine,
  estimateWrappedLines,
  mergedWidthChars,
} from '../src/reports/excel/row-height';
import { excelColumnsForPixels } from '../src/reports/excel/image-fit';

/**
 * Tinggi baris XLSX tidak boleh ditebak dari panjang karakter.
 * Yang calculating: kondisi meleset justru saat teks melewati satu
 * baris, karena itulah kasus di mana Excel menimpa baris berikutnya.
 */

const INVOICE_WIDTHS = [6, 35, 10, 18, 18];

describe('mergedWidthChars', () => {
  it('menjumlahkan lebar kolom yang digabung', () => {
    expect(mergedWidthChars(INVOICE_WIDTHS, 1, 3)).toBe(51);
  });

  it('mengabaikan indeks di luar rentang', () => {
    expect(mergedWidthChars(INVOICE_WIDTHS, 2, 99)).toBe(35 + 10 + 18 + 18);
  });
});

describe('charsPerLine', () => {
  it('menambah kapasitas saat font mengecil', () => {
    const width = mergedWidthChars(INVOICE_WIDTHS, 1, 3);
    expect(charsPerLine(width, 8)).toBeGreaterThan(charsPerLine(width, 11));
  });

  it('tidak pernah nol', () => {
    expect(charsPerLine(0, 8)).toBe(1);
  });
});

describe('estimateWrappedLines', () => {
  const width = mergedWidthChars(INVOICE_WIDTHS, 1, 3);

  it('menyatakan satu baris untuk teks pendek', () => {
    expect(estimateWrappedLines('Garansi pekerjaan', 8, width)).toBe(1);
  });

  it('menyatakan satu baris untuk ketentuan yang muat', () => {
    // 79 karakter masih muat dalam kolom 1-3 pada font 8pt.
    const term =
      'Pembayaran via metode terpilih (CASH/TRANSFER/QRIS) - harap konfirmasi ke kasir';
    expect(term.length).toBeLessThan(charsPerLine(width, 8));
    expect(estimateWrappedLines(term, 8, width)).toBe(1);
  });

  it('mendeteksi teks yang benar-benar melewati satu baris', () => {
    const long = `Pembayaran via metode terpilih (${'X'.repeat(140)})`;
    expect(estimateWrappedLines(long, 8, width)).toBeGreaterThan(1);
  });

  it('menambah tinggi baris ketika ketentuan dipanjangkan', () => {
    const pendek = 'Garansi pekerjaan sesuai ketentuan';
    const panjang =
      'Garansi pekerjaan sesuai ketentuan yang berlaku dan dikecualikan untuk kerusakan akibat kebocoran cairan, petir, serta tegangan listrik tidak stabil';
    expect(estimateWrappedLines(panjang, 8, width)).toBeGreaterThan(
      estimateWrappedLines(pendek, 8, width),
    );
  });

  it('selalu minimal satu baris untuk teks kosong', () => {
    expect(estimateWrappedLines('', 8, width)).toBe(1);
  });

  it('bertambah monoton saat teks makin panjang', () => {
    const short = 'Garansi pekerjaan sesuai ketentuan';
    const long =
      'Pembayaran via metode terpilih (CASH/TRANSFER/QRIS) — harap konfirmasi ke kasir sebelum unit diambil dan Transport';
    expect(estimateWrappedLines(long, 8, width)).toBeGreaterThan(
      estimateWrappedLines(short, 8, width),
    );
  });

  it('menyatakan teks pendek satu baris pun tetap satu', () => {
    expect(estimateWrappedLines('x'.repeat(5), 8, width)).toBe(1);
  });
});

describe('excelColumnsForPixels', () => {
  it('mengembalikan 0 untuk lebar nol', () => {
    expect(excelColumnsForPixels(0)).toBe(0);
  });

  it('menghitung jumlah kolom dari lebar piksel', () => {
    expect(excelColumnsForPixels(7)).toBe(1);
    expect(excelColumnsForPixels(70)).toBe(10);
  });

  it('bulatkan ke atas agar logo tidak menimpa teks', () => {
    expect(excelColumnsForPixels(8)).toBe(2);
  });
});
