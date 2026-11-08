import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import App from '../../src/App';
import ExcelJS from 'exceljs';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '10.002', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

// Emma: 2,55 + 2,50 = 5,05 € → 5 €; Lian: 2,75 + 2,75 = 5,50 € → 6 €
const aprilMeals = {
  'meals-2026-04': {
    '2026-04-08': { prices: { A: 2.55, B: 2.75 }, selections: { c1: 'A', c2: 'B' }, abmeldungen: {} },
    '2026-04-09': { prices: { A: 2.5, B: 2.75 }, selections: { c1: 'A', c2: 'B' }, abmeldungen: {} },
  },
  // Emma: 3,60 € → 4 €
  'meals-2026-05': {
    '2026-05-04': { prices: { B: 3.6 }, selections: { c1: 'B' }, abmeldungen: {} },
  },
};

async function renderApp(extraStore = {}) {
  seedStore({ children: testChildren, gruppen: ['Delfin', 'Dino'], tourCompleted: true, ...aprilMeals, ...extraStore });
  render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));
}

async function openApril() {
  fireEvent.click(screen.getByText(/Monatsübersicht/));
  await waitFor(() => screen.getByText(/CSV Export/));
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '3' } });
  await waitFor(() => screen.getByText(/Gesamt:\s*4\s*Essen/));
}

function roundingCheckbox() {
  fireEvent.click(screen.getByRole('button', { name: /Verwaltung/ }));
  fireEvent.click(screen.getByText(/Abrechnung/));
  const section = screen.getByText(/Abrechnung/).closest('.card');
  return within(section).getByRole('checkbox', { name: /Monatssumme auf volle Euro runden/ });
}

describe('Rundung der Monatssumme', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('ist standardmäßig aktiv und rundet pro Kind kaufmännisch', async () => {
    await renderApp();
    await openApril();

    const emmaRow = screen.getByText('Müller, Emma').closest('tr');
    const lianRow = screen.getByText('Fischer, Lian').closest('tr');
    expect(emmaRow.textContent).toContain('5,00 €');
    expect(lianRow.textContent).toContain('6,00 €');
    // Tooltip zeigt den exakten Betrag
    expect(within(emmaRow).getByText('5,00 €').closest('td').getAttribute('data-tooltip')).toBe('exakt 5,05 €');
    // Gesamt = Summe der gerundeten Beträge
    expect(screen.getByText('11,00 €')).toBeInTheDocument();
    expect(screen.getByText(/auf volle Euro gerundet/)).toBeInTheDocument();
  });

  it('exportiert gerundete Beträge in CSV und Excel', async () => {
    await renderApp();
    await openApril();

    fireEvent.click(screen.getByText(/CSV Export/));
    await waitFor(() => expect(window.api.saveCSV).toHaveBeenCalled());
    const lines = window.api.saveCSV.mock.calls.at(-1)[0].content.trim().split('\n');
    expect(lines.find((l) => l.includes('Müller, Emma'))).toMatch(/;2;5,00$/);
    expect(lines.find((l) => l.includes('Fischer, Lian'))).toMatch(/;2;6,00$/);
    expect(lines.at(-1)).toBe(';Gesamt;;;;4;11,00');

    fireEvent.click(screen.getByText(/Excel Export/));
    await waitFor(() => expect(window.api.saveXLSX).toHaveBeenCalled());
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(window.api.saveXLSX.mock.calls.at(-1)[0].data);
    const ws = wb.worksheets[0];
    expect(ws.getRow(ws.rowCount).getCell(7).value.result).toBe(11);
  });

  it('Jahresübersicht summiert die gerundeten Monatsbeträge', async () => {
    await renderApp();
    fireEvent.click(screen.getByText(/Jahresübersicht/));
    await waitFor(
      () => {
        const emmaRow = screen.getByText('Müller, Emma').closest('tr');
        // April 5 € + Mai 4 € = 9 €
        expect(emmaRow.textContent).toContain('5,00');
        expect(emmaRow.textContent).toContain('4,00');
        expect(emmaRow.textContent).toContain('9,00 €');
      },
      { timeout: 5000 }
    );
    // Gesamt: Emma 9 € + Lian 6 € = 15 €
    expect(screen.getByText('15,00 €')).toBeInTheDocument();
  });

  it('rechnet centgenau, wenn die Rundung in der Verwaltung ausgeschaltet wird', async () => {
    await renderApp();
    const cb = roundingCheckbox();
    expect(cb).toBeChecked();
    fireEvent.click(cb);
    await waitFor(() => expect(window.api.store.set).toHaveBeenCalledWith('monthRounding', false));

    await openApril();
    expect(screen.getByText('Müller, Emma').closest('tr').textContent).toContain('5,05 €');
    expect(screen.getByText('10,55 €')).toBeInTheDocument();
    expect(screen.queryByText(/auf volle Euro gerundet/)).not.toBeInTheDocument();
  });

  it('respektiert eine gespeicherte Deaktivierung', async () => {
    await renderApp({ monthRounding: false });
    await openApril();
    await waitFor(() => expect(screen.getByText('Fischer, Lian').closest('tr').textContent).toContain('5,50 €'));
    expect(roundingCheckbox()).not.toBeChecked();
  });
});
