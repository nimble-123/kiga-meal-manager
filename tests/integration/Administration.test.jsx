import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

async function setupAdmin(extraStore = {}) {
  seedStore({
    children: testChildren,
    gruppen: ['Delfin'],
    tourCompleted: true,
    ...extraStore,
  });
  render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));
  fireEvent.click(screen.getByText(/Verwaltung/));
  await waitFor(() => screen.getByText(/Stammdaten Import \/ Export/));
}

describe('Administration', () => {
  beforeEach(() => {
    resetStore();
    Object.values(window.api).forEach((v) => {
      if (typeof v === 'object' && v !== null) {
        Object.values(v).forEach((fn) => fn?.mockReset?.());
      } else {
        v?.mockReset?.();
      }
    });
  });

  it('zeigt alle 5 Hauptsektionen', async () => {
    await setupAdmin();
    expect(screen.getByText(/Stammdaten Import \/ Export/)).toBeInTheDocument();
    expect(screen.getByText(/Bewegungsdaten Import \/ Export/)).toBeInTheDocument();
    expect(screen.getByText(/Testdaten generieren/)).toBeInTheDocument();
    expect(screen.getByText(/Backup \/ Restore/)).toBeInTheDocument();
    expect(screen.getByText(/System-Info/)).toBeInTheDocument();
  });

  it('Stammdaten-CSV-Export ruft saveCSV auf', async () => {
    await setupAdmin();
    const csvButtons = screen.getAllByText(/CSV exportieren/);
    fireEvent.click(csvButtons[0]); // Stammdaten-Sektion
    await waitFor(() => expect(window.api.saveCSV).toHaveBeenCalled());
    const call = window.api.saveCSV.mock.calls[0][0];
    expect(call.content).toContain('Müller, Emma');
    expect(call.content).toContain('Delfin');
  });

  it('Stammdaten-JSON-Export ruft saveFile mit gültigem JSON auf', async () => {
    await setupAdmin();
    const jsonButtons = screen.getAllByText(/JSON exportieren/);
    fireEvent.click(jsonButtons[0]);
    await waitFor(() => expect(window.api.saveFile).toHaveBeenCalled());
    const call = window.api.saveFile.mock.calls[0][0];
    expect(call.filename).toMatch(/Stammdaten_.*\.json$/);
    const parsed = JSON.parse(call.content);
    // Format: Array von Children
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].name).toBe('Müller, Emma');
  });

  it('"Alle löschen" zeigt ConfirmDialog mit Stammdaten-Text', async () => {
    await setupAdmin();
    fireEvent.click(screen.getByText(/Alle löschen.*Kinder/));
    await waitFor(() => expect(screen.getByText(/Alle Stammdaten löschen\?/)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Abbrechen'));
    await waitFor(() => {
      expect(screen.queryByText(/Alle Stammdaten löschen\?/)).not.toBeInTheDocument();
    });
  });

  it('Backup erstellen ruft saveFile mit Backup-Inhalt', async () => {
    await setupAdmin();
    fireEvent.click(screen.getByText(/Backup \/ Restore/));
    await waitFor(() => screen.getByText(/Vollbackup erstellen/));
    fireEvent.click(screen.getByText(/Vollbackup erstellen/));
    await waitFor(() => expect(window.api.saveFile).toHaveBeenCalled());
    const call = window.api.saveFile.mock.calls[0][0];
    expect(call.filename).toMatch(/KiGa_Backup_/);
    const data = JSON.parse(call.content);
    expect(data).toHaveProperty('children');
    expect(data).toHaveProperty('gruppen');
  });

  it('System-Info zeigt Kinderzahlen', async () => {
    await setupAdmin();
    fireEvent.click(screen.getByText(/System-Info/));
    await waitFor(() => screen.getByText(/Kinder \(gesamt \/ aktiv\)/));
    expect(screen.getByText(/1 \/ 1/)).toBeInTheDocument();
  });

  it('Testdaten-Generator: Section öffnen und Generate-Klick öffnet ConfirmDialog', async () => {
    await setupAdmin();
    // Section ist kollabiert. Erst Section-Header klicken (1. Match), dann den
    // tatsächlichen Generate-Button (2. Match) klicken.
    const buttons = screen.getAllByRole('button', { name: /Testdaten generieren/ });
    fireEvent.click(buttons[0]); // Section auf
    await waitFor(() => {
      const all = screen.getAllByRole('button', { name: /Testdaten generieren/ });
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
    const allBtns = screen.getAllByRole('button', { name: /Testdaten generieren/ });
    fireEvent.click(allBtns[allBtns.length - 1]); // letzter ist der Generate-Button
    await waitFor(() => {
      expect(screen.getByText(/Testdaten generieren\?/)).toBeInTheDocument();
    });
  });
});
