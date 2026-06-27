import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

function openAnsichtenToggle() {
  fireEvent.click(screen.getByRole('button', { name: /Verwaltung/ }));
  fireEvent.click(screen.getByText(/Ansichten/));
  const section = screen.getByText(/Ansichten/).closest('.card');
  fireEvent.click(within(section).getByRole('checkbox'));
}

describe('Wochenerfassung-Toggle', () => {
  beforeEach(() => resetStore());

  it('blendet den Wochenerfassungs-Tab standardmäßig aus', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin'], tourCompleted: true });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    expect(screen.queryByRole('button', { name: /Wochenerfassung/ })).not.toBeInTheDocument();
  });

  it('zeigt den Tab, wenn er in der Verwaltung aktiviert wird', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin'], tourCompleted: true });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    openAnsichtenToggle();

    await waitFor(() => expect(screen.getByRole('button', { name: /Wochenerfassung/ })).toBeInTheDocument());
  });

  it('blendet den Tab wieder aus, wenn deaktiviert', async () => {
    seedStore({ children: testChildren, gruppen: ['Delfin'], tourCompleted: true, weekViewEnabled: true });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    expect(screen.getByRole('button', { name: /Wochenerfassung/ })).toBeInTheDocument();

    openAnsichtenToggle(); // schaltet aus (Checkbox war an)

    await waitFor(() => expect(screen.queryByRole('button', { name: /Wochenerfassung/ })).not.toBeInTheDocument());
  });
});
