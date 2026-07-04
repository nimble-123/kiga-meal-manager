# Migrationsplan: Electron-Desktop → Multi-Tenant Web-SaaS

> Resume-Dokument. Stand: **2026-07-04**. Branch: **`feat/web-saas-migration`** (ab `main`).

Ziel: Die KiGa Essenverwaltung von der reinen Electron-Desktop-App zu einer **Web-SaaS**
umbauen — mehrere Kitas (Mandanten), strikt isoliert, mehrere Mitarbeiter pro Kita, Login,
Abo-Modell. Electron wird **abgelöst** (nicht parallel betrieben).

---

## 🔴 Aktueller Stand & Sofort-Weitermachen

**Erledigt & gepusht:**
- **Phase 0 (Commit `7d9c199`)** — Supabase-Scaffold, Schema + RLS-Migration, Client, Env, npm-Scripts.
- **Phase 1 (Commit `4227b9a`)** — Supabase-Datenschicht + `storage.js` als Dual-Mode-Adapter.
- **193 Unit/Integration-Tests grün, Build grün.** Die Desktop-App läuft unverändert weiter
  (Dual-Mode: ohne `VITE_SUPABASE_URL` bleibt der alte Pfad aktiv).

**🚧 BLOCKER (verhindert Live-Verifikation):** `npm run supabase:start` schlägt fehl mit
`write …containerd…/meta.db: input/output error` → **Docker-Desktop-Disk ist voll/beschädigt**
(kein Migrationsfehler). Phase 0/1 sind daher **noch NICHT gegen eine laufende DB verifiziert**.

**So geht es weiter (in dieser Reihenfolge):**
1. **Docker reparieren:** Docker Desktop neu starten; Speicher freigeben; ggf. *Settings → Resources →
   Disk image size* vergrößern oder *Troubleshoot → Clean / Purge data*.
2. `npm run supabase:start` (lädt beim 1. Mal Images) → dann `npm run db:reset` (spielt die Migration
   ein; zeigt SQL-Fehler, falls vorhanden).
3. Aus der `supabase start`-Ausgabe **API URL + anon key** in eine `.env.local` schreiben
   (Vorlage: `.env.example`).
4. `npm run dev` gegen Supabase; **Phase 0/1 live durchspielen** (Kind + Essen anlegen → Zeilen in DB
   prüfen via Studio http://localhost:54323).
5. **RLS-Negativtest:** zwei Test-Orgs, sicherstellen dass User A keine Daten von Org B sieht/schreibt.
6. Danach **Phase 2 (Auth & Tenancy)** angehen — ab hier mit echtem Test-Loop.

---

## Entscheidungen (mit Nutzer abgestimmt)

- **Multi-Tenant** — mehrere KiGas, je isoliert; mehrere Mitarbeiter teilen Org-Daten.
- **Backend: Supabase** (Postgres + Auth + Row-Level-Security + Realtime + Edge Functions).
- **Relationales** Persistenzmodell (kein JSONB-Blob).
- **Billing: Stripe** (Checkout + Customer Portal + Webhooks) pro Org — Adapter **dünn halten**,
  damit Mollie/Paddle austauschbar bleiben (EU-Entscheidung offen).
- **Electron wird ersetzt** (entfernt, nicht parallel).
- Kein eigener Backend-Server — Supabase liefert Auth/DB/Realtime direkt an den Client; Mandanten-
  Isolation erzwingt Postgres-**RLS**.

---

## Bereits getroffene Design-Entscheidungen (während Phase 0/1)

- **Schema ans App-Modell angepasst** (statt reiner uuid/Normalform), damit die Storage-Abstraktion
  ein dünner Adapter bleibt und die Hooks unverändert bleiben:
  - `children.id` = **die client-vergebene App-ID** (`c<timestamp>`, `text`), kein uuid.
  - `children.gruppe` = **Gruppenname** (`text`), kein FK. `gruppen` ist nur die Namensliste pro Org.
  - `meal_entries.child_id` = `text` (referenziert `children.id` via Composite-FK `(child_id, org_id)`).
- **Dual-Mode `storage.js`:** nutzt Supabase nur wenn `VITE_SUPABASE_URL/ANON_KEY` gesetzt sind, sonst
  den bisherigen electron-store/localStorage-Pfad → Migration inkrementell, Tests bleiben grün.
- **RLS-Strategie:** `FORCE ROW LEVEL SECURITY` **nur auf den Datentabellen** (`children`, `gruppen`,
  `meal_prices`, `meal_entries`). Metadaten-Tabellen (`organizations`, `profiles`, `memberships`,
  `subscriptions`) nur `ENABLE` — sonst blockiert FORCE die SECURITY-DEFINER-Bootstraps
  (`create_organization`, `handle_new_user`; `auth.uid()` ist im Signup-Trigger `null`) und es entsteht
  Policy-Rekursion über `memberships`. Clients bleiben überall voll gated; nur Definer/`service_role` bypassen.
- **Whole-Month-Replace:** `meals.setMonth` löscht+schreibt den Monat neu (einfach + korrekt). Atomarität
  und granularere Writes (gegen Write-Amplification/Concurrency) sind eine spätere RPC-Optimierung.

---

## Zielarchitektur

```
Browser (React 19 + Vite, statisch gehostet)
   │  Supabase JS Client (Auth-Session, RLS-gescopte Queries, Realtime)
   ▼
Supabase (gehostet, EU-Region)
   ├─ Auth      E-Mail/Passwort + Einladungen, JWT-Session
   ├─ Postgres  Tabellen mit org_id + RLS pro Mandant
   ├─ Realtime  ersetzt subscribeStorage (Live-Sync zwischen Mitarbeitern)
   └─ Edge Fns  Stripe Checkout/Portal/Webhook (service_role, kein eigener Server)
```

---

## Datenmodell (umgesetzt in `supabase/migrations/20260628152135_init.sql`)

```
organizations (id uuid, name, created_at)
profiles      (user_id → auth.users, display_name, tour_completed)   -- ersetzt 'tourCompleted'
memberships   (id, org_id, user_id, role 'admin'|'member', unique(org_id,user_id))
subscriptions (org_id pk, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, seats)
gruppen       (id, org_id, name, unique(org_id,name))                 -- Namensliste pro Org
children      (id TEXT pk, org_id, name, gruppe TEXT, but, zahlungspfl, adresse,
               kassenzeichen, hinweise, status, eintritt, austritt, unique(id,org_id))
meal_prices   (id, org_id, datum, gericht, preis, unique(org_id,datum,gericht))
meal_entries  (id, org_id, child_id TEXT, datum, gericht, abmeldung_active, abmeldung_grund,
               unique(org_id,child_id,datum), FK (child_id,org_id)→children(id,org_id) cascade)
```
- **RLS-Kern:** jede Tabelle mit `org_id`, Policy `org_id IN (select public.user_org_ids())`.
- **Helper (SECURITY DEFINER):** `user_org_ids()`, `is_org_admin(uuid)`; RPC `create_organization(text)`
  (Org + Admin-Membership + Trial); Trigger `handle_new_user` (Profil bei Signup).
- **Realtime-Publication:** `gruppen`, `children`, `meal_prices`, `meal_entries` (für Phase 3).

---

## Was bleibt / was fällt weg

**Bleibt (keine Logikänderung):** alle React-Komponenten, UI/Styling, Tour; reine Utils
(`import.js`, `testData.js`, `analytics.js`, `mealBreakdown.jsx`, `dates.js`, `holidays.js`,
`childUtils.js`); Hooks `useChildren`/`useMeals` (dank Adapter). **CSV/JSON-Import bleibt** der
Datenübernahme-Pfad für Bestands-Desktop-Nutzer (Backup-JSON exportieren → in neue Org importieren).

**Ersetzt:** `src/utils/storage.js` (→ Supabase-Datenschicht, Dual-Mode ✅);
`subscribeStorage`/`notifyStorage` (→ Supabase-Realtime, Phase 3).

**Fällt weg (Phase 5, Electron-only):** `electron/` (main/preload/store/updater) + `window.api`;
`useAutoBackup.js`, `useAutoUpdate.js`; Backup-/Auto-Backup- & Auto-Update-UI in `Administration.jsx`;
Electron-Mail (`window.api.sendEmailWithCSV`) → nur `mailto:`; Deps `electron`, `electron-builder`,
`electron-updater`, `electron-store`, `concurrently`/`wait-on`/`cross-env`; `build`-Block +
`package`-Scripts; `release-please`-Pakettierungs-Jobs. `vite.config.js`: `base: './'` → `base: '/'`.

**Ersatz:** Auto-Backup → Supabase-DB-Backups serverseitig; „Backup als JSON exportieren" bleibt als
manueller Blob-Download. Auto-Update → entfällt (Deployment aktualisiert die Web-App).

---

## Phasen-Fahrplan

| Phase | Inhalt | Status |
|------|--------|--------|
| **0. Setup** | Supabase-Projekt, Schema + RLS (SQL-Migration), Env, `src/lib/supabase.js` | ✅ Code (⚠️ noch nicht DB-verifiziert) |
| **1. Datenschicht** | `src/lib/data/*` + `storage.js` als Adapter; Blob⇄Zeilen; Dual-Mode | ✅ Code + Unit-Tests (⚠️ nicht live-verifiziert) |
| **2. Auth & Tenancy** | Login/Registrierung, Org-Onboarding, Einladungen, `AuthGate` in `App.jsx`, Rollen; `context.setActiveOrg` aus Session | ⬜ **Next** |
| **3. Realtime** | `subscribeStorage` → Supabase-Realtime-Channels (org-gefiltert); Multi-User-Live-Sync | ⬜ |
| **4. Billing** | Stripe-Setup, Edge Functions (Checkout/Portal/Webhook), `subscriptions`-Status, Feature-Gating (Client-UX **+** serverseitig per RLS) | ⬜ |
| **5. Electron-Abbau** | `electron/`, Hooks, UI, Deps entfernen; `vite.config` `base: '/'`; `dev`=nur Vite | ⬜ |
| **6. Tests & CI** | `tests/setup.js` (Supabase statt `window.api` mocken), E2E mit Auth-Seeding, `ci.yml` anpassen, `release-please`-Pakettierung raus | ⬜ |
| **7. Security/DSGVO** | RLS-Härtung + Negativtests, Security-Header/CSP, Key-Hygiene, Org-/Konto-Löschung (Cascade), AVV/Datenschutztexte, MFA-Option | ⬜ |
| **8. Deployment** | Vercel-Frontend (EU-Erwägung), Supabase-Prod (EU-Region), Stripe-Live, DPAs, Datenmigrationspfad (JSON-Import) | ⬜ |

Security (RLS) ist Querschnitt ab Phase 0. Phasen 0–1 liefern eine lauffähige (single-tenant)
Web-App; 2–3 machen sie echt multi-tenant; 4 zahlungsfähig; 7 produktions-/datenschutzreif.

---

## Konkrete nächste Arbeit (Phase 2)

- Neu: `src/lib/auth.js` (Wrapper um `supabase.auth`), `src/components/auth/` (Login, Registrierung,
  Passwort-Reset).
- Org-Onboarding: neue Org anlegen (RPC `create_organization`) **oder** per Einladungslink beitreten.
- `src/App.jsx`: `AuthGate` davor — kein Login ⇒ Login; eingeloggt ohne Org ⇒ Onboarding; sonst App.
  Aktive `org_id` via `src/lib/data/context.setActiveOrg()` aus der Membership setzen.
- Dual-Mode beibehalten: ohne Supabase-Env kein Gate (Tests grün, bis Phase 6 die Mocks umstellt).
- Mitglieder-/Rollenverwaltung (Einladungen, admin/member) als Bereich in `Administration.jsx`.

---

## Verifikation (End-to-End, sobald Docker läuft)

- **Schema/RLS:** `db:reset`; zwei Test-Orgs → User A sieht/schreibt Org B nicht (RLS-Negativtest).
- **Datenschicht:** `npm run dev` gegen Supabase; Kind anlegen, Essen/Preise/Abmeldung, Monats-/
  Jahresbericht, Analytics, CSV/JSON Import & Export.
- **Auth/Onboarding:** Registrieren → Org anlegen → einloggen; zweiten User per Einladung in dieselbe
  Org; gemeinsame Daten; Logout/Session-Persistenz.
- **Realtime:** zwei Sessions derselben Org → Änderung in A erscheint in B ohne Reload.
- **Bestandsdaten:** Backup-JSON der Desktop-App importieren, Vollständigkeit prüfen.
- **Tests/CI:** `npm test`, `npm run test:e2e` grün (angepasste Supabase-Mocks/Seeding); `ci.yml`.
- **Security:** RLS-Negativtest; Bundle nach `service_role`/Stripe-Secrets durchsuchen (dürfen NICHT
  im Client landen); Security-Header-Scan; Org-/Konto-Löschung (Cascade greift); Datenexport vollständig.
- **Deployment:** Prod-Deploy + Smoke-Test gegen Supabase-Prod (EU) & Stripe-Live; Webhook end-to-end.

---

## Security & DSGVO (eigener, nicht optionaler Arbeitsbereich — reale Kinder-Personendaten)

- **Transit** durchgehend TLS; **at rest** Supabase-Postgres + Backups AES-256; optional Feld-Level-
  Verschlüsselung sensibler Felder (spätere Ausbaustufe).
- **Auth:** bcrypt-Hashes, JWT; E-Mail-Bestätigung Pflicht, starke Passwort-Policy, **MFA optional**;
  Rate-Limiting via Supabase-Auth-Settings.
- **RLS ist die Sicherheitsgrenze:** Datentabellen `FORCE`, jede Policy per Negativtest geprüft, default-deny.
- **Key-Hygiene:** `anon`-Key öffentlich (durch RLS ok); `service_role` + Stripe-Secret/Webhook-Secret
  **nur** in Edge Functions, nie im Browser-Bundle. Security-Header (CSP/HSTS/X-Frame-Options) am Frontend.
- **DSGVO:** Datenstandort **EU** (Supabase Frankfurt); AVV/DPA mit Supabase, Vercel, Stripe; die Kita ist
  Verantwortlicher, der Betreiber **Auftragsverarbeiter** (AVV-Vorlage, VVT, TOMs). Betroffenenrechte:
  Datenexport (vorhandener JSON/CSV-Export) + **Löschung** (Org-/Konto-Löschung mit `ON DELETE CASCADE`).
  Datensparsamkeit, Aufbewahrungsfristen; Tracking minimieren (nur technisch nötige Cookies).
  Rechtstexte: Datenschutzerklärung, Impressum, AGB, AVV. *Vor Live-Gang von Datenschutz-Expertise
  gegenprüfen lassen.*

---

## Deployment & EU-/DE-Alternativen

- **Pragmatisch/schnell:** Vercel + Stripe + Supabase-EU (alle mit DPA, DSGVO-fähig).
- **Strikt EU/DE:** IONOS Deploy Now (oder Hetzner + Coolify) + **Mollie** (🇳🇱, EU) oder Paddle
  (Merchant of Record) + Supabase-EU.
- **Alles selbst in DE:** Hetzner + Coolify + **self-hosted Supabase** + Mollie (deutlich mehr Betrieb).
- Hosting-Wechsel ist trivial (statische Assets); Payment-Wechsel relevanter (Billing-Logik in den Edge
  Functions provider-spezifisch) → **Billing-Adapter dünn und austauschbar halten**. Env-Vars getrennt
  nach Preview/Production. Schema-Migrationen versioniert (`supabase db push`); CI: GitHub Actions für
  Tests, Vercel für Frontend, Supabase-Migrationen optional als eigener Schritt.

---

## Risiken & offene Punkte

- **Docker-Disk defekt** → aktuell keine Live-Verifikation (s. oben). Erster Schritt beim Weitermachen.
- **Billing-Komplexität:** Stripe-Webhook ist die einzige Wahrheit für den Abo-Status — Signaturprüfung,
  Idempotenz, `trialing/active/past_due/canceled` sauber; Feature-Gating **doppelt** (Client-UX + RLS);
  Steuer/USt früh klären.
- **Datenmigration Bestandsnutzer:** kein Auto-Import aus `electron-store`; Pfad = Backup-JSON exportieren
  → in neue Org importieren (`import.js`/`parseMealsJSON`/`parseChildrenJSON`). In Phase 6/8 dokumentieren.
- **Concurrency:** Whole-Array/Whole-Month-Writes des Adapters sind last-write-wins auf Array-/Monatsebene;
  granularere Writes (+ Realtime) sind eine spätere Verbesserung.
- **Offline:** entfällt ggü. Desktop; später via PWA/Service-Worker nachrüstbar.
- **Offene PRs:** Migration löst Teile von PR #7 (Electron-Lizenz/Verschlüsselung → Stripe-Abo) ab;
  PR #9-Telemetrie (Aptabase via Electron-Main) müsste aufs Web-SDK; PR #8 (Week-Toggle) überlebt.
  Auflösung Migration ↔ offene PRs noch offen.

---

## Datei-Landkarte (Migration)

```
supabase/
  config.toml
  migrations/20260628152135_init.sql   Schema + RLS + Helper/RPC + Realtime
  README.md                            lokaler Workflow
src/lib/
  supabase.js                          Client (null ohne Env → Dual-Mode-Fallback)
  data/
    context.js                         aktive org_id (setActiveOrg/requireOrg)
    children.js                        getChildren/setChildren (+ row-Mapping)
    gruppen.js                         getGruppen/setGruppen
    meals.js                           getMonth/setMonth + rowsToMonth/monthToRows (rein)
    profile.js                         tour_completed pro User
src/utils/storage.js                   Dual-Mode-Fassade (Supabase | electron/localStorage)
tests/unit/dataMapping.test.js         Blob⇄Zeilen + child-Mapping
.env.example                           VITE_SUPABASE_URL/ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY
```

npm-Scripts: `supabase:start`, `supabase:stop`, `db:reset`.
