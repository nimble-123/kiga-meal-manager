import { describe, it, expect } from 'vitest';
import {
  fmtEuro,
  fmtDate,
  daysInMonth,
  getGruppeColor,
  DEFAULT_GRUPPEN,
  GERICHTE,
  MONATE,
  getWeekMonday,
  getWeekDates,
  getWeekNumber,
  getWeekYear,
  getPreviousWeekMonday,
  addDaysToISO,
  getMonthKey,
  roundEuro,
} from '../../src/utils/dates';

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

describe('getWeekMonday', () => {
  it('returns the same day if input is Monday', () => {
    expect(getWeekMonday('2026-04-27')).toBe('2026-04-27'); // Mo
  });
  it('returns Monday for any weekday in the same ISO week', () => {
    expect(getWeekMonday('2026-04-29')).toBe('2026-04-27'); // Mi -> Mo
    expect(getWeekMonday('2026-05-01')).toBe('2026-04-27'); // Fr -> Mo (cross-month)
    expect(getWeekMonday('2026-05-03')).toBe('2026-04-27'); // So -> Mo der ISO-Woche davor
  });
  it('handles year boundaries', () => {
    expect(getWeekMonday('2026-01-01')).toBe('2025-12-29'); // Do -> Mo
  });
});

describe('getWeekDates', () => {
  it('returns Mo–Fr as 5 ISO dates', () => {
    expect(getWeekDates('2026-04-29')).toEqual([
      '2026-04-27',
      '2026-04-28',
      '2026-04-29',
      '2026-04-30',
      '2026-05-01',
    ]);
  });
});

describe('getWeekNumber / getWeekYear', () => {
  it('computes ISO 8601 week number', () => {
    expect(getWeekNumber('2026-04-29')).toBe(18);
    expect(getWeekNumber('2026-01-05')).toBe(2);
    expect(getWeekNumber('2026-01-01')).toBe(1);
  });
  it('computes ISO 8601 week year (handles late-December edge case)', () => {
    expect(getWeekYear('2025-12-29')).toBe(2026); // KW1 / 2026
    expect(getWeekYear('2026-01-01')).toBe(2026);
  });
});

describe('getPreviousWeekMonday', () => {
  it('returns Monday 7 days before the current week Monday', () => {
    expect(getPreviousWeekMonday('2026-04-29')).toBe('2026-04-20');
    expect(getPreviousWeekMonday('2026-04-27')).toBe('2026-04-20');
  });
});

describe('addDaysToISO', () => {
  it('adds and subtracts days', () => {
    expect(addDaysToISO('2026-04-30', 1)).toBe('2026-05-01');
    expect(addDaysToISO('2026-05-01', -1)).toBe('2026-04-30');
    expect(addDaysToISO('2026-04-27', 7)).toBe('2026-05-04');
  });
});

describe('getMonthKey', () => {
  it('returns meals-YYYY-MM key for an ISO date', () => {
    expect(getMonthKey('2026-04-30')).toBe('meals-2026-04');
    expect(getMonthKey('2026-05-01')).toBe('meals-2026-05');
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

describe('roundEuro', () => {
  it('rundet unter ,50 kaufmännisch ab', () => {
    expect(roundEuro(46.1)).toBe(46);
    expect(roundEuro(46.49)).toBe(46);
  });

  it('rundet ab ,50 kaufmännisch auf', () => {
    expect(roundEuro(46.5)).toBe(47);
    expect(roundEuro(46.51)).toBe(47);
    expect(roundEuro(47.6)).toBe(48);
  });

  it('lässt volle Beträge und 0 unverändert', () => {
    expect(roundEuro(46)).toBe(46);
    expect(roundEuro(0)).toBe(0);
  });

  it('ist robust gegen Float-Ungenauigkeiten aus Summen', () => {
    // 0.1 + 0.2 + ... liefert in JS Werte wie 46.49999999999999
    expect(roundEuro(46.49999999999999)).toBe(47);
    expect(roundEuro(2.5 + 3.6 + 2.5 + 3.6 + 2.5 + 3.6)).toBe(18); // 18,30
    expect(roundEuro(1.15 + 1.35)).toBe(3); // 2,50 trotz Float-Summe
  });

  it('behandelt ungültige Werte als 0', () => {
    expect(roundEuro(undefined)).toBe(0);
    expect(roundEuro(NaN)).toBe(0);
  });
});
