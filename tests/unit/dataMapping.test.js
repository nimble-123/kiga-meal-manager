import { describe, it, expect } from 'vitest';
import { rowsToMonth, monthToRows, monthRange } from '../../src/lib/data/meals';
import { rowToChild, childToRow } from '../../src/lib/data/children';

describe('monthRange', () => {
  it('liefert Monatsanfang und ersten Tag des Folgemonats', () => {
    expect(monthRange('meals-2026-06')).toEqual({ start: '2026-06-01', end: '2026-07-01' });
  });
  it('behandelt den Jahreswechsel (Dezember)', () => {
    expect(monthRange('meals-2026-12')).toEqual({ start: '2026-12-01', end: '2027-01-01' });
  });
});

describe('rowsToMonth', () => {
  it('rekonstruiert Preise, Auswahl und Abmeldungen', () => {
    const blob = rowsToMonth(
      [{ datum: '2026-06-01', gericht: 'A', preis: '3.50' }],
      [
        { datum: '2026-06-01', child_id: 'c1', gericht: 'A', abmeldung_active: false, abmeldung_grund: null },
        { datum: '2026-06-01', child_id: 'c2', gericht: null, abmeldung_active: true, abmeldung_grund: 'krank' },
      ],
    );
    expect(blob['2026-06-01'].prices).toEqual({ A: 3.5 });
    expect(blob['2026-06-01'].selections).toEqual({ c1: 'A' });
    expect(blob['2026-06-01'].abmeldungen).toEqual({ c2: { active: true, grund: 'krank' } });
  });
});

describe('monthToRows', () => {
  it('zerlegt den Blob in Preis- und Eintragszeilen', () => {
    const { priceRows, entryRows } = monthToRows('org1', {
      '2026-06-01': {
        prices: { A: 3.5, B: '' },
        selections: { c1: 'A' },
        abmeldungen: { c2: { active: true, grund: 'krank' } },
      },
    });
    expect(priceRows).toEqual([{ org_id: 'org1', datum: '2026-06-01', gericht: 'A', preis: 3.5 }]);
    expect(entryRows).toHaveLength(2);
    expect(entryRows).toContainEqual({ org_id: 'org1', child_id: 'c1', datum: '2026-06-01', gericht: 'A', abmeldung_active: false, abmeldung_grund: null });
    expect(entryRows).toContainEqual({ org_id: 'org1', child_id: 'c2', datum: '2026-06-01', gericht: null, abmeldung_active: true, abmeldung_grund: 'krank' });
  });

  it('ignoriert leere Preise und leere Einträge (weder Auswahl noch Abmeldung)', () => {
    const { priceRows, entryRows } = monthToRows('org1', {
      '2026-06-02': { prices: { A: '' }, selections: { c1: '' }, abmeldungen: { c1: { active: false } } },
    });
    expect(priceRows).toEqual([]);
    expect(entryRows).toEqual([]);
  });

  it('round-trip monthToRows -> rowsToMonth erhält die Daten', () => {
    const original = {
      '2026-06-01': { prices: { A: 3.5, B: 4 }, selections: { c1: 'A', c2: 'B' }, abmeldungen: { c3: { active: true, grund: 'Urlaub' } } },
      '2026-06-02': { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} },
    };
    const { priceRows, entryRows } = monthToRows('org1', original);
    const back = rowsToMonth(priceRows, entryRows);
    expect(back['2026-06-01'].prices).toEqual({ A: 3.5, B: 4 });
    expect(back['2026-06-01'].selections).toEqual({ c1: 'A', c2: 'B' });
    expect(back['2026-06-01'].abmeldungen).toEqual({ c3: { active: true, grund: 'Urlaub' } });
    expect(back['2026-06-02'].selections).toEqual({ c1: 'A' });
  });
});

describe('children row mapping', () => {
  it('rowToChild wandelt null in leere Strings', () => {
    const c = rowToChild({ id: 'c1', name: 'Müller, Emma', gruppe: null, but: false, zahlungspfl: null, adresse: null, kassenzeichen: null, hinweise: null, status: 'aktiv', eintritt: null, austritt: null });
    expect(c).toEqual({ id: 'c1', name: 'Müller, Emma', gruppe: '', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' });
  });

  it('childToRow wandelt leere Strings in null und setzt org_id', () => {
    const r = childToRow({ id: 'c1', name: 'Müller, Emma', gruppe: '', but: true, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' }, 'org1');
    expect(r).toEqual({ id: 'c1', org_id: 'org1', name: 'Müller, Emma', gruppe: null, but: true, zahlungspfl: null, adresse: null, kassenzeichen: null, hinweise: null, status: 'aktiv', eintritt: null, austritt: null });
  });
});
