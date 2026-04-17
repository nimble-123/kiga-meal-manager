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

export function exportMealsCSV(allMealsData, children) {
  const nameMap = Object.fromEntries(children.map((c) => [c.id, c.name]));
  const rows = [['Datum', 'Name', 'Gericht', 'Preis', 'Abgemeldet', 'Grund']];

  const monthKeys = Object.keys(allMealsData).sort();
  for (const mk of monthKeys) {
    const monthData = allMealsData[mk];
    if (!monthData) continue;
    const dateKeys = Object.keys(monthData).sort();
    for (const dateStr of dateKeys) {
      const day = monthData[dateStr];
      if (!day) continue;
      const allChildIds = new Set([
        ...Object.keys(day.selections || {}),
        ...Object.keys(day.abmeldungen || {}).filter((id) => day.abmeldungen[id]?.active),
      ]);
      for (const cid of [...allChildIds].sort()) {
        const name = nameMap[cid] || cid;
        const abm = day.abmeldungen?.[cid];
        if (abm?.active) {
          rows.push([dateStr, name, '', '', 'Ja', abm.grund || '']);
        } else {
          const sel = day.selections?.[cid];
          if (sel) {
            const price = day.prices?.[sel] ?? '';
            rows.push([dateStr, name, sel, price, '', '']);
          }
        }
      }
    }
  }

  return rows.map((r) => r.join(';')).join('\n');
}

export function parseMealsCSV(csvString, children) {
  const clean = csvString.replace(/^\uFEFF/, '');
  const result = Papa.parse(clean, { header: true, delimiter: ';', skipEmptyLines: true });
  const errors = [];
  const idMap = Object.fromEntries(children.map((c) => [c.name, c.id]));
  const meals = {};

  result.data.forEach((row, i) => {
    const datum = (row.Datum || '').trim();
    const name = (row.Name || '').trim();
    if (!datum || !name) { errors.push(`Zeile ${i + 2}: Datum oder Name fehlt`); return; }

    const childId = idMap[name];
    if (!childId) { errors.push(`Zeile ${i + 2}: Kind "${name}" nicht gefunden`); return; }

    const [y, m] = datum.split('-');
    const monthKey = `meals-${y}-${m}`;
    if (!meals[monthKey]) meals[monthKey] = {};
    if (!meals[monthKey][datum]) meals[monthKey][datum] = { prices: {}, selections: {}, abmeldungen: {} };

    const day = meals[monthKey][datum];
    const abgemeldet = (row.Abgemeldet || '').trim().toLowerCase();

    if (['ja', 'true', '1', 'x'].includes(abgemeldet)) {
      day.abmeldungen[childId] = { active: true, grund: (row.Grund || '').trim() };
    } else {
      const gericht = (row.Gericht || '').trim();
      const preis = parseFloat((row.Preis || '').replace(',', '.'));
      if (gericht) {
        day.selections[childId] = gericht;
        if (!isNaN(preis) && preis > 0) {
          day.prices[gericht] = preis;
        }
      }
    }
  });

  return { meals, errors, count: Object.keys(meals).length };
}

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
