-- Proefperiode voor de persoonlijke demo-app (okt 2026).
--
-- Wat dit doet:
--   * Een prospect kan in zijn demo-app maximaal 3 projecten zelf plaatsen.
--   * Die projecten blijven staan: het openen van de demo-link zet de demo
--     niet meer terug zodra de proefperiode loopt.
--   * De proefperiode (30 dagen) start bij de eerste keer dat de demo-app
--     wordt geopend, of eerder via de knop "Start proefperiode" in het dashboard.
--   * Na 30 dagen krijgen Gerrit en Levi de maandvraag (zie sb_vandaag).
--
-- Alles staat achter een schakelaar (workflow.proef_instelling): zolang
-- live = false geldt het alleen voor de slugs in test_slugs. Alle andere
-- demo's werken exact zoals voorheen.
--
-- De proefgegevens staan bewust in een eigen tabel en NIET in
-- workflow.previews: die tabel heeft een trigger die updated_at bijwerkt, en
-- sb_vandaag gebruikt updated_at voor "dagen stil" en "Feedback binnen".

-- 1. Schakelaar ----------------------------------------------------------------
create table if not exists workflow.proef_instelling (
  id          int primary key default 1 check (id = 1),
  live        boolean not null default false,
  test_slugs  text[]  not null default '{}',
  bijgewerkt  timestamptz not null default now()
);
insert into workflow.proef_instelling (id) values (1) on conflict do nothing;
alter table workflow.proef_instelling enable row level security;

-- 2. Proefstatus per preview ---------------------------------------------------
create table if not exists workflow.proef (
  slug        text primary key,
  gestart_op  timestamptz not null default now(),
  tot         timestamptz not null default now() + interval '30 days',
  gestart_via text not null default 'app',      -- 'app' of 'knop'
  geplaatst   int not null default 0,           -- door de prospect geplaatste projecten
  verlengd    int not null default 0
);
alter table workflow.proef enable row level security;

create or replace function workflow.proef_geldt(p_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select i.live or p_slug = any(i.test_slugs)
                   from workflow.proef_instelling i where i.id = 1), false);
$$;

-- 3. Terugzetten naar beginstand (ongewijzigde kern van de oude reset) --------
create or replace function public.sb_demo_terugzetten(p_van_slug text)
returns boolean language plpgsql security definer set search_path = 'public' as $$
declare
  b   public.demo_baselines%rowtype;
  cid uuid;
begin
  select id into cid from public.companies where demo_van_slug = p_van_slug and is_demo;
  if cid is null then return false; end if;
  select * into b from public.demo_baselines where company_id = cid;
  if not found then return false; end if;

  -- Laat de teller-trigger weten dat dit een reset is, geen prospect.
  perform set_config('sb.demo_reset', '1', true);

  delete from public.reviews  where company_id = cid;
  delete from public.projects where company_id = cid;

  update public.companies c set
    name                = x.name,
    slug                = x.slug,
    phone               = x.phone,
    email               = x.email,
    whatsapp            = x.whatsapp,
    google_review_url   = x.google_review_url,
    brand_primary       = x.brand_primary,
    brand_accent        = x.brand_accent,
    voice_style         = x.voice_style,
    daily_project_limit = x.daily_project_limit,
    daily_review_limit  = x.daily_review_limit
  from (select (jsonb_populate_record(null::public.companies, b.company)).*) x
  where c.id = cid;

  insert into public.projects
  select (jsonb_populate_record(null::public.projects, e)).*
  from jsonb_array_elements(b.projects) e;

  insert into public.reviews
  select (jsonb_populate_record(null::public.reviews, e)).*
  from jsonb_array_elements(b.reviews) e;

  perform set_config('sb.demo_reset', '0', true);
  return true;
end $$;

-- Proef starten: demo schoon, limiet 3, klok op 30 dagen.
create or replace function public.sb_proef_start(p_slug text, p_via text default 'knop')
returns json language plpgsql security definer set search_path = 'public' as $$
declare ok boolean; r workflow.proef%rowtype;
begin
  ok := public.sb_demo_terugzetten(p_slug);
  if not ok then return json_build_object('ok', false, 'error', 'Geen demo-app gevonden voor deze preview.'); end if;

  update public.companies set daily_project_limit = 3
  where demo_van_slug = p_slug and is_demo;

  insert into workflow.proef (slug, gestart_op, tot, gestart_via, geplaatst, verlengd)
  values (p_slug, now(), now() + interval '30 days', coalesce(p_via, 'knop'), 0, 0)
  on conflict (slug) do update set
    gestart_op = excluded.gestart_op, tot = excluded.tot,
    gestart_via = excluded.gestart_via, geplaatst = 0, verlengd = 0
  returning * into r;

  return json_build_object('ok', true, 'gestart_op', r.gestart_op, 'tot', r.tot);
end $$;

-- 4. De reset die de app aanroept bij het openen van de demo-link -------------
create or replace function public.sb_demo_reset_klant(p_van_slug text)
returns boolean language plpgsql security definer set search_path = 'public' as $$
declare cid uuid;
begin
  if not workflow.proef_geldt(p_van_slug) then
    return public.sb_demo_terugzetten(p_van_slug);           -- oude gedrag
  end if;

  select id into cid from public.companies where demo_van_slug = p_van_slug and is_demo;
  if cid is null then return false; end if;

  if exists (select 1 from workflow.proef where slug = p_van_slug) then
    return true;                                             -- proef loopt: niets wissen
  end if;

  -- Eerste keer geopend: proef start automatisch.
  return coalesce((public.sb_proef_start(p_van_slug, 'app')->>'ok')::boolean, false);
end $$;

-- 5. Teller: 3 projecten in totaal ---------------------------------------------
create or replace function public.trg_proef_teller()
returns trigger language plpgsql security definer set search_path = 'public' as $$
declare s text; n int;
begin
  if current_setting('sb.demo_reset', true) = '1' then return new; end if;

  select demo_van_slug into s from public.companies
  where id = new.company_id and is_demo and demo_van_slug is not null;
  if s is null then return new; end if;                      -- geen persoonlijke demo
  if not workflow.proef_geldt(s) then return new; end if;

  update workflow.proef set geplaatst = geplaatst + 1 where slug = s
  returning geplaatst into n;

  if n is not null and n >= 3 then
    update public.companies set daily_project_limit = 0 where id = new.company_id;
  end if;
  return new;
end $$;

drop trigger if exists proef_teller on public.projects;
create trigger proef_teller after insert on public.projects
for each row execute function public.trg_proef_teller();

-- 6. Verlengen -----------------------------------------------------------------
create or replace function public.sb_proef_verleng(p_slug text)
returns json language plpgsql security definer set search_path = 'public' as $$
declare r workflow.proef%rowtype;
begin
  update workflow.proef
  set tot = greatest(tot, now()) + interval '30 days', verlengd = verlengd + 1
  where slug = p_slug returning * into r;
  if not found then return json_build_object('ok', false, 'error', 'Geen lopende proefperiode.'); end if;
  return json_build_object('ok', true, 'tot', r.tot);
end $$;

-- 7. Wat de preview nodig heeft ------------------------------------------------
create or replace function public.sb_proef_preview(p_slug text)
returns json language plpgsql stable security definer set search_path = 'public' as $$
declare cid uuid; r workflow.proef%rowtype; pj json;
begin
  if not workflow.proef_geldt(p_slug) then return json_build_object('actief', false); end if;
  select id into cid from public.companies where demo_van_slug = p_slug and is_demo;
  if cid is null then return json_build_object('actief', false); end if;

  select * into r from workflow.proef where slug = p_slug;

  select coalesce(json_agg(x order by x.geplaatst_op desc), '[]'::json) into pj from (
    select p.name as titel, p.location as plaats, p.ai_text as omschrijving,
           coalesce(p.after_photos[1], p.during_photos[1], p.before_photos[1]) as beeld_url,
           coalesce(p.published_at, p.created_at) as geplaatst_op
    from public.projects p
    where p.company_id = cid and p.status = 'published'
      and not exists (
        select 1 from public.demo_baselines b, jsonb_array_elements(b.projects) e
        where b.company_id = cid and (e->>'id')::uuid = p.id)
  ) x;

  return json_build_object(
    'actief', true,
    'gestart_op', r.gestart_op,
    'tot', r.tot,
    'geplaatst', coalesce(r.geplaatst, 0),
    'projecten', pj);
end $$;

-- 8. Rechten: alleen de server ------------------------------------------------
revoke all on function workflow.proef_geldt(text)            from public, anon, authenticated;
revoke all on function public.sb_demo_terugzetten(text)      from public, anon, authenticated;
revoke all on function public.sb_proef_start(text, text)     from public, anon, authenticated;
revoke all on function public.sb_proef_verleng(text)         from public, anon, authenticated;
revoke all on function public.sb_proef_preview(text)         from public, anon, authenticated;
revoke all on function public.trg_proef_teller()             from public, anon, authenticated;
grant execute on function public.sb_demo_terugzetten(text)   to service_role;
grant execute on function public.sb_proef_start(text, text)  to service_role;
grant execute on function public.sb_proef_verleng(text)      to service_role;
grant execute on function public.sb_proef_preview(text)      to service_role;
grant execute on function workflow.proef_geldt(text)         to service_role;

-- 9. sb_demo_maak: voorbeeldprojecten tellen niet als "door prospect geplaatst".
--    Enige wijziging t.o.v. de bestaande functie: de set_config-regels.
create or replace function public.sb_demo_maak(p_van_slug text, p_owner uuid, p_naam text, p_primair text, p_accent text, p_telefoon text, p_wachtwoord text, p_projecten jsonb, p_reviews jsonb)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  cid  uuid;
  e    jsonb;
  n    int := 0;
  txt  text;
begin
  perform set_config('sb.demo_reset', '1', true);

  select id into cid from public.companies where demo_van_slug = p_van_slug;

  if cid is null then
    insert into public.companies (owner_id, name, slug, phone, brand_primary, brand_accent,
                                  is_demo, demo_van_slug, demo_wachtwoord,
                                  daily_project_limit, daily_review_limit, abonnementsvorm)
    values (p_owner, p_naam, 'demo-' || p_van_slug, nullif(p_telefoon, ''),
            coalesce(nullif(p_primair, ''), '#1A2E40'),
            coalesce(nullif(p_accent, ''), '#F7B05B'),
            true, p_van_slug, p_wachtwoord, 99, 99, 'demo')
    returning id into cid;
  else
    update public.companies set
      owner_id        = coalesce(p_owner, owner_id),
      name            = p_naam,
      phone           = nullif(p_telefoon, ''),
      brand_primary   = coalesce(nullif(p_primair, ''), '#1A2E40'),
      brand_accent    = coalesce(nullif(p_accent, ''), '#F7B05B'),
      demo_wachtwoord = coalesce(p_wachtwoord, demo_wachtwoord),
      is_demo         = true
    where id = cid;
  end if;

  delete from public.reviews  where company_id = cid;
  delete from public.projects where company_id = cid;
  delete from public.usage    where company_id = cid;

  for e in select value from jsonb_array_elements(coalesce(p_projecten, '[]'::jsonb)) limit 6 loop
    n := n + 1;
    txt := coalesce(nullif(e->>'titel', ''), 'Klus') ||
           case when coalesce(e->>'plaats', '') <> '' then ' in ' || (e->>'plaats') else '' end ||
           '. Netjes opgeleverd, klant blij. Dit is een voorbeeldproject - jij vervangt het straks door je eigen werk.';
    insert into public.projects (company_id, type, name, location, raw_text, ai_text,
                                 after_photos, status, published_at, created_at)
    values (
      cid, 'project',
      coalesce(nullif(e->>'titel', ''), 'Project ' || n),
      nullif(e->>'plaats', ''),
      null, txt,
      case when coalesce(e->>'beeld_url', '') <> '' then array[e->>'beeld_url'] else '{}'::text[] end,
      'published',
      now() - (n || ' days')::interval,
      now() - (n || ' days')::interval
    );
  end loop;

  n := 0;
  for e in select value from jsonb_array_elements(coalesce(p_reviews, '[]'::jsonb)) limit 5 loop
    n := n + 1;
    insert into public.reviews (company_id, token, customer_name, channel, stars, comment,
                                status, sent_at, seen_at, submitted_at)
    values (
      cid,
      replace(gen_random_uuid()::text, '-', ''),
      coalesce(nullif(e->>'naam', ''), 'Klant'),
      'whatsapp',
      coalesce((e->>'score')::int, 5),
      nullif(e->>'tekst', ''),
      'submitted_website',
      now() - (n || ' days')::interval,
      now() - (n || ' days')::interval,
      now() - (n || ' days')::interval
    );
  end loop;

  insert into public.demo_baselines (company_id, company, projects, reviews)
  select cid,
         to_jsonb(c),
         coalesce((select jsonb_agg(to_jsonb(p)) from public.projects p where p.company_id = cid), '[]'::jsonb),
         coalesce((select jsonb_agg(to_jsonb(r)) from public.reviews  r where r.company_id = cid), '[]'::jsonb)
  from public.companies c where c.id = cid
  on conflict (company_id) do update set
    company    = excluded.company,
    projects   = excluded.projects,
    reviews    = excluded.reviews,
    gemaakt_op = now();

  perform set_config('sb.demo_reset', '0', true);
  return cid;
end $function$;
