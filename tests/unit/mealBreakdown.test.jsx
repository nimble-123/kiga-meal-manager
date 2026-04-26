import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getDailyBreakdown, getSummaryBreakdown, BreakdownDisplay } from '../../src/utils/mealBreakdown';

const children = [
  { id: 'c1' },
  { id: 'c2' },
  { id: 'c3' },
  { id: 'c4' },
];

describe('getDailyBreakdown', () => {
  it('zählt Selections nach Gerichttyp', () => {
    const selections = { c1: 'A', c2: 'A', c3: 'B', c4: '' };
    const counts = getDailyBreakdown(children, selections);
    expect(counts).toEqual({ A: 2, B: 1, C: 0, D: 0, E: 0 });
  });

  it('liefert alle Gerichte 0 bei leerer Selections-Map', () => {
    expect(getDailyBreakdown(children, {})).toEqual({ A: 0, B: 0, C: 0, D: 0, E: 0 });
  });

  it('ignoriert ungültige Gericht-Werte', () => {
    const selections = { c1: 'X', c2: 'A' };
    const counts = getDailyBreakdown(children, selections);
    expect(counts.A).toBe(1);
    expect(counts.B).toBe(0);
  });

  it('toleriert undefined selections', () => {
    expect(getDailyBreakdown(children, undefined)).toEqual({ A: 0, B: 0, C: 0, D: 0, E: 0 });
  });
});

describe('getSummaryBreakdown', () => {
  it('summiert byMeal-Counts pro Kind', () => {
    const summary = {
      c1: { byMeal: { A: 5, B: 2, C: 0, D: 0, E: 0 } },
      c2: { byMeal: { A: 3, B: 1, C: 0, D: 0, E: 0 } },
    };
    const counts = getSummaryBreakdown([{ id: 'c1' }, { id: 'c2' }], summary);
    expect(counts).toEqual({ A: 8, B: 3, C: 0, D: 0, E: 0 });
  });

  it('liefert 0 wenn Kind keinen byMeal-Eintrag hat', () => {
    const counts = getSummaryBreakdown([{ id: 'c1' }], {});
    expect(counts).toEqual({ A: 0, B: 0, C: 0, D: 0, E: 0 });
  });
});

describe('BreakdownDisplay', () => {
  it('rendert Counts pro vorhandenem Gericht', () => {
    render(<BreakdownDisplay counts={{ A: 3, B: 1, C: 0, D: 0, E: 0 }} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('rendert nichts wenn alle Counts 0 sind', () => {
    const { container } = render(<BreakdownDisplay counts={{ A: 0, B: 0, C: 0, D: 0, E: 0 }} />);
    expect(container.firstChild).toBeNull();
  });
});
