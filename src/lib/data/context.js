import { supabase } from '../supabase';

// Aktive Org (Mandant) für alle Datenzugriffe. In Phase 2 nach Login/Onboarding
// gesetzt; im Dev über VITE_DEV_ORG_ID; sonst automatisch die erste Membership.
let activeOrgId = import.meta.env.VITE_DEV_ORG_ID || null;

export function setActiveOrg(orgId) {
  activeOrgId = orgId || null;
}

export function getActiveOrg() {
  return activeOrgId;
}

// Liefert die aktive org_id (RLS-gescopt). Fällt — falls nicht explizit gesetzt —
// auf die erste Org des eingeloggten Users zurück.
export async function requireOrg() {
  if (activeOrgId) return activeOrgId;
  if (!supabase) return null;
  const { data, error } = await supabase.from('memberships').select('org_id').limit(1);
  if (error) throw error;
  activeOrgId = data && data[0] ? data[0].org_id : null;
  return activeOrgId;
}
