import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import ExcelJS from 'exceljs';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: 'Müller, Sandra', adresse: '', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: false, zahlungspfl: 'Fischer, Maria', adresse: '', kassenzeichen: '10.002', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

async function readSheet(data) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  return wb.worksheets[0];
}

async function setupMonth(extraStore = {}) {
  seedStore({
    children: testChildren,
    gruppen: ['Delfin', 'Dino'],
    tourCompleted: true,
    ...extraStore,
  });
  render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));
  fireEvent.click(screen.getByText(/Monatsübersicht/));
  await waitFor(() => screen.getByText(/CSV Export/));
}

describe('MonthlyReport', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('zeigt Spaltenüberschriften mit Sortier-Headers', async () => {
    await setupMonth();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Gruppe')).toBeInTheDocument();
    expect(screen.getByText('Zahlungspflichtiger')).toBeInTheDocument();
    expect(screen.getByText('Kassenzeichen')).toBeInTheDocument();
    expect(screen.getByText('Essen')).toBeInTheDocument();
    expect(screen.getByText('Betrag')).toBeInTheDocument();
  });

  it('zeigt 0 Essen und – als Betrag bei leerem Monat', async () => {
    await setupMonth();
    // Footer: 0 Essen
    await waitFor(() => {
      expect(screen.getByText(/Gesamt:\s*0\s*Essen/)).toBeInTheDocument();
    });
    // Betrag-Spalte zeigt "–"
    const emmaRow = screen.getByText('Müller, Emma').closest('tr');
    expect(emmaRow.textContent).toContain('\u2013');
  });

  it('aggregiert Essen aus mehreren Tagen eines Monats', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
        '2026-04-09': { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} },
      },
    });

    // Monat April auswählen, Jahr 2026
    const monthSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(monthSelect, { target: { value: '3' } }); // April = index 3
    const yearInput = screen.getByDisplayValue(String(new Date().getFullYear()));
    fireEvent.change(yearInput, { target: { value: '2026' } });

    await waitFor(() => {
      // Footer: 3 Essen, 10,50 €
      expect(screen.getByText(/Gesamt:\s*3\s*Essen/)).toBeInTheDocument();
    });
    expect(screen.getByText(/10,50/)).toBeInTheDocument();
  });

  it('respektiert Gruppen-Filter im Footer', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
      },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } }); // April
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });

    // Gruppen-Filter (3. Combobox: Monat, Gruppen-Filter — kein, Filter ist 2. select)
    const selects = screen.getAllByRole('combobox');
    // selects[0] = Monat, selects[1] = Gruppen-Filter
    fireEvent.change(selects[1], { target: { value: 'Delfin' } });

    await waitFor(() => {
      // Nur Müller (Delfin) sichtbar, Fischer ausgeblendet
      expect(screen.queryByText('Fischer, Lian')).not.toBeInTheDocument();
      // Footer zeigt 1 Essen (nur Müller in Delfin)
      expect(screen.getByText(/Gesamt:\s*1\s*Essen/)).toBeInTheDocument();
    });
  });

  it('CSV-Export ruft window.api.saveCSV mit korrektem Format auf', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} },
      },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });

    // Wait for summary
    await waitFor(() => screen.getByText(/Gesamt:\s*1\s*Essen/));

    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => {
      expect(window.api.saveCSV).toHaveBeenCalled();
    });
    const call = window.api.saveCSV.mock.calls[0][0];
    expect(call.filename).toMatch(/Essensabrechnung_April_2026\.csv/);
    expect(call.content).toContain('Nr;Name;Gruppe;Zahlungspflichtiger;Kassenzeichen;Anzahl Essen;Betrag');
    expect(call.content).toContain('Müller, Emma;Delfin');
    expect(call.content).toContain(';3,50'); // Dezimalkomma
  });

  it('CSV-Export enthält Gesamtsummen-Zeile über alle Kinder', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
        '2026-04-09': { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} },
      },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });

    await waitFor(() => screen.getByText(/Gesamt:\s*3\s*Essen/));

    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => {
      expect(window.api.saveCSV).toHaveBeenCalled();
    });
    const lines = window.api.saveCSV.mock.calls.at(-1)[0].content.trim().split('\n');
    // Letzte Zeile ist die Gesamtsumme: 3 Essen, 10,50 €
    expect(lines[lines.length - 1]).toBe(';Gesamt;;;;3;10,50');
  });

  it('Gesamtsummen-Zeile berücksichtigt den Gruppen-Filter', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
      },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Delfin' } });

    await waitFor(() => screen.getByText(/Gesamt:\s*1\s*Essen/));

    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => {
      expect(window.api.saveCSV).toHaveBeenCalled();
    });
    const lines = window.api.saveCSV.mock.calls.at(-1)[0].content.trim().split('\n');
    // Nur Delfin-Kind zählt: 1 Essen, 3,50 €
    expect(lines[lines.length - 1]).toBe(';Gesamt;;;;1;3,50');
  });

  it('Excel-Export speichert eine .xlsx mit Summenzeile als letzter Zeile', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
        '2026-04-09': { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} },
      },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });
    await waitFor(() => screen.getByText(/Gesamt:\s*3\s*Essen/));

    fireEvent.click(screen.getByText(/Excel Export/));
    await waitFor(() => expect(window.api.saveXLSX).toHaveBeenCalled());
    const call = window.api.saveXLSX.mock.calls.at(-1)[0];
    expect(call.filename).toBe('Essensabrechnung_April_2026.xlsx');

    const ws = await readSheet(call.data);
    expect(ws.getCell('B5').value).toBe('Fischer, Lian'); // angezeigte Sortierung (Name)
    const last = ws.getRow(ws.rowCount);
    expect(last.getCell(1).value).toBe('Gesamt');
    expect(last.getCell(6).value.result).toBe(3);
    expect(last.getCell(7).value.result).toBe(10.5);
  });

  it('Excel-Export berücksichtigt den Gruppen-Filter', async () => {
    await setupMonth({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
      },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Delfin' } });
    await waitFor(() => screen.getByText(/Gesamt:\s*1\s*Essen/));

    fireEvent.click(screen.getByText(/Excel Export/));
    await waitFor(() => expect(window.api.saveXLSX).toHaveBeenCalled());
    const ws = await readSheet(window.api.saveXLSX.mock.calls.at(-1)[0].data);
    expect(ws.rowCount).toBe(6); // Titel, Untertitel, Leerzeile, Kopf, 1 Kind, Gesamt
    expect(ws.getCell('A2').value).toContain('Gruppe: Delfin');
    expect(ws.getRow(6).getCell(7).value.result).toBe(3.5);
  });

  it('E-Mail-Button hängt die Excel-Abrechnung an', async () => {
    await setupMonth();
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
    fireEvent.change(screen.getByDisplayValue(String(new Date().getFullYear())), { target: { value: '2026' } });

    fireEvent.click(screen.getByText(/Per E-Mail/));
    await waitFor(() => {
      expect(window.api.sendEmailWithAttachment).toHaveBeenCalled();
    });
    const args = window.api.sendEmailWithAttachment.mock.calls[0][0];
    expect(args.subject).toContain('Essensabrechnung April 2026');
    expect(args.filename).toBe('Essensabrechnung_April_2026.xlsx');
    expect((await readSheet(args.data)).getCell('A1').value).toBe('Essensabrechnung April 2026');
  });
});
