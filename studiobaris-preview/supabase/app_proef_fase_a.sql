-- App-proef fase A (nov 2026): losse app-klanten (alleen plugin) van buitenaf.
--
-- Wat dit doet:
--   * Koppelt een klant in het Klantenregister (workflow.previews) vast aan zijn
--     app-account (public.companies). Tot nu toe raadde het dashboard die
--     koppeling op naam/slug (zoekAppAccount); dat blijft als terugval.
--   * Geeft elk app-account een "toegang": website | proef | pro |
--     achterstallig | verlopen | opgezegd. Bestaande accounts krijgen
--     'website' en merken hier niets van (er wordt in fase A nog nergens op
--     gecontroleerd; dat slot bouwt Gerrit in fase B).
--   * Een schakelaar (workflow.app_proef_instelling.open) voor de openbare
--     proefpagina. Staat standaard UIT.
--
-- Let op: dit is iets anders dan de bestaande "proefperiode" van de demo-app
-- (workflow.proef, 3 projecten / 30 dagen voor prospects). Daarom heet alles
-- hier "app_proef" of "toegang".

-- 1. Koppeling register <-> app-account ----------------------------------------
alter table workflow.previews
  add column if not exists company_id uuid unique
    references public.companies(id) on delete set null;

-- 2. Toegang van het app-account --------------------------------------------------
alter table public.companies
  add column if not exists toegang text not null default 'website',
  add column if not exists proef_eindigt_op timestamptz,
  add column if not exists betaald_tot date;

do $$ begin
  alter table public.companies add constraint companies_toegang_check
    check (toegang in ('website','proef','pro','achterstallig','verlopen','opgezegd'));
exception when duplicate_object then null; end $$;

-- 3. Beveiliging: een ingelogde app-gebruiker mag zijn eigen toegang nooit zelf
--    wijzigen (anders zet iemand zichzelf gratis op 'pro'). Alleen de server
--    (service_role) mag deze drie velden zetten.
create or replace function public.trg_companies_toegang_bewaken()
returns trigger language plpgsql set search_path = 'public' as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      -- Zelf aangemaakte accounts (oude onboarding in de app) krijgen geen
      -- gratis toegang; fase B beslist hoe die verder gaan.
      new.toegang := 'verlopen';
      new.proef_eindigt_op := null;
      new.betaald_tot := null;
    else
      new.toegang := old.toegang;
      new.proef_eindigt_op := old.proef_eindigt_op;
      new.betaald_tot := old.betaald_tot;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists companies_toegang_bewaken on public.companies;
create trigger companies_toegang_bewaken
  before insert or update on public.companies
  for each row execute function public.trg_companies_toegang_bewaken();

revoke all on function public.trg_companies_toegang_bewaken() from public, anon, authenticated;

-- 4. Schakelaar voor de openbare proefpagina --------------------------------------
create table if not exists workflow.app_proef_instelling (
  id          int primary key default 1 check (id = 1),
  open        boolean not null default false,
  gewijzigd_door text,
  bijgewerkt  timestamptz not null default now()
);
insert into workflow.app_proef_instelling (id) values (1) on conflict (id) do nothing;
alter table workflow.app_proef_instelling enable row level security;
-- Geen policies: alleen de server (service_role) leest en schrijft.

-- 5. Snel zoeken ------------------------------------------------------------------
create index if not exists companies_toegang_idx on public.companies (toegang)
  where toegang <> 'website';
