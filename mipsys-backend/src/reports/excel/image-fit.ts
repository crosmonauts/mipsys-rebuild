/**
 * Hitung ukuran gambar yang muat di dalam kotak target tanpa
 * meregangkan rasio aspek. Tanpa ini, logo矮 bisa terlihat gepeng.
 */
export function fitInside(
  natural: { width: number; height: number },
  box: { width: number; height: number },
): { width: number; height: number } {
  if (natural.width <= 0 || natural.height <= 0) {
    return { width: 0, height: 0 };
  }
  // Skala dibatasi 1 supaya logo kecil tidak diperbesar (jadi pecam).
  const scale = Math.min(
    1,
    Math.min(box.width / natural.width, box.height / natural.height),
  );
  return {
    width: Math.max(1, Math.round(natural.width * scale)),
    height: Math.max(1, Math.round(natural.height * scale)),
  };
}

/** Basic image-header reader untuk PNG/JPEG/WebP. */
export function readImageSize(
  data: Buffer,
): { width: number; height: number } | null {
  // PNG: 8-byte signature, lalu IHDR di offset 16
  if (
    data.length > 24 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }

  // JPEG: telusuri segment marker
  if (data.length > 4 && data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2;
    // Perlu byte sampai offset+8 (tinggi & lebar masing-masing 2 byte).
    while (offset + 9 <= data.length) {
      if (data[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = data[offset + 1];
      // SOF0/1/2/3,5..7,9..11,13..15 punya dimensi
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return {
          height: data.readUInt16BE(offset + 5),
          width: data.readUInt16BE(offset + 7),
        };
      }
      const segmentLength = data.readUInt16BE(offset + 2);
      if (segmentLength <= 0) return null;
      offset += 2 + segmentLength;
    }
    return null;
  }

  // WebP (RIFF): VP8 / VP8L / VP8X
  if (
    data.length > 30 &&
    data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunk = data.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      return {
        width: data.readUInt16LE(26) & 0x3fff,
        height: data.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === 'VP8L') {
      const bits = data.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      const width = 1 + (data[24] | (data[25] << 8) | (data[26] << 16));
      const height = 1 + (data[27] | (data[28] << 8) | (data[29] << 16));
      return { width, height };
    }
  }

  return null;
}

/** Ekstensi berkas yang dipakai ExcelJS/PDFKit dari MIME logo. */
export function extensionForMime(mime: string): 'png' | 'jpeg' | null {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpeg';
    default:
      return null;
  }
}

/**
 * Lebar satu unit kolom spreadsheet ≈ 7 piksel pada font default (Calibri 11).
 * Dipakai untuk menentukan berapa kolom yang perlu dipakai logo sebelum
 * teks kop dipindahkan ke kanan.
 */
export const EXCEL_COLUMN_PX = 7;

export function excelColumnsForPixels(pixels: number): number {
  if (pixels <= 0) return 0;
  return Math.ceil(pixels / EXCEL_COLUMN_PX);
}
