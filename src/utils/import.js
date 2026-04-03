import Papa from 'papaparse';
import { createChild } from '../data/childUtils';

// --- Stammdaten ---

export function parseChildrenCSV(csvString) {
  // BOM entfernen falls vorhanden
  const clean = csvString.replace(/^\uFEFF/, '');
  const result = Papa.parse(clean, { header: true, delimiter: ';', skipEmptyLines: true });
  const children = [];
  const errors = [];

  result.data.forEach((row, i) => {
    const name = (row.Name || row.name || '').trim();
    if (!name) {
      errors.push(`Zeile ${i + 2}: Name fehlt`);
      return;
    }
    children.push(createChild({
      name,
      gruppe: (row.Gruppe || row.gruppe || '').trim(),
      but: ['ja', 'true', '1', 'x'].includes((row.BUT || row.but || '').toLowerCase()),
      zahlungspfl: (row.Zahlungspflichtiger || row.zahlungspfl || '').trim(),
      adresse: (row.Adresse || row.adresse || '').trim(),
      kassenzeichen: (row.Kassenzeichen || row.kassenzeichen || '').trim(),
      hinweise: (row.Hinweise || row.hinweise || '').trim(),
      status: (row.Status || row.status || 'aktiv').trim(),
      eintritt: (row.Eintritt || row.eintritt || '').trim(),
      austritt: (row.Austritt || row.austritt || '').trim(),
    }, i));
  });

  return { children, errors, totalRows: result.data.length };
}

export function parseChildrenJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const arr = Array.isArray(data) ? data : data.children || [];
    const children = arr.map((c, i) => createChild(c, i));
    return { children, errors: [] };
  } catch (e) {
    return { children: [], errors: [`JSON-Fehler: ${e.message}`] };
  }
}

export function exportChildrenCSV(children) {
  return Papa.unparse(
    children.map((c) => ({
      Name: c.name,
      Gruppe: c.gruppe,
      BUT: c.but ? 'Ja' : 'Nein',
      Zahlungspflichtiger: c.zahlungspfl,
      Adresse: c.adresse,
      Kassenzeichen: c.kassenzeichen,
      Hinweise: c.hinweise,
      Status: c.status,
      Eintritt: c.eintritt,
      Austritt: c.austritt,
    })),
    { delimiter: ';' }
  );
}

export function exportChildrenJSON(children) {
  return JSON.stringify(children, null, 2);
}

// --- Gruppen ---

export function parseGruppenCSV(csvString) {
  const clean = csvString.replace(/^\uFEFF/, '');
  const result = Papa.parse(clean, { header: true, delimiter: ';', skipEmptyLines: true });
  const gruppen = result.data
    .map((row) => (row.Name || row.name || '').trim())
    .filter(Boolean);
  return gruppen;
}

// --- Bewegungsdaten ---

export function parseMealsJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const meals = {};
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith('meals-')) {
        meals[key] = val;
      }
    }
    return { meals, errors: [], count: Object.keys(meals).length };
  } catch (e) {
    return { meals: {}, errors: [`JSON-Fehler: ${e.message}`], count: 0 };
  }
}
