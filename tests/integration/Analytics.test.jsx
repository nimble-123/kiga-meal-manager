import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, status: 'aktiv' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: true, status: 'aktiv' },
];

async function setupAnalytics(extraStore = {}) {
  seedStore({
    children: testChildren,
    gruppen: ['Delfin', 'Dino'],
    tourCompleted: true,
    ...extraStore,
  });
  render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));
  fireEvent.click(screen.getByText(/Auswertung/));
  // Auswertung lädt 12 Monate parallel - Loading-Text dann verschwindet
  await waitFor(() => {
    expect(screen.queryByText(/Daten werden geladen/)).not.toBeInTheDocument();
  });
}

describe('Analytics', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('zeigt Empty-State bei leerem Jahr', async () => {
    await setupAnalytics();
    expect(screen.getByText(/Keine Essensdaten/)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('zeigt Year-Selector', async () => {
    await setupAnalytics();
    const yearInput = screen.getByRole('spinbutton');
    expect(yearInput).toBeInTheDocument();
    expect(yearInput.value).toBe('2026');
  });

  it('rendert Charts wenn Essensdaten vorhanden sind', async () => {
    await setupAnalytics({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' } },
      },
    });
    // Empty-State darf NICHT mehr da sein
    expect(screen.queryByText(/Keine Essensdaten/)).not.toBeInTheDocument();
    expect(screen.getByText(/Preisentwicklung pro Gericht/)).toBeInTheDocument();
    expect(screen.getByText(/Monatliche Gesamtkosten/)).toBeInTheDocument();
    expect(screen.getByText(/Essenverteilung/)).toBeInTheDocument();
  });

  it('Year-Wechsel triggert Reload', async () => {
    await setupAnalytics();
    const yearInput = screen.getByRole('spinbutton');
    fireEvent.change(yearInput, { target: { value: '2025' } });
    // Loading erscheint kurzzeitig oder verschwindet sofort
    await waitFor(() => {
      expect(screen.queryByText(/Daten werden geladen/)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Keine Essensdaten/)).toBeInTheDocument();
  });
});
