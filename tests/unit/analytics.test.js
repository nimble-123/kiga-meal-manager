import { describe, it, expect, beforeEach } from 'vitest';
import { aggregateYearData } from '../../src/utils/analytics';
import { resetStore, seedStore } from '../setup';

const children = [
  { id: 'c1', name: 'Anna', gruppe: 'Delfin', but: false, status: 'aktiv' },
  { id: 'c2', name: 'Ben', gruppe: 'Dino', but: true, status: 'aktiv' },
  { id: 'c3', name: 'Cara', gruppe: 'Delfin', but: false, status: 'inaktiv' },
];

describe('aggregateYearData', () => {
  beforeEach(() => resetStore());

  it('liefert leere Aggregation wenn keine Daten existieren', async () => {
    const result = await aggregateYearData(2026, children);
    expect(result.pricesByMonth).toHaveLength(12);
    expect(result.costsByMonth).toHaveLength(12);
    expect(result.participationByMonth).toEqual(Array(12).fill(0));
    expect(result.mealDistribution).toEqual({ A: 0, B: 0, C: 0, D: 0, E: 0 });
    expect(result.butShare.percentage).toBe(0);
  });

  it('summiert Kosten und mealDistribution korrekt', async () => {
    seedStore({
      'meals-2026-04': {
        '2026-04-08': {
          prices: { A: 3.5, B: 4 },
          selections: { c1: 'A', c2: 'B' },
        },
        '2026-04-09': {
          prices: { A: 3.5 },
          selections: { c1: 'A', c2: 'A' },
        },
      },
    });
    const result = await aggregateYearData(2026, children);
    expect(result.mealDistribution.A).toBe(3); // c1+c2 (09.) und c1 (08.)
    expect(result.mealDistribution.B).toBe(1);
    // April-Kosten: 08.: 3.5+4, 09.: 3.5+3.5 = 14.5
    expect(result.costsByMonth[3].total).toBeCloseTo(14.5, 2);
  });

  it('berechnet Durchschnittspreise pro Monat', async () => {
    seedStore({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3 } },
        '2026-04-09': { prices: { A: 4 } },
      },
    });
    const result = await aggregateYearData(2026, children);
    expect(result.pricesByMonth[3].A).toBe(3.5);
    expect(result.pricesByMonth[3].B).toBeNull();
    expect(result.pricesByMonth[0].A).toBeNull();
  });

  it('berechnet BUT-Anteil aus tatsächlichen Mahlzeiten', async () => {
    seedStore({
      'meals-2026-04': {
        '2026-04-08': {
          prices: { A: 3 },
          selections: { c1: 'A', c2: 'A' }, // c2 ist BUT
        },
      },
    });
    const result = await aggregateYearData(2026, children);
    expect(result.butShare.butMeals).toBe(1);
    expect(result.butShare.nonButMeals).toBe(1);
    expect(result.butShare.percentage).toBe(50);
  });

  it('ignoriert inaktive Kinder', async () => {
    seedStore({
      'meals-2026-04': {
        '2026-04-08': {
          prices: { A: 3 },
          selections: { c1: 'A', c3: 'A' }, // c3 inaktiv
        },
      },
    });
    const result = await aggregateYearData(2026, children);
    expect(result.mealDistribution.A).toBe(1);
  });

  it('zählt Auswahlen ohne Preis NICHT als Essen', async () => {
    seedStore({
      'meals-2026-04': {
        '2026-04-08': {
          prices: {},
          selections: { c1: 'A' },
        },
      },
    });
    const result = await aggregateYearData(2026, children);
    expect(result.mealDistribution.A).toBe(0);
    expect(result.costsByMonth[3].total).toBe(0);
  });

  it('Gruppenvergleich liefert Ø Essen/Kind/Monat', async () => {
    seedStore({
      'meals-2026-04': {
        '2026-04-08': { prices: { A: 3 }, selections: { c1: 'A', c2: 'A' } },
      },
    });
    const result = await aggregateYearData(2026, children);
    // Delfin: 1 Essen, 1 aktives Kind (c1) → 1 / 1 / 12 ≈ 0.1
    // Dino: 1 Essen, 1 aktives Kind (c2) → 0.1
    expect(result.groupComparison.Delfin).toBeCloseTo(0.1, 1);
    expect(result.groupComparison.Dino).toBeCloseTo(0.1, 1);
  });
});
