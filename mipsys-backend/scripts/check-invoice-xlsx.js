const ExcelJS = require('exceljs');

/**
 * Pemeriksaan invoice XLSX: memastikan biaya jasa hanya ada di baris
 * total dan nominal ringkasan utuh.
 */
const file = process.argv[2];
const expectTotal = process.argv[3] ? Number(process.argv[3]) : null;

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.worksheets[0];

  const kop = [];
  for (let r = 1; r <= 5; r++) {
    for (let c = 1; c <= 5; c++) {
      const v = ws.getRow(r).getCell(c).value;
      if (typeof v === 'string' && v.trim()) kop.push(`r${r}c${c}: ${v.slice(0, 46)}`);
    }
  }
  console.log('  KOP:');
  kop.forEach((k) => console.log(`    ${k}`));

  const texts = [];
  const totals = [];
  ws.eachRow((row) => {
    for (let c = 1; c <= 5; c++) {
      const v = row.getCell(c).value;
      if (typeof v === 'string') {
        texts.push(v);
        if (/^(Total Biaya Part|Total Biaya Jasa|Subtotal|PPN|GRAND TOTAL)/.test(v)) {
          totals.push({ label: v, value: row.getCell(5).value ?? row.getCell(4).value });
        }
      }
    }
  });

  console.log('  TOTAL:');
  totals.forEach((t) =>
    console.log(`    ${t.label} = ${typeof t.value === 'number' ? t.value.toLocaleString('id-ID') : t.value}`),
  );

  const jasaInTable = texts.find((t) => /Biaya Jasa \(Service Fee\)/.test(t));
  console.log(`  baris tabel "Biaya Jasa (Service Fee)": ${jasaInTable ? 'ADA (SALAH)' : 'tidak ada (benar)'}`);

  const grand = totals.find((t) => t.label === 'GRAND TOTAL');
  if (grand && typeof grand.value === 'string') {
    const num = Number(grand.value.replace(/[^0-9]/g, ''));
    console.log(`  GRAND TOTAL tercetak = ${num.toLocaleString('id-ID')}`);
    if (expectTotal !== null) {
      const ok = num === expectTotal;
      console.log(`  vs invoice.total = ${expectTotal.toLocaleString('id-ID')} -> ${ok ? 'COCOK' : 'BEDA'}`);
      if (!ok) process.exitCode = 1;
    }
  }
  if (jasaInTable) process.exitCode = 1;
})();
