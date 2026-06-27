import { describe, it, expect } from 'vitest';
import { statusFromPayload, rekeyBlocked } from '../../electron/license.js';

// Reine Entscheidungslogik aus license.js. Die electron-store-gebundenen Flows
// (getStatus/activate/bootstrap) lassen sich im CJS-Setup nicht sinnvoll isoliert
// mocken — die hier getestete Logik ist aber der inhaltlich kritische Teil
// (Status-Mapping ohne Token-Leak, Re-Key-Datenverlust-Schutz).

describe('statusFromPayload', () => {
  it('meldet unlizenziert bei null (kein/ungültiger Token)', () => {
    expect(statusFromPayload(null)).toEqual({ licensed: false });
  });

  it('meldet lizenziert mit Lizenznehmer und Ausstelldatum', () => {
    expect(statusFromPayload({ name: 'KiGa Mitte', iat: '2026-06-27' })).toEqual({
      licensed: true,
      licensee: 'KiGa Mitte',
      issuedAt: '2026-06-27',
    });
  });

  it('gibt niemals den Token (oder andere Payload-Felder) heraus', () => {
    const status = statusFromPayload({ name: 'KiGa Mitte', iat: '2026-06-27', token: 'geheim', secret: 'x' });
    expect(status).toEqual({ licensed: true, licensee: 'KiGa Mitte', issuedAt: '2026-06-27' });
    expect(JSON.stringify(status)).not.toContain('geheim');
  });
});

describe('rekeyBlocked (Re-Key-Datenverlust-Schutz)', () => {
  it('blockiert nicht, wenn noch keine Lizenz aktiv ist', () => {
    expect(rekeyBlocked(null, 'neu', true)).toBe(false);
  });

  it('blockiert nicht bei erneuter Aktivierung desselben Tokens', () => {
    expect(rekeyBlocked('abc', 'abc', true)).toBe(false);
  });

  it('blockiert nicht vor erfolgter Migration', () => {
    expect(rekeyBlocked('abc', 'anders', false)).toBe(false);
  });

  it('blockiert den Wechsel auf einen anderen Token nach Migration', () => {
    expect(rekeyBlocked('abc', 'anders', true)).toBe(true);
  });
});
