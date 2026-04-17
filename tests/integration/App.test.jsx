import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: 'Müller, Sandra', adresse: 'Str. 1', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: true, zahlungspfl: 'Fischer, Maria', adresse: 'Str. 2', kassenzeichen: '10.002', hinweise: 'vegetarisch', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c3', name: 'Weber, Theo', gruppe: 'Delfin', but: false, zahlungspfl: 'Weber, Stefan', adresse: 'Str. 3', kassenzeichen: '10.003', hinweise: '', status: 'inaktiv', eintritt: '', austritt: '' },
];

describe('App', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows EmptyState when no children', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Willkommen/)).toBeInTheDocument();
    });
  });

  it('shows EmptyState only on daily tab, other tabs accessible', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Willkommen/)).toBeInTheDocument();
    });

    // Click Stammdaten tab
    fireEvent.click(screen.getByText(/Stammdaten/));
    await waitFor(() => {
      expect(screen.getByText(/Kind hinzufügen/)).toBeInTheDocument();
    });

    // Click Verwaltung tab
    fireEvent.click(screen.getByText(/Verwaltung/));
    await waitFor(() => {
      expect(screen.getByText(/Backup/)).toBeInTheDocument();
    });
  });

  it('renders main app with children loaded', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin', 'Dino'] });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Müller, Emma')).toBeInTheDocument();
    });
  });

  it('shows version in header', async () => {
    seedStore({ children: testChildren });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    });
  });

  it('switches tabs correctly', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin', 'Dino'] });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    // Switch to Stammdaten
    fireEvent.click(screen.getByText(/Stammdaten/));
    await waitFor(() => {
      expect(screen.getByText(/Kind hinzufügen/)).toBeInTheDocument();
    });

    // Switch to Monatsübersicht
    fireEvent.click(screen.getByText(/Monatsübersicht/));
    await waitFor(() => {
      expect(screen.getByText(/CSV Export/)).toBeInTheDocument();
    });

    // Switch to Analytics
    fireEvent.click(screen.getByText(/Auswertung/));
    await waitFor(() => {
      expect(screen.getByText(/Keine Essensdaten/)).toBeInTheDocument();
    });

    // Switch to Verwaltung (use tab button specifically)
    fireEvent.click(screen.getByTitle(/Import, Export/));
    await waitFor(() => {
      expect(screen.getByText(/Backup/)).toBeInTheDocument();
    });
  });

  it('shows abmeldung checkbox and grund field in daily view', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin', 'Dino'] });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    // Set a weekday (Wednesday 2026-04-08) so the day is not closed
    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    fireEvent.change(dateInput, { target: { value: '2026-04-08' } });

    await waitFor(() => {
      expect(screen.getByText('Abm.')).toBeInTheDocument();
      expect(screen.getByText('Grund')).toBeInTheDocument();
    });

    // Checkboxes for abmeldung should be present (one per active child)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(2);

    // Check first child as abgemeldet
    fireEvent.click(checkboxes[0]);

    // Grund input should now be enabled
    const grundInputs = screen.getAllByPlaceholderText('z.B. krank');
    expect(grundInputs[0]).not.toBeDisabled();

    // Type a reason
    fireEvent.change(grundInputs[0], { target: { value: 'Urlaub' } });
    expect(grundInputs[0].value).toBe('Urlaub');

    // Second child's grund input should be disabled (not checked)
    expect(grundInputs[1]).toBeDisabled();
  });

  it('filters children by group', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin', 'Dino'] });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    // Both should be visible
    expect(screen.getByText('Müller, Emma')).toBeInTheDocument();
    expect(screen.getByText('Fischer, Lian')).toBeInTheDocument();

    // Filter to Delfin
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 'Delfin' } });

    await waitFor(() => {
      expect(screen.getByText('Müller, Emma')).toBeInTheDocument();
      expect(screen.queryByText('Fischer, Lian')).not.toBeInTheDocument();
    });
  });
});
