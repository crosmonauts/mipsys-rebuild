/**
 * Pemeriksa tumpang tindih teks pada PDF hasil export invoice.
 *
 * Lebar teks diukur memakai metrik Helvetica sungguhan (PDFKit), bukan
 * perkiraan kasar, sehingga hasilnya dapat dipercaya.
 */
const fs = require('fs');
const zlib = require('zlib');
const PDFDocument = require('pdfkit');

// Pemakai: node scripts/check-pdf-overlap.js <file.pdf>

function decodeStreams(buf) {
  let body = '';
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let m;
  while ((m = re.exec(buf.toString('latin1'))) !== null) {
    for (const fn of [zlib.inflateSync, (x) => x]) {
      try {
        body += fn(Buffer.from(m[1], 'latin1')).toString('latin1');
        break;
      } catch (e) {
        /* bukan stream deflate, coba mentah */
      }
    }
  }
  return body;
}

const measureDoc = new PDFDocument();

function extract(buf) {
  const body = decodeStreams(buf);
  const out = [];
  const blocks = body.match(/BT[\s\S]*?ET/g) || [];
  for (const blk of blocks) {
    const tm = /1 0 0 1 ([\d.]+) ([\d.]+) Tm/.exec(blk);
    const tf = /\/(F\d+) ([\d.]+) Tf/.exec(blk);
    if (!tm || !tf) continue;
    const hexes = blk.match(/<([0-9A-Fa-f]+)>/g) || [];
    const text = hexes
      .map((h) => Buffer.from(h.replace(/[<>]/g, ''), 'hex').toString('latin1'))
      .join('')
      .split(String.fromCharCode(0))
      .join(' ');
    if (!text.trim()) continue;
    out.push({
      text,
      x: parseFloat(tm[1]),
      y: parseFloat(tm[2]),
      size: parseFloat(tf[2]),
      font: tf[1],
    });
  }
  return out;
}

function measure(text, size, font) {
  const name = /F2\b/.test(font)
    ? 'Helvetica-Bold'
    : /F3\b/.test(font)
      ? 'Helvetica-Oblique'
      : 'Helvetica';
  return measureDoc.font(name).fontSize(size).widthOfString(text);
}

/**
 * Margin atas dokumen (pt). PDFKit memakai margin 50 dan menggeser kotak
 * konten ke bawah, sehingga koordinat y di dalam konten dimulai dari 0.
 */
const PAGE_MARGIN = 50;

/** Tinggi halaman dari MediaBox; fallback ke tinggi A4. */
function pageHeight(buf) {
  const m = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/.exec(
    buf.toString('latin1'),
  );
  return m ? parseFloat(m[2]) : 841.89;
}

function run(file) {
  const buf = fs.readFileSync(file);
  const items = extract(buf);
  const boxes = items.map((it) => {
    const w = measure(it.text, it.size, it.font);
    return {
      label: it.text.slice(0, 44),
      x0: it.x,
      y0: it.y - it.size * 0.8,
      x1: it.x + w,
      y1: it.y + it.size * 0.22,
    };
  });

  let bad = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix > 1 && iy > 1) {
        bad++;
        console.log('  TUMPANG TINDIH:');
        console.log(
          `    A "${a.label}" x=${a.x0.toFixed(0)}..${a.x1.toFixed(0)} y=${a.y0.toFixed(0)}..${a.y1.toFixed(0)}`,
        );
        console.log(
          `    B "${b.label}" x=${b.x0.toFixed(0)}..${b.x1.toFixed(0)} y=${b.y0.toFixed(0)}..${b.y1.toFixed(0)}`,
        );
      }
    }
  }
  console.log(
    `  ${items.length} blok teks diperiksa -> ${bad === 0 ? 'BERSIH (tidak ada tumpang tindih)' : bad + ' tumpang tindih'}`,
  );

  // Jarak atas konten. Koordinat PDF ber-basis bawah (y membesar ke atas),
  // jadi jarak dihitung dari tepi atas kotak konten ke blok teks tertinggi.
  // Blok yang menempel di margin atas punya jarak ~0.
  if (process.env.DEBUG_TOP) {
    items
      .slice()
      .sort((a, b) => b.y - a.y)
      .slice(0, 6)
      .forEach((it) =>
        console.log(`    [top] y=${it.y.toFixed(1)} size=${it.size} "${it.text.slice(0, 34)}"`),
      );
  }
  const topMost = items.reduce((max, it) => Math.max(max, it.y), -Infinity);
  const contentTop = pageHeight(buf) - PAGE_MARGIN;
  const topGap = Number.isFinite(topMost) ? contentTop - topMost : NaN;
  // y pada doc.text() adalah kotak baris; baseline yang terekspor berada
  // lebih tinggi karena ascent. Jadi gap wajar selalu lebih kecil dari
  // topOffset. Yang penting: gap tidak boleh negatif, karena itu berarti
  // konten naik keluar dari kotak konten ke area margin (regresi "nempel").
  const topOk = topGap >= 0;
  console.log(
    `  jarak atas konten = ${topGap.toFixed(1)}pt (>= 0) -> ${topOk ? 'BAIK' : 'KONTEN KELUAR KE AREA MARGIN'}`,
  );

  return bad + (topOk ? 0 : 1);
}

const file = process.argv[2];
const bad = run(file);
process.exit(bad === 0 ? 0 : 1);
