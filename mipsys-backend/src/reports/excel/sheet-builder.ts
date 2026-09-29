import ExcelJS from 'exceljs';
import { extensionForMime, fitInside, readImageSize } from './image-fit';

export type ReportColumnType =
  | 'text'
  | 'integer'
  | 'number'
  | 'currency'
  | 'date'
  | 'percent';

export interface ReportColumn<T = any> {
  /** Kunci properti pada objek baris. */
  key: string;
  /** Teks header kolom. */
  header: string;
  /** Lebar kolom (karakter Excel). */
  width: number;
  type?: ReportColumnType;
  align?: 'left' | 'center' | 'right';
  /** Masukkan kolom ini ke baris total. */
  total?: boolean;
  /** Pemroses nilai khusus; mengembalikan nilai siap-cell. */
  format?: (value: unknown, row: T, index: number) => unknown;
}

export interface ReportParameter {
  label: string;
  value: string;
}

export interface ReportSheetOptions<T = any> {
  sheetName: string;
  title: string;
  columns: ReportColumn<T>[];
  rows: T[];
  company: ReportCompanyProfile;
  /** Label periode, mis. "01-03-2026 s/d 31-03-2026". */
  period?: string;
  /** Blok filter yang dipakai, dicetak agar hasil export dapat diaudit ulang. */
  parameters?: ReportParameter[];
  printedBy?: string | null;
  printedAt?: Date;
  orientation?: 'portrait' | 'landscape';
  /** Nilai total eksplisit per kolom; kolom tanpa override dihitung otomatis. */
  totals?: Record<string, unknown>;
  /** Tampilkan kolom nomor urut. */
  rowNumber?: boolean;
  /** Lebar area logo dalam piksel. Default 96. */
  logoWidth?: number;
  totalLabel?: string;
  emptyMessage?: string;
}

export interface ReportCompanyProfile {
  name: string;
  address: string;
  phone: string;
  email?: string;
  /** Logo perusahaan (base64 + mime); null bila belum diunggah. */
  logo?: { base64: string; mime: string } | null;
}

const NUM_FMT: Record<ReportColumnType, string | undefined> = {
  text: undefined,
  integer: '#,##0',
  number: '#,##0.00',
  currency: '"Rp"#,##0',
  date: 'dd-mm-yyyy',
  percent: '0%',
};

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1A2E1A' },
};
const ZEBRA_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  bold: true,
  size: 9,
  color: { argb: 'FFF8FAFC' },
};
const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  bold: true,
  size: 14,
  color: { argb: 'FF15803D' },
};
const COMPANY_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  bold: true,
  size: 16,
};
const LABEL_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 8,
  color: { argb: 'FF78716C' },
};
const BODY_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 9,
  color: { argb: 'FF1E293B' },
};
const BOLD_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  bold: true,
  size: 9,
  color: { argb: 'FF1E293B' },
};
const TOTAL_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  bold: true,
  size: 10,
  color: { argb: 'FF15803D' },
};
const EMPTY_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  italic: true,
  size: 10,
  color: { argb: 'FF64748B' },
};
const PERIODE_FONT: Partial<ExcelJS.Font> = {
  name: 'Calibri',
  size: 9,
  color: { argb: 'FF44403C' },
};
const THIN_SIDE: ExcelJS.Border = {
  style: 'thin',
  color: { argb: 'FFE2E8F0' },
};
const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: THIN_SIDE,
  bottom: THIN_SIDE,
  left: THIN_SIDE,
  right: THIN_SIDE,
};
const TOTAL_BORDER: ExcelJS.Border = {
  style: 'double',
  color: { argb: 'FF15803D' },
};

function formatDateId(value: Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Membangun satu sheet laporan dengan standar cetak yang seragam:
 * kop perusahaan + judul + periode + blok parameter, tabel dengan header
 * beku dan autoFilter, baris total, judul kolom berulang tiap halaman,
 * serta nomor halaman di footer.
 */
export function buildReportSheet<T>(
  wb: ExcelJS.Workbook,
  options: ReportSheetOptions<T>,
): ExcelJS.Worksheet {
  const {
    sheetName,
    title,
    columns,
    rows,
    company,
    period,
    parameters = [],
    printedBy,
    printedAt = new Date(),
    orientation = 'landscape',
    totals = {},
    rowNumber = true,
    totalLabel = 'TOTAL',
    emptyMessage = 'Tidak ada data',
  } = options;

  const withNumber = rowNumber;
  const columnCount = columns.length + (withNumber ? 1 : 0);
  const lastColumnLetter = columnLetter(columnCount);

  const ws = wb.addWorksheet(sheetName, {
    pageSetup: {
      paperSize: 9,
      orientation,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  ws.columns = [
    ...(withNumber ? [{ width: 6 }] : []),
    ...columns.map((c) => ({ width: c.width })),
  ];

  let row = 1;
  // Kolom teks kop. Bila logo ada, baris 1-2 dicadangkan untuk logo
  // dan teks Bergeser ke kanan agar tidak tertimpa gambar.
  const logoExtension = company.logo ? extensionForMime(company.logo.mime) : null;
  const hasLogo = Boolean(company.logo && logoExtension);
  const textStartColumn = hasLogo ? 3 : 1;

  if (hasLogo && company.logo && logoExtension) {
    const imageId = wb.addImage({
      base64: company.logo.base64,
      extension: logoExtension,
    });
    ws.mergeCells(1, 1, 2, 2);
    const cell = ws.getCell(1, 1);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    // Ukuran dihitung dari rasio aspek asli, bukan dikotakkan, agar
    // logo lebar/tinggi tidak tergencet.
    const logoBox = { width: options.logoWidth ?? 96, height: 44 };
    const natural = readImageSize(
      Buffer.from(company.logo.base64, 'base64'),
    );
    const sized = natural ? fitInside(natural, logoBox) : logoBox;
    ws.addImage(imageId, {
      tl: { col: 0.05, row: 0.05 },
      ext: { width: sized.width, height: sized.height },
    });
    ws.getRow(1).height = 26;
    ws.getRow(2).height = 26;
    row = 3;
  }

  ws.mergeCells(row, textStartColumn, row, columnCount);
  const companyCell = ws.getCell(row, textStartColumn);
  companyCell.value = company.name;
  companyCell.font = COMPANY_FONT;
  companyCell.alignment = { horizontal: 'left', vertical: 'middle' };
  row++;

  for (const line of [
    company.address,
    [company.phone, company.email].filter(Boolean).join(' | '),
  ]) {
    if (!line) continue;
    ws.mergeCells(row, textStartColumn, row, columnCount);
    const cell = ws.getCell(row, textStartColumn);
    cell.value = line;
    cell.font = LABEL_FONT;
    row++;
  }

  ws.mergeCells(row, 1, row, columnCount);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = title;
  titleCell.font = TITLE_FONT;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(row).height = 22;
  row++;

  if (period) {
    ws.mergeCells(row, 1, row, columnCount);
    const cell = ws.getCell(row, 1);
    cell.value = `Periode: ${period}`;
    cell.font = PERIODE_FONT;
    cell.alignment = { horizontal: 'center' };
    row++;
  }

  row++;
  const headerRowIndex = row;
  const headerRow = ws.getRow(headerRowIndex);
  if (withNumber) headerRow.getCell(1).value = 'No';
  columns.forEach((column, i) => {
    headerRow.getCell(i + (withNumber ? 2 : 1)).value = column.header;
  });
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = CELL_BORDER;
  });
  headerRow.height = 26;
  headerRow.commit();

  if (parameters.length > 0) {
    row++;
    parameters.forEach((parameter) => {
      ws.getCell(row, 1).value = parameter.label;
      ws.getCell(row, 1).font = LABEL_FONT;
      ws.mergeCells(row, 2, row, Math.min(5, columnCount));
      const valueCell = ws.getCell(row, 2);
      valueCell.value = parameter.value;
      valueCell.font = BOLD_FONT;
      row++;
    });
    row++;
  }

  ws.views = [
    {
      state: 'frozen',
      xSplit: withNumber ? 1 : 0,
      ySplit: headerRowIndex,
    },
  ];

  rows.forEach((dataRow, index) => {
    const excelRow = ws.addRow({});
    if (withNumber) excelRow.getCell(1).value = index + 1;
    columns.forEach((column, i) => {
      const cell = excelRow.getCell(i + (withNumber ? 2 : 1));
      const raw = (dataRow as any)[column.key];
      cell.value = (column.format
        ? column.format(raw, dataRow, index)
        : coerce(raw, column.type)) as ExcelJS.CellValue;
      const numFmt = NUM_FMT[column.type ?? 'text'];
      if (numFmt) cell.numFmt = numFmt;
      cell.font = BODY_FONT;
      cell.alignment = {
        horizontal: column.align ?? defaultAlign(column.type),
        vertical: 'middle',
      };
      cell.border = CELL_BORDER;
    });
    if (index % 2 === 1) {
      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = ZEBRA_FILL;
      });
    }
    excelRow.commit();
  });

  if (rows.length === 0) {
    const emptyRow = ws.addRow({});
    if (columnCount > 1) ws.mergeCells(rowIndexOf(emptyRow), 1, rowIndexOf(emptyRow), columnCount);
    const cell = ws.getCell(rowIndexOf(emptyRow), 1);
    cell.value = emptyMessage;
    cell.font = EMPTY_FONT;
    cell.alignment = { horizontal: 'center' };
  }

  const totalColumns = columns.filter((c) => c.total);
  if (totalColumns.length > 0) {
    row = ws.rowCount + 1;
    const totalRow = ws.getRow(row);
    const labelCell = totalRow.getCell(1);
    labelCell.value = totalLabel;
    labelCell.font = TOTAL_FONT;
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
    columns.forEach((column, i) => {
      const cell = totalRow.getCell(i + (withNumber ? 2 : 1));
      if (column.total) {
        const value = Object.prototype.hasOwnProperty.call(totals, column.key)
          ? totals[column.key]
          : rows.reduce(
              (sum, dataRow) => sum + toNumber((dataRow as any)[column.key]),
              0,
            );
        cell.value = toNumber(value);
        const numFmt = NUM_FMT[column.type ?? 'text'];
        if (numFmt) cell.numFmt = numFmt;
        cell.font = TOTAL_FONT;
        cell.alignment = { horizontal: 'right' };
      }
      cell.border = { top: TOTAL_BORDER, bottom: TOTAL_BORDER };
    });
    totalRow.height = 20;
    totalRow.commit();
  }

  ws.autoFilter = {
    from: {
      row: headerRowIndex,
      column: 1,
    },
    to: {
      row: headerRowIndex,
      column: columnCount,
    },
  };

  ws.pageSetup.printTitlesRow = `1:${headerRowIndex}`;
  ws.headerFooter = {
    oddFooter: `&L&"Calibri,Italic"&8${company.name}&C&"Calibri,Italic"&8Halaman &P dari &N&R&"Calibri,Italic"&8Dicetak ${formatDateId(printedAt)}${printedBy ? ` oleh ${printedBy}` : ''}`,
  };

  if (lastColumnLetter) ws.pageSetup.printArea = `A1:${lastColumnLetter}${ws.rowCount}`;

  return ws;
}

export function createReportWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

/** Membangun workbook satu-sheet lalu serialize menjadi buffer XLSX. */
export async function createReportFile<T>(
  options: ReportSheetOptions<T>,
): Promise<Buffer> {
  const wb = createReportWorkbook();
  buildReportSheet(wb, options);
  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function columnLetter(count: number): string {
  let result = '';
  let n = count;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function rowIndexOf(excelRow: ExcelJS.Row): number {
  return (excelRow as any).number;
}

function defaultAlign(type?: ReportColumnType): 'left' | 'center' | 'right' {
  if (type === 'currency' || type === 'number' || type === 'percent')
    return 'right';
  if (type === 'integer' || type === 'date') return 'center';
  return 'left';
}

function coerce(value: unknown, type?: ReportColumnType): ExcelJS.CellValue {
  if (value === null || value === undefined || value === '') return '-';
  if (type === 'date') {
    if (value instanceof Date) return value;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed;
  }
  if (type === 'currency' || type === 'number' || type === 'percent')
    return toNumber(value);
  if (type === 'integer') return Math.round(toNumber(value));
  return value as ExcelJS.CellValue;
}

export { formatDateId };
