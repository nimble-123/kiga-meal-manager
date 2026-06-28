import { supabase } from '../supabase';
import { requireOrg } from './context';

export async function getGruppen() {
  const org = await requireOrg();
  if (!org) return [];
  const { data, error } = await supabase
    .from('gruppen').select('name').eq('org_id', org).order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => r.name);
}

// App schreibt das ganze Namens-Array -> fehlende anlegen, entfernte löschen.
export async function setGruppen(names) {
  const org = await requireOrg();
  if (!org) return;
  const list = [...new Set((names || []).filter(Boolean))];

  if (list.length) {
    const { error } = await supabase
      .from('gruppen')
      .upsert(list.map((name) => ({ org_id: org, name })), { onConflict: 'org_id,name', ignoreDuplicates: true });
    if (error) throw error;
  }

  const { data: existing, error: selErr } = await supabase
    .from('gruppen').select('name').eq('org_id', org);
  if (selErr) throw selErr;
  const toDelete = (existing || []).map((r) => r.name).filter((n) => !list.includes(n));
  if (toDelete.length) {
    const { error } = await supabase.from('gruppen').delete().eq('org_id', org).in('name', toDelete);
    if (error) throw error;
  }
}
