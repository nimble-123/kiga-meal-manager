import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';

// Diese Suite simuliert die Electron-Lizenz-API (im Shared-Setup absichtlich NICHT
// gemockt, damit alle anderen Tests den Entwickler-Bypass nutzen).
describe('LicenseGate', () => {
  beforeEach(() => {
    window.api.license = {
      status: vi.fn(async () => ({ licensed: false })),
      activate: vi.fn(async () => ({ success: false, error: 'Ungültiger oder beschädigter Lizenzschlüssel.' })),
    };
  });

  afterEach(() => {
    delete window.api.license;
  });

  it('zeigt den Aktivierungs-Gate, wenn keine Lizenz vorliegt', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('KiGa Essenverwaltung aktivieren')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Lizenzschlüssel/i)).toBeInTheDocument();
  });

  it('deaktiviert den Aktivieren-Button bei leerem Schlüssel', async () => {
    render(<App />);
    const btn = await screen.findByRole('button', { name: /^Aktivieren$/ });
    expect(btn).toBeDisabled();
  });

  it('zeigt eine Fehlermeldung bei ungültigem Schlüssel', async () => {
    render(<App />);
    const textarea = await screen.findByPlaceholderText(/Lizenzschlüssel/i);
    fireEvent.change(textarea, { target: { value: 'kaputt' } });

    fireEvent.click(screen.getByRole('button', { name: /^Aktivieren$/ }));

    await waitFor(() => {
      expect(screen.getByText(/Ungültiger oder beschädigter Lizenzschlüssel/i)).toBeInTheDocument();
    });
    expect(window.api.license.activate).toHaveBeenCalledWith('kaputt');
  });
});
