import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import ExcelJS from 'exceljs';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '10.002', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

async function setupYear(extraStore = {}) {
  seedStore({
    children: testChildren,
    gruppen: ['Delfin', 'Dino'],
    tourCompleted: true,
    ...extraStore,
  });
  render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));
  fireEvent.click(screen.getByText(/Jahresübersicht/));
  await waitFor(() => screen.getByText('Jan'));
}

describe('YearlyReport', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('rendert 12 Monatsspalten + Gesamt', async () => {
    await setupYear();
    for (const m of ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']) {
      expect(screen.getByText(m)).toBeInTheDocument();
    }
    expect(screen.getByText('Gesamt')).toBeInTheDocument();
  });

  it('zeigt – in allen Monaten bei leerem Jahr', async () => {
    await setupYear();
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });

    await waitFor(() => screen.getByText(/Jahressumme/));
    const emmaRow = screen.getByText('Müller, Emma').closest('tr');
    // Jeder Monatswert ist – (Em-Dash)
    const dashes = emmaRow.querySelectorAll('td');
    // Erste 2 Spalten: # und Name. Dann 12 Monate, dann Gesamt. Insgesamt 15.
    expect(dashes.length).toBe(15);
  });

  it('aggregiert Daten über mehrere Monate', async () => {
    // Pinned date: 2026-06-15 → selectedYear default = 2026
    await setupYear({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A' } },
      },
      'meals-2026-05': {
        '2026-05-04': { prices: { B: 4 }, selections: { c1: 'B' } },
      },
    });

    // Aggregation läuft beim Mount für 2026. Warten auf "2 Essen" im Footer.
    await waitFor(
      () => {
        const footer = document.body.textContent;
        expect(footer).toMatch(/Gesamt:\s*2\s*Essen/);
        expect(footer).toContain('7,50');
      },
      { timeout: 5000 }
    );
  });

  it('CSV-Export ruft saveCSV mit allen Monatsspalten auf', async () => {
    await setupYear({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A' } },
      },
    });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });
    await waitFor(() => screen.getByText(/Jahressumme/));

    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => expect(window.api.saveCSV).toHaveBeenCalled());
    const call = window.api.saveCSV.mock.calls[window.api.saveCSV.mock.calls.length - 1][0];
    expect(call.filename).toMatch(/Jahresuebersicht_2026\.csv/);
    expect(call.content).toContain('Januar;Februar;März');
    expect(call.content).toContain('Jahressumme');
    // Dezimalkomma im Export
    expect(call.content).toContain(';3,50');
  });

  it('CSV-Export endet mit einer Gesamtsummen-Zeile und berücksichtigt den Gruppen-Filter', async () => {
    await setupYear({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' } },
        '2026-04-09': { prices: { A: 4 }, selections: { c1: 'A' } },
      },
      'meals-2026-05': {
        '2026-05-06': { prices: { A: 3 }, selections: { c2: 'A' } },
      },
    });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });
    await waitFor(() => expect(document.body.textContent).toMatch(/Gesamt:\s*4\s*Essen/), { timeout: 5000 });

    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => expect(window.api.saveCSV).toHaveBeenCalled());
    let lines = window.api.saveCSV.mock.calls.at(-1)[0].content.trim().split('\n');
    // Apr: 3,50 + 3,50 + 4,00 = 11,00 · Mai: 3,00 · Jahr: 14,00
    expect(lines.at(-1)).toBe(';Gesamt;;;0,00;0,00;0,00;11,00;3,00;0,00;0,00;0,00;0,00;0,00;0,00;0,00;14,00');

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Delfin' } });
    await waitFor(() => expect(document.body.textContent).toMatch(/Gesamt:\s*2\s*Essen/));
    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => expect(window.api.saveCSV).toHaveBeenCalledTimes(2));
    lines = window.api.saveCSV.mock.calls.at(-1)[0].content.trim().split('\n');
    expect(lines).toHaveLength(3); // Kopf, 1 Kind, Gesamt
    expect(lines.at(-1)).toBe(';Gesamt;;;0,00;0,00;0,00;7,50;0,00;0,00;0,00;0,00;0,00;0,00;0,00;0,00;7,50');
  });

  it('Excel-Export speichert eine .xlsx mit Summenzeile als letzter Zeile', async () => {
    await setupYear({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A' } },
      },
    });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });
    await waitFor(() => expect(document.body.textContent).toMatch(/Gesamt:\s*1\s*Essen/), { timeout: 5000 });

    fireEvent.click(screen.getByText(/Excel Export/));
    await waitFor(() => expect(window.api.saveXLSX).toHaveBeenCalled());
    const call = window.api.saveXLSX.mock.calls.at(-1)[0];
    expect(call.filename).toBe('Jahresuebersicht_2026.xlsx');

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(call.data);
    const ws = wb.worksheets[0];
    expect(ws.pageSetup.orientation).toBe('landscape');
    const last = ws.getRow(ws.rowCount);
    expect(last.getCell(1).value).toBe('Gesamt');
    expect(last.getCell(8).value.result).toBe(3.5); // April
    expect(last.getCell(17).value.result).toBe(3.5); // Jahressumme
  });
});
