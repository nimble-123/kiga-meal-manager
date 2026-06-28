import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

describe('Telemetrie-Einwilligung & Feedback (in App)', () => {
  beforeEach(() => {
    resetStore();
    window.api.store.set.mockClear();
  });

  it('Einwilligung ist standardmäßig aus und wird beim Aktivieren persistiert', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin'], tourCompleted: true });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    fireEvent.click(screen.getByRole('button', { name: /Verwaltung/ }));
    fireEvent.click(screen.getByText(/Datenschutz & Nutzungsstatistiken/));

    const section = screen.getByText(/Datenschutz & Nutzungsstatistiken/).closest('.card');
    const checkbox = within(section).getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    await waitFor(() => expect(window.api.store.set).toHaveBeenCalledWith('telemetryConsent', true));
  });

  it('Feedback-Button im Header öffnet den Dialog', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin'], tourCompleted: true });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    fireEvent.click(document.getElementById('feedback-btn'));
    await waitFor(() => expect(screen.getByText(/Feedback \/ Feature-Wunsch/)).toBeInTheDocument());
    // E-Mail-Empfänger ist der Entwickler (über den Hinweistext im Dialog erkennbar)
    expect(screen.getByText(/per E-Mail an den Entwickler/)).toBeInTheDocument();
  });
});
