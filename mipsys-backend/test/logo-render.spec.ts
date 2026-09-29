import {
  extensionForMime,
  fitInside,
  readImageSize,
} from '../src/reports/excel/image-fit';

/** Logo tidak boleh teregang: rasio aspek wajib dijaga di semua renderer. */

function pngBuffer(width: number, height: number): Buffer {
  const b = Buffer.alloc(33);
  [0x89, 0x50, 0x4e, 0x47].forEach((v, i) => b.writeUInt8(v, i));
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

/** Header JPEG minimal: SOF0 dengan tinggi/lebar yang bisa dibaca. */
function jpegBuffer(width: number, height: number): Buffer {
  const b = Buffer.alloc(11);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  b[3] = 0xc0; // SOF0
  b.writeUInt16BE(0x0011, 4);
  b.writeUInt8(0x08, 6);
  b.writeUInt16BE(height, 7);
  b.writeUInt16BE(width, 9);
  return b;
}

describe('readImageSize', () => {
  it('membaca dimensi PNG', () => {
    expect(readImageSize(pngBuffer(120, 60))).toEqual({
      width: 120,
      height: 60,
    });
  });

  it('membaca dimensi JPEG', () => {
    expect(readImageSize(jpegBuffer(300, 150))).toEqual({
      width: 300,
      height: 150,
    });
  });

  it('mengembalikan null untuk data yang bukan gambar', () => {
    expect(readImageSize(Buffer.from('bukan gambar'))).toBeNull();
  });

  it('mengembalikan null untuk PNG terpotong', () => {
    expect(readImageSize(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  });
});

describe('fitInside', () => {
  it('menjaga rasio aspek saat lebar menjadi pembatas', () => {
    expect(
      fitInside({ width: 200, height: 100 }, { width: 100, height: 100 }),
    ).toEqual({ width: 100, height: 50 });
  });

  it('menjaga rasio aspek saat tinggi menjadi pembatas', () => {
    expect(
      fitInside({ width: 200, height: 100 }, { width: 100, height: 50 }),
    ).toEqual({ width: 100, height: 50 });
  });

  it('tidak memperbesar gambar melebihi ukuran aslinya', () => {
    expect(
      fitInside({ width: 50, height: 50 }, { width: 500, height: 500 }),
    ).toEqual({ width: 50, height: 50 });
  });

  it('mengembalikan nol untuk dimensi tidak valid', () => {
    expect(
      fitInside({ width: 0, height: 10 }, { width: 5, height: 5 }),
    ).toEqual({ width: 0, height: 0 });
  });
});

describe('extensionForMime', () => {
  it('memetakan mime logo ke ekstensi berkas', () => {
    expect(extensionForMime('image/png')).toBe('png');
    expect(extensionForMime('image/jpeg')).toBe('jpeg');
  });

  it('menolak webp karena tidak bisa dirender ExcelJS', () => {
    expect(extensionForMime('image/webp')).toBeNull();
  });

  it('tidak memetakan tipe di luar daftar putih', () => {
    expect(extensionForMime('image/svg+xml')).toBeNull();
    expect(extensionForMime('application/pdf')).toBeNull();
  });
});
