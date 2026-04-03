import { describe, it, expect } from 'vitest';
import { isClosedDay, getHolidays } from '../../src/data/holidays';

describe('isClosedDay', () => {
  it('returns true for weekends', () => {
    expect(isClosedDay('2026-04-04')).toBe(true); // Saturday
    expect(isClosedDay('2026-04-05')).toBe(true); // Sunday
  });

  it('returns false for regular weekdays', () => {
    expect(isClosedDay('2026-04-08')).toBe(false); // Wednesday (after Easter)
    expect(isClosedDay('2026-04-09')).toBe(false); // Thursday
  });

  it('returns true for German holidays', () => {
    expect(isClosedDay('2026-01-01')).toBe(true); // Neujahr
    expect(isClosedDay('2026-12-25')).toBe(true); // 1. Weihnachtstag
    expect(isClosedDay('2026-10-03')).toBe(true); // Tag der Dt. Einheit (Saturday in 2026 but still a holiday)
  });
});

describe('getHolidays', () => {
  it('returns a set of holiday date strings', () => {
    const holidays = getHolidays(2026);
    expect(holidays).toBeInstanceOf(Set);
    expect(holidays.has('2026-01-01')).toBe(true);
    expect(holidays.has('2026-05-01')).toBe(true);
    expect(holidays.size).toBeGreaterThanOrEqual(10);
  });
});
