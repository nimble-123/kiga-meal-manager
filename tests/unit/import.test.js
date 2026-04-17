import { describe, it, expect } from 'vitest';
import { parseChildrenCSV, parseChildrenJSON, exportChildrenCSV, parseGruppenCSV, parseMealsJSON, exportMealsCSV, parseMealsCSV } from '../../src/utils/import';

describe('parseChildrenCSV', () => {
  it('parses a valid CSV string', () => {
    const csv = 'Name;Gruppe;BUT;Zahlungspflichtiger;Adresse;Kassenzeichen\nMüller, Emma;Delfin;Nein;Müller, Sandra;Gartenweg 3;10.20001.1';
    const { children, errors } = parseChildrenCSV(csv);
    expect(errors).toHaveLength(0);
    expect(children).toHaveLength(1);
    expect(children[0].name).toBe('Müller, Emma');
    expect(children[0].gruppe).toBe('Delfin');
    expect(children[0].but).toBe(false);
    expect(children[0].status).toBe('aktiv');
  });

  it('handles BUT=Ja correctly', () => {
    const csv = 'Name;Gruppe;BUT\nTest, Kind;Dino;Ja';
    const { children } = parseChildrenCSV(csv);
    expect(children[0].but).toBe(true);
  });

  it('reports error for missing name', () => {
    const csv = 'Name;Gruppe\n;Delfin';
    const { children, errors } = parseChildrenCSV(csv);
    expect(children).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Name fehlt');
  });

  it('strips BOM prefix', () => {
    const csv = '\uFEFFName;Gruppe\nTest, Kind;Delfin';
    const { children } = parseChildrenCSV(csv);
    expect(children).toHaveLength(1);
  });
});

describe('parseChildrenJSON', () => {
  it('parses a valid JSON array', () => {
    const json = JSON.stringify([{ name: 'Test', gruppe: 'Dino', but: true }]);
    const { children, errors } = parseChildrenJSON(json);
    expect(errors).toHaveLength(0);
    expect(children).toHaveLength(1);
    expect(children[0].but).toBe(true);
    expect(children[0].status).toBe('aktiv');
  });

  it('returns errors for invalid JSON', () => {
    const { errors } = parseChildrenJSON('not json');
    expect(errors).toHaveLength(1);
  });
});

describe('exportChildrenCSV', () => {
  it('exports children as semicolon-delimited CSV', () => {
    const children = [{ name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: 'Müller', adresse: 'Str. 1', kassenzeichen: '123', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' }];
    const csv = exportChildrenCSV(children);
    expect(csv).toContain('Name;');
    expect(csv).toContain('Müller, Emma');
    expect(csv).toContain('Nein');
  });
});

describe('parseGruppenCSV', () => {
  it('parses group names from CSV', () => {
    const csv = 'Name\nDelfin\nDino\nMöwen';
    const gruppen = parseGruppenCSV(csv);
    expect(gruppen).toEqual(['Delfin', 'Dino', 'Möwen']);
  });
});

describe('parseMealsJSON', () => {
  it('extracts meals-* keys from JSON', () => {
    const json = JSON.stringify({ 'meals-2026-01': { day: 1 }, 'meals-2026-02': { day: 2 }, children: [] });
    const { meals, count } = parseMealsJSON(json);
    expect(count).toBe(2);
    expect(meals['meals-2026-01']).toBeDefined();
  });
});

describe('exportMealsCSV', () => {
  it('exports meals as semicolon-delimited CSV', () => {
    const meals = {
      'meals-2026-01': {
        '2026-01-05': {
          prices: { A: 3.5, B: 4 },
          selections: { c1: 'A', c2: 'B' },
          abmeldungen: {},
        },
      },
    };
    const children = [
      { id: 'c1', name: 'Müller, Emma' },
      { id: 'c2', name: 'Fischer, Lian' },
    ];
    const csv = exportMealsCSV(meals, children);
    expect(csv).toContain('Datum;Name;Gericht;Preis;Abgemeldet;Grund');
    expect(csv).toContain('2026-01-05;Fischer, Lian;B;4;;');
    expect(csv).toContain('2026-01-05;Müller, Emma;A;3.5;;');
  });

  it('exports abmeldungen correctly', () => {
    const meals = {
      'meals-2026-01': {
        '2026-01-05': {
          prices: { A: 3.5 },
          selections: {},
          abmeldungen: { c1: { active: true, grund: 'krank' } },
        },
      },
    };
    const children = [{ id: 'c1', name: 'Test, Kind' }];
    const csv = exportMealsCSV(meals, children);
    expect(csv).toContain('2026-01-05;Test, Kind;;;Ja;krank');
  });

  it('prioritizes abmeldung over selection', () => {
    const meals = {
      'meals-2026-01': {
        '2026-01-05': {
          prices: { A: 3.5 },
          selections: { c1: 'A' },
          abmeldungen: { c1: { active: true, grund: 'krank' } },
        },
      },
    };
    const children = [{ id: 'c1', name: 'Test, Kind' }];
    const csv = exportMealsCSV(meals, children);
    expect(csv).toContain('Ja;krank');
    expect(csv).not.toContain(';A;3.5');
  });
});

describe('parseMealsCSV', () => {
  it('parses valid meals CSV', () => {
    const csv = 'Datum;Name;Gericht;Preis;Abgemeldet;Grund\n2026-01-05;Müller, Emma;A;3,50;;\n2026-01-05;Fischer, Lian;B;4,00;;';
    const children = [
      { id: 'c1', name: 'Müller, Emma' },
      { id: 'c2', name: 'Fischer, Lian' },
    ];
    const { meals, errors, count } = parseMealsCSV(csv, children);
    expect(errors).toHaveLength(0);
    expect(count).toBe(1);
    expect(meals['meals-2026-01']['2026-01-05'].selections.c1).toBe('A');
    expect(meals['meals-2026-01']['2026-01-05'].selections.c2).toBe('B');
    expect(meals['meals-2026-01']['2026-01-05'].prices.A).toBe(3.5);
  });

  it('parses abmeldungen', () => {
    const csv = 'Datum;Name;Gericht;Preis;Abgemeldet;Grund\n2026-01-05;Test, Kind;;;Ja;krank';
    const children = [{ id: 'c1', name: 'Test, Kind' }];
    const { meals } = parseMealsCSV(csv, children);
    expect(meals['meals-2026-01']['2026-01-05'].abmeldungen.c1).toEqual({ active: true, grund: 'krank' });
  });

  it('reports error for unknown child name', () => {
    const csv = 'Datum;Name;Gericht;Preis;Abgemeldet;Grund\n2026-01-05;Unbekannt;A;3,50;;';
    const { errors } = parseMealsCSV(csv, []);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('nicht gefunden');
  });

  it('roundtrips with exportMealsCSV', () => {
    const original = {
      'meals-2026-01': {
        '2026-01-05': { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} },
      },
    };
    const children = [{ id: 'c1', name: 'Test, Kind' }];
    const csv = exportMealsCSV(original, children);
    const { meals } = parseMealsCSV(csv, children);
    expect(meals['meals-2026-01']['2026-01-05'].selections.c1).toBe('A');
    expect(meals['meals-2026-01']['2026-01-05'].prices.A).toBe(3.5);
  });
});
