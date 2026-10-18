import ExcelJS from 'exceljs';
import { buildMonthWorkbook, buildYearWorkbook, workbookToBytes } from '../../src/utils/excel';

const children = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', zahlungspfl: 'Müller, Sandra', kassenzeichen: '10.001' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', zahlungspfl: 'Fischer, Maria', kassenzeichen: '10.002' },
  { id: 'c3', name: 'Weber, Mathis', gruppe: 'Delfin', zahlungspfl: 'Weber, Stefan', kassenzeichen: '10.003' },
];
const createdAt = new Date('2025-11-26T10:00:00');

// Schreibt das Workbook als .xlsx und liest es zurück – prüft also die echte Datei
async function roundtrip(wb) {
  const bytes = await workbookToBytes(wb);
  const read = new ExcelJS.Workbook();
  await read.xlsx.load(bytes);
  return read.worksheets[0];
}

describe('buildMonthWorkbook', () => {
  const summary = {
    c1: { count: 18, total: 63.45 },
    c2: { count: 12, total: 42.1 },
    // c3 hat keine Essen
  };

  it('schreibt Titel, Kopfzeile und eine Zeile pro Kind', async () => {
    const ws = await roundtrip(await buildMonthWorkbook({ year: 2025, month: 10, gruppe: 'Alle', children, summary, createdAt }));
    expect(ws.name).toBe('November 2025');
    expect(ws.getCell('A1').value).toBe('Essensabrechnung November 2025');
    expect(ws.getRow(4).values.slice(1)).toEqual(['Nr', 'Name', 'Gruppe', 'Zahlungspflichtiger', 'Kassenzeichen', 'Essen', 'Betrag']);
    expect(ws.getRow(5).values.slice(1)).toEqual([1, 'Müller, Emma', 'Delfin', 'Müller, Sandra', '10.001', 18, 63.45]);
    expect(ws.getRow(7).values.slice(1)).toEqual([3, 'Weber, Mathis', 'Delfin', 'Weber, Stefan', '10.003', 0, 0]);
  });

  it('endet mit einer Summenzeile über Essen und Betrag', async () => {
    const ws = await roundtrip(await buildMonthWorkbook({ year: 2025, month: 10, gruppe: 'Alle', children, summary, createdAt }));
    const total = ws.getRow(8);
    expect(ws.rowCount).toBe(8);
    expect(total.getCell(1).value).toBe('Gesamt');
    expect(total.getCell(6).value).toMatchObject({ formula: 'SUBTOTAL(109,Abrechnung[Essen])', result: 30 });
    expect(total.getCell(7).value).toMatchObject({ formula: 'SUBTOTAL(109,Abrechnung[Betrag])', result: 105.55 });
    expect(total.font.bold).toBe(true);
  });

  it('formatiert als Tabelle mit gebänderten Zeilen und Rahmen um alle Zellen', async () => {
    const wb = await buildMonthWorkbook({ year: 2025, month: 10, gruppe: 'Alle', children, summary, createdAt });
    const table = wb.worksheets[0].getTable('Abrechnung').table;
    expect(table.totalsRow).toBe(true);
    expect(table.style).toMatchObject({ theme: 'TableStyleMedium2', showRowStripes: true });

    const ws = await roundtrip(wb);
    for (const addr of ['A4', 'D6', 'G8']) {
      expect(ws.getCell(addr).border).toMatchObject({ top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } });
    }
    expect(ws.getCell('G5').numFmt).toBe('#,##0.00 "€"');
  });

  it('ist auf DIN A4 hochkant in Seitenbreite eingerichtet und wiederholt die Kopfzeile', async () => {
    const ws = await roundtrip(await buildMonthWorkbook({ year: 2025, month: 10, gruppe: 'Delfin', children, summary, createdAt }));
    expect(ws.pageSetup).toMatchObject({ paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 });
    expect(ws.pageSetup.printTitlesRow).toBe('4:4');
    expect(ws.headerFooter.oddFooter).toContain('Seite &P von &N');
    expect(ws.getCell('A2').value).toBe('Gruppe: Delfin · 3 Kinder');
  });
});

describe('buildYearWorkbook', () => {
  const months = (v) => Array.from({ length: 12 }, (_, i) => (i < 2 ? v : 0));
  const summary = {
    c1: { months: months(50), total: 100 },
    c2: { months: months(25.5), total: 51 },
  };

  it('hat 12 Monatsspalten, Jahressumme und eine Summenzeile über alle Beträge', async () => {
    const ws = await roundtrip(await buildYearWorkbook({ year: 2025, gruppe: 'Alle', children, summary, createdAt }));
    const header = ws.getRow(4).values.slice(1);
    expect(header).toHaveLength(17);
    expect(header.slice(4, 6)).toEqual(['Jan', 'Feb']);
    expect(header.at(-1)).toBe('Jahressumme');

    const total = ws.getRow(8);
    expect(ws.rowCount).toBe(8);
    expect(total.getCell(1).value).toBe('Gesamt');
    expect(total.getCell(5).value).toMatchObject({ formula: 'SUBTOTAL(109,Abrechnung[Jan])', result: 75.5 });
    expect(total.getCell(17).value).toMatchObject({ formula: 'SUBTOTAL(109,Abrechnung[Jahressumme])', result: 151 });
  });

  it('ist auf DIN A4 quer eingerichtet', async () => {
    const ws = await roundtrip(await buildYearWorkbook({ year: 2025, gruppe: 'Alle', children, summary, createdAt }));
    expect(ws.pageSetup).toMatchObject({ paperSize: 9, orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 });
  });
});
