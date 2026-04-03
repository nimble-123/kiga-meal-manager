import { describe, it, expect } from 'vitest';
import { fmtEuro, fmtDate, daysInMonth, getGruppeColor, DEFAULT_GRUPPEN, GERICHTE, MONATE } from '../../src/utils/dates';

describe('fmtEuro', () => {
  it('formats numbers as euro with comma', () => {
    expect(fmtEuro(3.5)).toBe('3,50 €');
    expect(fmtEuro(0)).toBe('0,00 €');
    expect(fmtEuro(1234.1)).toBe('1234,10 €');
  });
});

describe('fmtDate', () => {
  it('formats year, month, day as ISO date string', () => {
    expect(fmtDate(2026, 0, 1)).toBe('2026-01-01');
    expect(fmtDate(2026, 11, 25)).toBe('2026-12-25');
  });
});

describe('daysInMonth', () => {
  it('returns correct days for various months', () => {
    expect(daysInMonth(2026, 0)).toBe(31); // January
    expect(daysInMonth(2026, 1)).toBe(28); // February (non-leap)
    expect(daysInMonth(2024, 1)).toBe(29); // February (leap)
    expect(daysInMonth(2026, 3)).toBe(30); // April
  });
});

describe('getGruppeColor', () => {
  it('returns predefined colors for known groups', () => {
    expect(getGruppeColor('Delfin')).toBe('#0EA5E9');
    expect(getGruppeColor('Dino')).toBe('#22C55E');
  });

  it('returns a fallback color for unknown groups', () => {
    const color = getGruppeColor('NeueGruppe');
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });
});

describe('constants', () => {
  it('has 6 default groups', () => {
    expect(DEFAULT_GRUPPEN).toHaveLength(6);
  });

  it('has 5 meal types', () => {
    expect(GERICHTE).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('has 12 months', () => {
    expect(MONATE).toHaveLength(12);
    expect(MONATE[0]).toBe('Januar');
    expect(MONATE[11]).toBe('Dezember');
  });
});
