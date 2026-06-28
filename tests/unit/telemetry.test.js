import { describe, it, expect, vi, afterEach } from 'vitest';
import { track } from '../../src/utils/telemetry';

afterEach(() => {
  delete window.api.telemetry;
});

describe('telemetry.track (Renderer-Wrapper)', () => {
  it('ist ein no-op ohne window.api.telemetry und wirft nicht', () => {
    expect(() => track('app_started', { app_version: '1.0.0' })).not.toThrow();
  });

  it('reicht Event-Name + Props an window.api.telemetry.track weiter', () => {
    window.api.telemetry = { track: vi.fn() };
    track('tab_opened', { tab: 'daily' });
    expect(window.api.telemetry.track).toHaveBeenCalledWith('tab_opened', { tab: 'daily' });
  });

  it('schluckt Fehler aus der Bridge (Telemetrie darf die App nie stören)', () => {
    window.api.telemetry = { track: vi.fn(() => { throw new Error('boom'); }) };
    expect(() => track('feature_used', { feature: 'x' })).not.toThrow();
  });
});
