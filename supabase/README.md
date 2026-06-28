# Supabase — Backend der Web-App (Migration Phase 0+)

Multi-Tenant-Backend (Postgres + Auth + RLS + Realtime + Edge Functions) für die
Migration der KiGa Essenverwaltung von Electron-Desktop zur Web-SaaS.

## Lokale Entwicklung (account-frei, nur Docker nötig)

```bash
# Lokale Supabase-Instanz starten (Postgres, Auth, Realtime, Studio, …)
npm run supabase:start      # bzw. npx supabase start

# Ausgabe liefert API URL + anon key -> nach .env.local übernehmen:
#   VITE_SUPABASE_URL=http://localhost:54321
#   VITE_SUPABASE_ANON_KEY=<anon key aus der Ausgabe>

# Schema/Migrationen (neu) anwenden — setzt die DB zurück und spielt supabase/migrations/* ein
npm run db:reset

# Studio (DB-UI): http://localhost:54323
# Stoppen:
npm run supabase:stop
```

`.env.local` wird nicht eingecheckt (siehe `.gitignore`); Vorlage: `.env.example`.

## Schema & Mandanten-Isolation

- Migrationen liegen versioniert in `supabase/migrations/` und werden beim Go-Live
  identisch auf das gehostete EU-Projekt angewandt (`supabase db push`).
- Jede Datentabelle trägt `org_id`; **Row-Level-Security** erlaubt Zugriff nur auf
  Daten der eigenen Org (`org_id IN (select public.user_org_ids())`). RLS ist die
  Sicherheitsgrenze — nicht der Client.
- `FORCE` RLS nur auf den Datentabellen (`children`, `gruppen`, `meal_prices`,
  `meal_entries`). Metadaten-Tabellen (`organizations`, `profiles`, `memberships`,
  `subscriptions`) nur `ENABLE`, damit die SECURITY-DEFINER-Funktionen
  (`create_organization`, `handle_new_user`) und der `service_role`-Webhook sie
  bootstrappen/schreiben können und die Helper `memberships` ohne Policy-Rekursion
  lesen. Clients bleiben überall voll RLS-gated.

## RLS-Negativtest (Pflicht vor jedem Release)

Mit zwei Test-Orgs sicherstellen, dass User A keine Daten von Org B sieht/schreibt
(Org A ↔ Org B). Sobald Auth steht (Phase 2), als Integrationstest automatisieren.

## Roadmap-Bezug

Phase 0 (dieses Verzeichnis) liefert Schema + RLS + Client-Init. Datenschicht
(`src/lib/data/*`), Auth/Onboarding, Realtime und Billing (Edge Functions) folgen
in den Phasen 1–4 (siehe Migrationsplan).
