import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EmptyState from '../../src/components/EmptyState';

describe('EmptyState', () => {
  let alertSpy;
  beforeEach(() => {
    window.api.openFile.mockReset();
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('rendert Welcome-Text und 3 Aktions-Buttons', () => {
    render(<EmptyState onImport={() => {}} onAddChild={() => {}} onStartTour={() => {}} />);
    expect(screen.getByText(/Willkommen bei KiGa Essenverwaltung/)).toBeInTheDocument();
    expect(screen.getByText(/Kinder aus CSV importieren/)).toBeInTheDocument();
    expect(screen.getByText(/Kind manuell anlegen/)).toBeInTheDocument();
    expect(screen.getByText(/App-Tour starten/)).toBeInTheDocument();
  });

  it('Klick auf "Kind manuell anlegen" ruft onAddChild auf', () => {
    const onAddChild = vi.fn();
    render(<EmptyState onImport={() => {}} onAddChild={onAddChild} onStartTour={() => {}} />);
    fireEvent.click(screen.getByText(/Kind manuell anlegen/));
    expect(onAddChild).toHaveBeenCalled();
  });

  it('Klick auf "App-Tour starten" ruft onStartTour auf', () => {
    const onStartTour = vi.fn();
    render(<EmptyState onImport={() => {}} onAddChild={() => {}} onStartTour={onStartTour} />);
    fireEvent.click(screen.getByText(/App-Tour starten/));
    expect(onStartTour).toHaveBeenCalled();
  });

  it('CSV-Import: ruft onImport mit Kindern und extrahierten Gruppen auf', async () => {
    window.api.openFile.mockResolvedValue({
      success: true,
      content: 'Name;Gruppe\nMüller, Emma;Delfin\nFischer, Lian;Dino\n',
    });
    const onImport = vi.fn();
    render(<EmptyState onImport={onImport} onAddChild={() => {}} onStartTour={() => {}} />);
    fireEvent.click(screen.getByText(/Kinder aus CSV importieren/));

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    const [children, gruppen] = onImport.mock.calls[0];
    expect(children).toHaveLength(2);
    expect(children[0].name).toBe('Müller, Emma');
    expect(gruppen).toEqual(expect.arrayContaining(['Delfin', 'Dino']));
  });

  it('CSV-Import: ruft onImport NICHT auf wenn User abbricht', async () => {
    window.api.openFile.mockResolvedValue({ success: false });
    const onImport = vi.fn();
    render(<EmptyState onImport={onImport} onAddChild={() => {}} onStartTour={() => {}} />);
    fireEvent.click(screen.getByText(/Kinder aus CSV importieren/));
    await new Promise((r) => setTimeout(r, 10));
    expect(onImport).not.toHaveBeenCalled();
  });

  it('CSV-Import: zeigt Alert bei Parse-Fehlern (Zeile ohne Name)', async () => {
    window.api.openFile.mockResolvedValue({
      success: true,
      // Zweite Zeile hat leeren Namen → parser meldet Fehler
      content: 'Name;Gruppe\n;Delfin\nMüller, Emma;Dino\n',
    });
    const onImport = vi.fn();
    render(<EmptyState onImport={onImport} onAddChild={() => {}} onStartTour={() => {}} />);
    fireEvent.click(screen.getByText(/Kinder aus CSV importieren/));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(alertSpy.mock.calls[0][0]).toMatch(/Name fehlt/);
    // Müller wird trotz Fehler importiert (1 Eintrag), Gruppen extrahiert
    expect(onImport).toHaveBeenCalled();
  });
});
