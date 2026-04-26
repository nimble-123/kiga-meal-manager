import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
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
});
