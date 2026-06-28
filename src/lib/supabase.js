import { createClient } from '@supabase/supabase-js';

// Supabase-Client (Auth-Session + RLS-gescopte Queries + Realtime).
// Konfiguration über Vite-Env: lokal aus `npx supabase start`, in Produktion
// aus den Hosting-Env-Vars (Supabase EU-Region). Der anon-Key ist öffentlich
// (durch RLS abgesichert) — der service_role-Key gehört NIE ins Frontend.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen — Supabase ist nicht konfiguriert. ' +
    '`.env.local` aus `npx supabase start` befüllen.'
  );
}

export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
