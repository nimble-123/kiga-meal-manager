import { describe, it, expect } from 'vitest';
import { generateTestData } from '../../src/utils/testData';

const testChildren = [
  { id: 'c1', name: 'Test A', gruppe: 'Delfin', but: false, status: 'aktiv' },
  { id: 'c2', name: 'Test B', gruppe: 'Dino', but: true, status: 'aktiv' },
  { id: 'c3', name: 'Test C', gruppe: 'Delfin', but: false, status: 'inaktiv' },
];

describe('generateTestData', () => {
  it('generates data for the specified number of months', () => {
    const data = generateTestData(testChildren, 2026, 0, 3);
    const keys = Object.keys(data);
    expect(keys).toHaveLength(3);
    expect(keys).toContain('meals-2026-01');
    expect(keys).toContain('meals-2026-02');
    expect(keys).toContain('meals-2026-03');
  });

  it('generates day entries with prices and selections', () => {
    const data = generateTestData(testChildren, 2026, 0, 1);
    const month = data['meals-2026-01'];
    const dayKeys = Object.keys(month);
    expect(dayKeys.length).toBeGreaterThan(0);

    const firstDay = month[dayKeys[0]];
    expect(firstDay).toHaveProperty('prices');
    expect(firstDay).toHaveProperty('selections');
    expect(Object.keys(firstDay.prices).length).toBe(5); // A-E
  });

  it('does not include inactive children', () => {
    const data = generateTestData(testChildren, 2026, 0, 1);
    const month = data['meals-2026-01'];
    const allSelections = Object.values(month).flatMap((d) => Object.keys(d.selections));
    expect(allSelections).not.toContain('c3');
  });

  it('skips weekends and holidays', () => {
    const data = generateTestData(testChildren, 2026, 0, 1);
    const month = data['meals-2026-01'];
    // Jan 1 2026 = Thursday (Neujahr = holiday), should be skipped
    expect(month['2026-01-01']).toBeUndefined();
    // Jan 3 2026 = Saturday, should be skipped
    expect(month['2026-01-03']).toBeUndefined();
  });

  it('wraps months correctly past December', () => {
    const data = generateTestData(testChildren, 2026, 10, 4);
    const keys = Object.keys(data);
    expect(keys).toContain('meals-2026-11');
    expect(keys).toContain('meals-2026-12');
    expect(keys).toContain('meals-2027-01');
    expect(keys).toContain('meals-2027-02');
  });
});
