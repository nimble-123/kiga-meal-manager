-- KiGa Essenverwaltung — Multi-Tenant Initial-Schema
-- Mandanten-Isolation wird über org_id + Row-Level-Security erzwungen.
-- Sicherheitsgrenze ist Postgres-RLS (im Client nicht umgehbar).

-- ============================================================
-- Tabellen
-- ============================================================

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  tour_completed boolean not null default false,   -- ersetzt das alte 'tourCompleted'
  created_at     timestamptz not null default now()
);

create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Billing-Status pro Org (geschrieben ausschließlich vom Stripe-Webhook via service_role).
create table public.subscriptions (
  org_id                 uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text,
  status                 text not null default 'trialing'
                           check (status in ('trialing','active','past_due','canceled','incomplete','unpaid')),
  current_period_end     timestamptz,
  seats                  int,
  updated_at             timestamptz not null default now()
);

-- Liste der Gruppennamen pro Org (children.gruppe referenziert den Namen, App-Modell).
create table public.gruppen (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

-- id ist die vom Client vergebene App-ID (`c<timestamp>`), kein uuid -> die Hooks
-- (whole-array writes) bleiben unverändert; gruppe ist der Gruppenname (App-Modell).
create table public.children (
  id            text not null,
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  gruppe        text,
  but           boolean not null default false,
  zahlungspfl   text,
  adresse       text,
  kassenzeichen text,
  hinweise      text,
  status        text not null default 'aktiv' check (status in ('aktiv','inaktiv')),
  eintritt      date,
  austritt      date,
  created_at    timestamptz not null default now(),
  primary key (id),
  unique (id, org_id)            -- Ziel für Composite-FK aus meal_entries
);

-- Preise pro Tag/Gericht (ersetzt prices im Monats-Blob)
create table public.meal_prices (
  id      uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.organizations(id) on delete cascade,
  datum   date not null,
  gericht text not null,
  preis   numeric(10,2) not null default 0,
  unique (org_id, datum, gericht)
);

-- Eine Zeile pro Kind/Tag (ersetzt selections + abmeldungen im Monats-Blob)
create table public.meal_entries (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations(id) on delete cascade,
  child_id         text not null,
  datum            date not null,
  gericht          text,                              -- null = keine Auswahl
  abmeldung_active boolean not null default false,
  abmeldung_grund  text,
  unique (org_id, child_id, datum),
  -- erzwingt, dass das Kind zur selben Org gehört, + Cascade bei Kind-Löschung
  foreign key (child_id, org_id) references public.children(id, org_id) on delete cascade
);

-- ============================================================
-- Indizes (org_id-Scoping + häufige Filter)
-- ============================================================
create index idx_memberships_user      on public.memberships(user_id);
create index idx_memberships_org        on public.memberships(org_id);
create index idx_gruppen_org            on public.gruppen(org_id);
create index idx_children_org           on public.children(org_id);
create index idx_meal_prices_org_datum  on public.meal_prices(org_id, datum);
create index idx_meal_entries_org_datum on public.meal_entries(org_id, datum);
create index idx_meal_entries_child     on public.meal_entries(child_id);

-- ============================================================
-- Helper-Funktionen (SECURITY DEFINER, um RLS-Rekursion auf memberships zu vermeiden)
-- ============================================================
create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from public.memberships where user_id = auth.uid()
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.memberships
    where org_id = p_org and user_id = auth.uid() and role = 'admin'
  )
$$;

-- Org anlegen + Ersteller als Admin + Trial-Subscription (Onboarding, Phase 2).
create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.organizations (name) values (p_name) returning id into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org, auth.uid(), 'admin');
  insert into public.subscriptions (org_id, status) values (v_org, 'trialing');
  return v_org;
end;
$$;

-- Profil automatisch bei Registrierung anlegen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row-Level-Security
-- FORCE nur auf den eigentlichen Datentabellen (ausschließlich Client-Writes → max. Härte,
-- default-deny auch für den Owner). Metadaten-Tabellen (organizations/profiles/memberships/
-- subscriptions) nur ENABLE, damit (a) die SECURITY-DEFINER-Funktionen create_organization /
-- handle_new_user diese bootstrappen können (Owner bypasst RLS nur ohne FORCE; auth.uid() ist im
-- Signup-Trigger null) und (b) die Helper memberships ohne Policy-Rekursion lesen.
-- Clients bleiben überall voll RLS-gated; nur Definer/service_role bypassen.
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.memberships   enable row level security;
alter table public.subscriptions enable row level security;

alter table public.gruppen       enable row level security;
alter table public.gruppen       force  row level security;
alter table public.children      enable row level security;
alter table public.children      force  row level security;
alter table public.meal_prices   enable row level security;
alter table public.meal_prices   force  row level security;
alter table public.meal_entries  enable row level security;
alter table public.meal_entries  force  row level security;

-- organizations: Mitglieder lesen; Admins ändern/löschen. Anlage nur via RPC.
create policy org_select on public.organizations
  for select using (id in (select public.user_org_ids()));
create policy org_update on public.organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));
create policy org_delete on public.organizations
  for delete using (public.is_org_admin(id));

-- profiles: nur das eigene Profil.
create policy profile_select on public.profiles
  for select using (user_id = auth.uid());
create policy profile_insert on public.profiles
  for insert with check (user_id = auth.uid());
create policy profile_update on public.profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- memberships: Mitglieder der eigenen Orgs sehen; Admins verwalten; selbst austreten.
create policy membership_select on public.memberships
  for select using (org_id in (select public.user_org_ids()));
create policy membership_insert on public.memberships
  for insert with check (public.is_org_admin(org_id));
create policy membership_update on public.memberships
  for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
create policy membership_delete on public.memberships
  for delete using (public.is_org_admin(org_id) or user_id = auth.uid());

-- subscriptions: Mitglieder lesen den Status. Schreiben NUR via service_role (Webhook) -> keine Write-Policy.
create policy subscription_select on public.subscriptions
  for select using (org_id in (select public.user_org_ids()));

-- Datentabellen: voller Zugriff nur innerhalb der eigenen Org.
create policy gruppen_all on public.gruppen
  for all using (org_id in (select public.user_org_ids()))
          with check (org_id in (select public.user_org_ids()));
create policy children_all on public.children
  for all using (org_id in (select public.user_org_ids()))
          with check (org_id in (select public.user_org_ids()));
create policy meal_prices_all on public.meal_prices
  for all using (org_id in (select public.user_org_ids()))
          with check (org_id in (select public.user_org_ids()));
create policy meal_entries_all on public.meal_entries
  for all using (org_id in (select public.user_org_ids()))
          with check (org_id in (select public.user_org_ids()));

-- ============================================================
-- Grants (RLS bleibt die eigentliche Zugriffsgrenze)
-- ============================================================
grant execute on function public.user_org_ids()           to authenticated;
grant execute on function public.is_org_admin(uuid)        to authenticated;
grant execute on function public.create_organization(text) to authenticated;

-- ============================================================
-- Realtime (Phase 3: ersetzt subscribeStorage)
-- ============================================================
alter publication supabase_realtime add table
  public.gruppen, public.children, public.meal_prices, public.meal_entries;
