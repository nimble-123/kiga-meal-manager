import { supabase } from '../supabase';
import { requireOrg } from './context';

const COLS = 'id,name,gruppe,but,zahlungspfl,adresse,kassenzeichen,hinweise,status,eintritt,austritt';

// DB-Zeile -> App-Child (null -> '' wie im bestehenden Child-Modell).
export function rowToChild(r) {
  return {
    id: r.id,
    name: r.name,
    gruppe: r.gruppe || '',
    but: !!r.but,
    zahlungspfl: r.zahlungspfl || '',
    adresse: r.adresse || '',
    kassenzeichen: r.kassenzeichen || '',
    hinweise: r.hinweise || '',
    status: r.status || 'aktiv',
    eintritt: r.eintritt || '',
    austritt: r.austritt || '',
  };
}

// App-Child -> DB-Zeile ('' -> null für optionale/date-Spalten).
export function childToRow(c, orgId) {
  return {
    id: c.id,
    org_id: orgId,
    name: c.name,
    gruppe: c.gruppe || null,
    but: !!c.but,
    zahlungspfl: c.zahlungspfl || null,
    adresse: c.adresse || null,
    kassenzeichen: c.kassenzeichen || null,
    hinweise: c.hinweise || null,
    status: c.status || 'aktiv',
    eintritt: c.eintritt || null,
    austritt: c.austritt || null,
  };
}

export async function getChildren() {
  const org = await requireOrg();
  if (!org) return [];
  const { data, error } = await supabase
    .from('children').select(COLS).eq('org_id', org).order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToChild);
}

// Die App schreibt das ganze Array -> upsert aller + Löschen der nicht (mehr) enthaltenen.
export async function setChildren(list) {
  const org = await requireOrg();
  if (!org) return;
  const rows = (list || []).map((c) => childToRow(c, org));

  if (rows.length) {
    const { error } = await supabase.from('children').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  const keepIds = new Set(rows.map((r) => r.id));
  const { data: existing, error: selErr } = await supabase
    .from('children').select('id').eq('org_id', org);
  if (selErr) throw selErr;
  const toDelete = (existing || []).map((r) => r.id).filter((id) => !keepIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from('children').delete().eq('org_id', org).in('id', toDelete);
    if (error) throw error;
  }
}
