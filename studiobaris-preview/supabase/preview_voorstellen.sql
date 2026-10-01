-- Uitgevoerd op productie op 2026-10-01 (migratie preview_voorstellen).
-- Previewvoorstellen: kandidaten die Claude dagelijks klaarzet en die beheer
-- op het tabblad Vandaag goedkeurt of afwijst. Alleen bereikbaar via de
-- security-definer-functies hieronder (service_role), net als ai_updates/taken.

create table workflow.preview_voorstellen (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  lead_id         uuid references public.leads(id) on delete set null,
  bedrijfsnaam    text not null,
  vakgebied       text not null,
  plaats          text,
  telefoon        text,
  email           text,
  adres           text,
  website         text,
  website_status  text not null default 'geen'
                  check (website_status in ('geen', 'verouderd', 'offline', 'portaal')),
  reden           text not null,
  bronnen         jsonb not null default '[]'::jsonb,   -- [{label, url}]
  intake          jsonb not null default '{}'::jsonb,   -- diensten, regio, slogan, tone_of_voice, stijl, branche
  status          text not null default 'voorgesteld'
                  check (status in ('voorgesteld', 'bezig', 'preview_gemaakt', 'afgewezen', 'mislukt')),
  afwijs_reden    text,
  beoordeeld_door text,
  beoordeeld_op   timestamptz,
  preview_slug    text,
  fout            text,
  dedup_key       text not null unique
);

create index preview_voorstellen_status_idx on workflow.preview_voorstellen (status, created_at);
create index preview_voorstellen_lead_idx on workflow.preview_voorstellen (lead_id);

alter table workflow.preview_voorstellen enable row level security;
revoke all on workflow.preview_voorstellen from anon, authenticated;

-- Overzicht voor het tabblad Vandaag: alles wat nog aandacht vraagt, plus een
-- korte telling van wat al is afgehandeld.
create or replace function public.sb_voorstellen_overzicht()
returns json
language sql
stable
security definer
set search_path to ''
as $$
  select json_build_object(
    'open', coalesce((
      select json_agg(v order by v.created_at)
      from (
        select id, created_at, lead_id, bedrijfsnaam, vakgebied, plaats, telefoon, email, adres,
               website, website_status, reden, bronnen, intake, status, fout, preview_slug,
               beoordeeld_door, beoordeeld_op
        from workflow.preview_voorstellen
        where status in ('voorgesteld', 'bezig', 'mislukt')
      ) v
    ), '[]'::json),
    'deze_week', (
      select json_build_object(
        'gemaakt',   count(*) filter (where status = 'preview_gemaakt'),
        'afgewezen', count(*) filter (where status = 'afgewezen')
      )
      from workflow.preview_voorstellen
      where beoordeeld_op >= date_trunc('week', now())
    )
  );
$$;

-- Eén voorstel ophalen (voor de goedkeur-route).
create or replace function public.sb_voorstel(p_id uuid)
returns json
language sql
stable
security definer
set search_path to ''
as $$
  select row_to_json(v) from workflow.preview_voorstellen v where v.id = p_id;
$$;

-- Toevoegen door de dagelijkse zoekronde. Dubbel (zelfde dedup_key) wordt
-- stil overgeslagen; geeft dan null terug.
create or replace function public.sb_voorstel_toevoegen(p jsonb)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  r workflow.preview_voorstellen;
begin
  insert into workflow.preview_voorstellen (
    lead_id, bedrijfsnaam, vakgebied, plaats, telefoon, email, adres, website,
    website_status, reden, bronnen, intake, dedup_key
  ) values (
    nullif(p->>'lead_id', '')::uuid,
    p->>'bedrijfsnaam',
    p->>'vakgebied',
    p->>'plaats',
    p->>'telefoon',
    p->>'email',
    p->>'adres',
    p->>'website',
    coalesce(p->>'website_status', 'geen'),
    p->>'reden',
    coalesce(p->'bronnen', '[]'::jsonb),
    coalesce(p->'intake', '{}'::jsonb),
    lower(regexp_replace(coalesce(p->>'bedrijfsnaam', '') || '|' || coalesce(p->>'plaats', ''), '\s+', ' ', 'g'))
  )
  on conflict (dedup_key) do nothing
  returning * into r;
  return case when r.id is null then null else row_to_json(r) end;
end;
$$;

-- Status bijwerken: afwijzen (met reden), 'bezig' bij goedkeuren, en daarna
-- 'preview_gemaakt' (met slug) of 'mislukt' (met fout).
create or replace function public.sb_voorstel_status(
  p_id uuid, p_status text, p_door text default null,
  p_reden text default null, p_slug text default null, p_fout text default null
)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  r workflow.preview_voorstellen;
begin
  update workflow.preview_voorstellen set
    status          = p_status,
    afwijs_reden    = case when p_status = 'afgewezen' then p_reden else afwijs_reden end,
    beoordeeld_door = coalesce(p_door, beoordeeld_door),
    beoordeeld_op   = case when p_status in ('afgewezen', 'bezig') then now() else beoordeeld_op end,
    preview_slug    = coalesce(p_slug, preview_slug),
    fout            = case when p_status = 'mislukt' then p_fout else null end
  where id = p_id
  returning * into r;
  return row_to_json(r);
end;
$$;

revoke all on function public.sb_voorstellen_overzicht() from public, anon, authenticated;
revoke all on function public.sb_voorstel(uuid) from public, anon, authenticated;
revoke all on function public.sb_voorstel_toevoegen(jsonb) from public, anon, authenticated;
revoke all on function public.sb_voorstel_status(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.sb_voorstellen_overzicht() to service_role;
grant execute on function public.sb_voorstel(uuid) to service_role;
grant execute on function public.sb_voorstel_toevoegen(jsonb) to service_role;
grant execute on function public.sb_voorstel_status(uuid, text, text, text, text, text) to service_role;
