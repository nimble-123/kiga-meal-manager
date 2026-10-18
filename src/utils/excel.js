// Excel-Export (.xlsx): formatierte Tabelle mit Summenzeile, druckfertig auf DIN A4.
// ExcelJS wird erst beim Export geladen, damit es nicht im Start-Bundle landet.
import { MONATE } from './dates';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const EURO = '#,##0.00 "€"';
const TEAL = 'FF2D9F93';
const BORDER = { style: 'thin', color: { argb: 'FF9AA5B1' } };
const TABLE_TOP = 4; // Zeile 1: Titel, 2: Untertitel, 3: frei, 4: Tabellenkopf

const round2 = (v) => Math.round(v * 100) / 100;

async function loadExcelJS() {
  const mod = await import('exceljs');
  return mod.default ?? mod;
}

function fmtDateDE(date) {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Baut ein Arbeitsblatt mit Titel und einer Excel-Tabelle (gebänderte Zeilen,
 * Rahmen um alle Zellen, Summenzeile als letzte Zeile) und richtet den Druck ein.
 *
 * columns: [{ header, key, width, numFmt?, sum? }]
 * rows:    [{ [key]: value }]
 */
async function buildWorkbook({ sheetName, title, subtitle, columns, rows, orientation, createdAt = new Date() }) {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'KiGa Essenverwaltung';
  wb.created = createdAt;
  wb.calcProperties.fullCalcOnLoad = true;

  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: TABLE_TOP, showGridLines: false }],
  });

  ws.getCell('A1').value = title;
  ws.getCell('A1').font = { size: 14, bold: true, color: { argb: TEAL } };
  ws.getCell('A2').value = subtitle;
  ws.getCell('A2').font = { size: 10, color: { argb: 'FF6B7280' } };

  ws.addTable({
    name: 'Abrechnung',
    ref: `A${TABLE_TOP}`,
    headerRow: true,
    totalsRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: columns.map((col, i) => ({
      name: col.header,
      filterButton: true,
      ...(i === 0 && { totalsRowLabel: 'Gesamt' }),
      ...(col.sum && {
        totalsRowFunction: 'sum',
        totalsRowResult: round2(rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0)),
      }),
    })),
    rows: rows.map((r) => columns.map((col) => r[col.key] ?? '')),
  });

  const lastRow = TABLE_TOP + rows.length + 1;
  columns.forEach((col, i) => {
    const column = ws.getColumn(i + 1);
    column.width = col.width;
    for (let r = TABLE_TOP; r <= lastRow; r++) {
      const cell = ws.getCell(r, i + 1);
      cell.border = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
      if (col.numFmt && r > TABLE_TOP) cell.numFmt = col.numFmt;
      if (col.align && r < lastRow) cell.alignment = { horizontal: col.align };
    }
  });
  ws.getRow(TABLE_TOP).font = { bold: true };
  ws.getRow(lastRow).font = { bold: true };

  ws.pageSetup = {
    paperSize: 9, // DIN A4
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0, // beliebig viele Seiten nach unten
    horizontalCentered: true,
    printTitlesRow: `${TABLE_TOP}:${TABLE_TOP}`,
    margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
  };
  ws.headerFooter = {
    oddHeader: `&L&B${title}&RKiGa Mitte`,
    oddFooter: `&LErstellt am ${fmtDateDE(createdAt)}&RSeite &P von &N`,
  };

  return wb;
}

/** Monatsabrechnung: eine Zeile pro Kind, Summenzeile über Anzahl Essen und Betrag. */
export function buildMonthWorkbook({ year, month, gruppe, children, summary, createdAt }) {
  return buildWorkbook({
    sheetName: `${MONATE[month]} ${year}`,
    title: `Essensabrechnung ${MONATE[month]} ${year}`,
    subtitle: `Gruppe: ${gruppe} · ${children.length} Kinder`,
    orientation: 'portrait',
    createdAt,
    columns: [
      { header: 'Nr', key: 'nr', width: 8, align: 'right' },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Gruppe', key: 'gruppe', width: 13 },
      { header: 'Zahlungspflichtiger', key: 'zahlungspfl', width: 26 },
      { header: 'Kassenzeichen', key: 'kassenzeichen', width: 15 },
      { header: 'Essen', key: 'count', width: 8, sum: true, numFmt: '0' },
      { header: 'Betrag', key: 'total', width: 12, sum: true, numFmt: EURO },
    ],
    rows: children.map((c, i) => {
      const s = summary[c.id] || { count: 0, total: 0 };
      return {
        nr: i + 1, name: c.name, gruppe: c.gruppe, zahlungspfl: c.zahlungspfl, kassenzeichen: c.kassenzeichen,
        count: s.count, total: round2(s.total),
      };
    }),
  });
}

/** Jahresübersicht: Beträge pro Monat und Jahressumme, Summenzeile über alle Betragsspalten. */
export function buildYearWorkbook({ year, gruppe, children, summary, createdAt }) {
  const monthCols = MONATE.map((m, i) => ({ header: m.slice(0, 3), key: `m${i}`, width: 10, sum: true, numFmt: EURO }));
  return buildWorkbook({
    sheetName: `Jahr ${year}`,
    title: `Jahresübersicht ${year}`,
    subtitle: `Gruppe: ${gruppe} · ${children.length} Kinder`,
    orientation: 'landscape',
    createdAt,
    columns: [
      { header: 'Nr', key: 'nr', width: 8, align: 'right' },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Gruppe', key: 'gruppe', width: 12 },
      { header: 'Kassenzeichen', key: 'kassenzeichen', width: 13 },
      ...monthCols,
      { header: 'Jahressumme', key: 'total', width: 13, sum: true, numFmt: EURO },
    ],
    rows: children.map((c, i) => {
      const ys = summary[c.id] || { months: Array(12).fill(0), total: 0 };
      const row = { nr: i + 1, name: c.name, gruppe: c.gruppe, kassenzeichen: c.kassenzeichen, total: round2(ys.total) };
      ys.months.forEach((v, m) => (row[`m${m}`] = round2(v)));
      return row;
    }),
  });
}

/** Serialisiert ein Workbook als .xlsx-Bytes. */
export async function workbookToBytes(wb) {
  return new Uint8Array(await wb.xlsx.writeBuffer());
}

/** Speichert eine .xlsx-Datei (Electron: Speichern-Dialog, Browser: Download). */
export function downloadXLSX(filename, data) {
  if (window.api?.saveXLSX) return window.api.saveXLSX({ filename, data });
  const blob = new Blob([data], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
