import { supabase } from '../supabase';
import { requireOrg } from './context';

// ---- Reine Mapping-Logik (ohne DB, unit-testbar) ----

// meal_prices/meal_entries-Zeilen -> Monats-Blob im App-Format
// { "YYYY-MM-DD": { prices: {gericht:preis}, selections: {childId:gericht}, abmeldungen: {childId:{active,grund}} } }
export function rowsToMonth(priceRows, entryRows) {
  const blob = {};
  const ensure = (d) => {
    if (!blob[d]) blob[d] = { prices: {}, selections: {}, abmeldungen: {} };
    return blob[d];
  };
  for (const p of priceRows || []) ensure(p.datum).prices[p.gericht] = Number(p.preis);
  for (const e of entryRows || []) {
    const day = ensure(e.datum);
    if (e.gericht) day.selections[e.child_id] = e.gericht;
    if (e.abmeldung_active) day.abmeldungen[e.child_id] = { active: true, grund: e.abmeldung_grund || '' };
  }
  return blob;
}

// Monats-Blob -> { priceRows, entryRows } für die relationale Speicherung
export function monthToRows(orgId, blob) {
  const priceRows = [];
  const entryRows = [];
  for (const [datum, day] of Object.entries(blob || {})) {
    for (const [gericht, preis] of Object.entries(day.prices || {})) {
      if (preis === '' || preis === null || preis === undefined) continue;
      const n = Number(preis);
      if (Number.isNaN(n)) continue;
      priceRows.push({ org_id: orgId, datum, gericht, preis: n });
    }
    const childIds = new Set([
      ...Object.keys(day.selections || {}),
      ...Object.keys(day.abmeldungen || {}),
    ]);
    for (const childId of childIds) {
      const gericht = day.selections?.[childId] || null;
      const ab = day.abmeldungen?.[childId];
      const abActive = !!(ab && ab.active);
      if (!gericht && !abActive) continue; // nichts Speicherwertes
      entryRows.push({
        org_id: orgId,
        child_id: childId,
        datum,
        gericht,
        abmeldung_active: abActive,
        abmeldung_grund: (ab && ab.grund) || null,
      });
    }
  }
  return { priceRows, entryRows };
}

// 'meals-YYYY-MM' -> { start: 'YYYY-MM-01', end: erster Tag des Folgemonats }
export function monthRange(monthKey) {
  const ym = String(monthKey).replace('meals-', '');
  const [y, m] = ym.split('-').map(Number);
  const start = `${ym}-01`;
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  const end = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
  return { start, end };
}

// ---- DB-Operationen ----

export async function getMonth(monthKey) {
  const org = await requireOrg();
  if (!org) return {};
  const { start, end } = monthRange(monthKey);
  const [pr, er] = await Promise.all([
    supabase.from('meal_prices').select('datum,gericht,preis').eq('org_id', org).gte('datum', start).lt('datum', end),
    supabase.from('meal_entries').select('child_id,datum,gericht,abmeldung_active,abmeldung_grund').eq('org_id', org).gte('datum', start).lt('datum', end),
  ]);
  if (pr.error) throw pr.error;
  if (er.error) throw er.error;
  return rowsToMonth(pr.data || [], er.data || []);
}

// Die App schreibt den ganzen Monats-Blob -> Monat ersetzen (einfach + korrekt;
// Atomarität ließe sich später per Postgres-RPC ergänzen).
export async function setMonth(monthKey, blob) {
  const org = await requireOrg();
  if (!org) return;
  const { start, end } = monthRange(monthKey);
  const { priceRows, entryRows } = monthToRows(org, blob);

  await supabase.from('meal_prices').delete().eq('org_id', org).gte('datum', start).lt('datum', end);
  await supabase.from('meal_entries').delete().eq('org_id', org).gte('datum', start).lt('datum', end);

  if (priceRows.length) {
    const { error } = await supabase.from('meal_prices').insert(priceRows);
    if (error) throw error;
  }
  if (entryRows.length) {
    const { error } = await supabase.from('meal_entries').insert(entryRows);
    if (error) throw error;
  }
}

export async function deleteMonth(monthKey) {
  const org = await requireOrg();
  if (!org) return;
  const { start, end } = monthRange(monthKey);
  await supabase.from('meal_prices').delete().eq('org_id', org).gte('datum', start).lt('datum', end);
  await supabase.from('meal_entries').delete().eq('org_id', org).gte('datum', start).lt('datum', end);
}

// Vorhandene Monats-Keys ('meals-YYYY-MM') für Export/Übersicht.
export async function listMonthKeys() {
  const org = await requireOrg();
  if (!org) return [];
  const [pr, er] = await Promise.all([
    supabase.from('meal_prices').select('datum').eq('org_id', org),
    supabase.from('meal_entries').select('datum').eq('org_id', org),
  ]);
  if (pr.error) throw pr.error;
  if (er.error) throw er.error;
  const months = new Set();
  for (const r of [...(pr.data || []), ...(er.data || [])]) months.add('meals-' + String(r.datum).slice(0, 7));
  return [...months];
}
