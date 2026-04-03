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
      expect(screen.getByText(/Gruppen verwalten/)).toBeInTheDocument();
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
