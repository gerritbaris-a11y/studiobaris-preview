-- App-proef fase A: serverfuncties (alleen service_role).
-- Bouwt voort op app_proef_fase_a.sql. Raakt geen bestaande functies.

-- Welke herinneringsmails zijn al verstuurd (nooit dubbel).
create table if not exists workflow.app_proef_mail (
  company_id  uuid not null references public.companies(id) on delete cascade,
  soort       text not null check (soort in ('welkom','dag5','dag7')),
  verstuurd_op timestamptz not null default now(),
  primary key (company_id, soort)
);
alter table workflow.app_proef_mail enable row level security;

-- Schakelaar lezen / zetten ------------------------------------------------------
create or replace function public.sb_app_proef_instelling()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object('open', open, 'gewijzigd_door', gewijzigd_door, 'bijgewerkt', bijgewerkt)
  from workflow.app_proef_instelling where id = 1;
$$;

create or replace function public.sb_app_proef_schakelaar(p_open boolean, p_door text)
returns json language sql security definer set search_path = '' as $$
  update workflow.app_proef_instelling
     set open = p_open, gewijzigd_door = p_door, bijgewerkt = now()
   where id = 1
  returning json_build_object('open', open, 'gewijzigd_door', gewijzigd_door, 'bijgewerkt', bijgewerkt);
$$;

-- Proef starten ------------------------------------------------------------------
-- Maakt een app-account met 7 dagen proef. Nog GEEN rij in het Klantenregister,
-- behalve: bestaat dit e-mailadres al als lead, dan wordt die rij gekoppeld.
create or replace function public.sb_app_proef_start(
  p_naam text, p_bedrijf text, p_email text, p_domein text, p_dagen int default 7
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_email  text := lower(trim(coalesce(p_email, '')));
  v_domein text := lower(trim(coalesce(p_domein, '')));
  v_basis  text; v_slug text; v_i int := 1;
  v_id uuid; v_token text; v_sleutel text; v_lead text;
begin
  if coalesce(trim(p_bedrijf), '') = '' or v_email = '' or v_domein = '' then
    return json_build_object('ok', false, 'fout', 'onvolledig');
  end if;

  if exists (select 1 from public.companies
              where lower(coalesce(email, '')) = v_email
                 or v_domein = any (coalesce(allowed_domains, '{}'::text[]))) then
    return json_build_object('ok', false, 'fout', 'bestaat_al');
  end if;

  v_basis := trim(both '-' from lower(regexp_replace(trim(p_bedrijf), '[^a-zA-Z0-9]+', '-', 'g')));
  if v_basis = '' then v_basis := 'bedrijf'; end if;
  v_slug := v_basis;
  while exists (select 1 from public.companies where slug = v_slug) loop
    v_i := v_i + 1; v_slug := v_basis || '-' || v_i;
  end loop;

  v_token   := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_sleutel := 'SB-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)) || '-'
                     || upper(substr(md5(gen_random_uuid()::text), 1, 4)) || '-'
                     || upper(substr(md5(gen_random_uuid()::text), 1, 4));

  insert into public.companies (
    name, slug, email, contact_naam, allowed_domains, license_key, soort,
    login_token, login_token_expires_at, toegang, proef_eindigt_op
  ) values (
    trim(p_bedrijf), v_slug, v_email, nullif(trim(coalesce(p_naam, '')), ''),
    array[v_domein], v_sleutel, 'vakman',
    v_token, now() + interval '30 days', 'proef',
    now() + make_interval(days => greatest(1, coalesce(p_dagen, 7)))
  ) returning id into v_id;

  -- Bestaande lead met hetzelfde e-mailadres? Dan koppelen (hij staat al in
  -- het register of in de previews), geen nieuwe rij.
  update workflow.previews p set company_id = v_id
   where p.id = (select id from workflow.previews
                  where company_id is null
                    and (lower(coalesce(lead_email, '')) = v_email
                         or lower(coalesce(factuur_email, '')) = v_email)
                  order by klantnummer nulls last, created_at desc limit 1)
  returning p.slug into v_lead;

  return json_build_object(
    'ok', true, 'company_id', v_id, 'slug', v_slug, 'login_token', v_token,
    'license_key', v_sleutel, 'bestaande_lead', v_lead,
    'proef_eindigt_op', (select proef_eindigt_op from public.companies where id = v_id)
  );
end $$;

-- Overzicht voor het tabblad App-proef --------------------------------------------
create or replace function public.sb_app_proef_lijst()
returns json language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(r order by r.proef_eindigt_op desc), '[]'::json) from (
    select c.id, c.name, c.slug, c.email, c.contact_naam, c.soort,
           (coalesce(c.allowed_domains, '{}'::text[]))[1] as domein,
           c.toegang, c.proef_eindigt_op, c.betaald_tot, c.created_at,
           c.plugin_versie, c.plugin_gezien_op,
           p.slug as register_slug, p.klantnummer, p.klant_kandidaat, p.verzamelaar,
           (p.id is not null and p.created_at < c.created_at) as bestaande_lead,
           (select count(*) from public.projects pr
             where pr.company_id = c.id and pr.created_at <= c.proef_eindigt_op) as klussen_proef,
           (select count(*) from public.projects pr where pr.company_id = c.id) as klussen_totaal
      from public.companies c
      left join workflow.previews p on p.company_id = c.id
     where c.proef_eindigt_op is not null
       and not c.is_demo and c.demo_van_slug is null
  ) r;
$$;

-- Interne hulp: zorg dat er een register-rij is voor dit app-account ---------------
-- Nieuwe rij is onzichtbaar in het register (geen klantnummer, geen kandidaat)
-- en geen openbare preview (gepubliceerd = false).
create or replace function workflow.app_proef_rij(p_company_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v_slug text; v_basis text; v_i int := 1; c public.companies%rowtype;
begin
  select slug into v_slug from workflow.previews where company_id = p_company_id;
  if v_slug is not null then return v_slug; end if;

  select * into c from public.companies where id = p_company_id;
  if not found then raise exception 'app-account niet gevonden'; end if;

  v_basis := trim(both '-' from lower(regexp_replace(trim(c.name), '[^a-zA-Z0-9]+', '-', 'g')));
  if v_basis = '' then v_basis := 'klant'; end if;
  v_slug := v_basis;
  while exists (select 1 from workflow.previews where slug = v_slug) loop
    v_i := v_i + 1; v_slug := v_basis || '-' || v_i;
  end loop;

  insert into workflow.previews (
    slug, company_name, contactpersoon, lead_email, factuur_email,
    pakket_type, websiteprijs, maandbedrag, betaalwijze, pipeline_status,
    gepubliceerd, klant_kandidaat, company_id, internal_notes, content
  ) values (
    v_slug, c.name, c.contact_naam, c.email, c.email,
    'plugin', 0, 14.95, 'alleen_maandelijks', 'Klaar',
    false, false, c.id, 'Aangemaakt via de app-proef.',
    jsonb_build_object('bedrijf', jsonb_build_object(
      'naam', c.name, 'email', c.email,
      'website', (coalesce(c.allowed_domains, '{}'::text[]))[1]))
  );
  return v_slug;
end $$;
revoke all on function workflow.app_proef_rij(uuid) from public, anon, authenticated;

-- Afrekenen voorbereiden: register-rij + factuurgegevens -----------------------------
create or replace function public.sb_app_proef_afrekenen_voorbereiden(
  p_company_id uuid, p_factuur_email text, p_contact text default null,
  p_kvk text default null, p_btw text default null
) returns json language plpgsql security definer set search_path = '' as $$
declare v_slug text; v_toegang text; v_einde timestamptz;
begin
  select toegang, proef_eindigt_op into v_toegang, v_einde from public.companies where id = p_company_id;
  if not found then return json_build_object('ok', false, 'fout', 'onbekend'); end if;
  if v_toegang in ('pro', 'website') then return json_build_object('ok', false, 'fout', 'al_actief'); end if;

  v_slug := workflow.app_proef_rij(p_company_id);

  update workflow.previews p set
    factuur_email  = coalesce(nullif(trim(coalesce(p_factuur_email, '')), ''), p.factuur_email),
    contactpersoon = coalesce(nullif(trim(coalesce(p_contact, '')), ''), p.contactpersoon),
    pakket_type    = 'plugin',
    maandbedrag    = 14.95,
    websiteprijs   = case when p.klantnummer is null then 0 else p.websiteprijs end,
    betaalwijze    = 'alleen_maandelijks',
    content = jsonb_set(coalesce(p.content, '{}'::jsonb), '{bedrijf}',
      coalesce(p.content -> 'bedrijf', '{}'::jsonb)
      || jsonb_strip_nulls(jsonb_build_object(
           'kvk', nullif(trim(coalesce(p_kvk, '')), ''),
           'btw', nullif(trim(coalesce(p_btw, '')), ''))), true),
    updated_at = now()
  where p.slug = v_slug;

  return json_build_object('ok', true, 'slug', v_slug, 'proef_eindigt_op', v_einde);
end $$;

-- Toegang zetten (webhook / cron) ----------------------------------------------------
create or replace function public.sb_app_toegang_zet(
  p_company_id uuid, p_toegang text, p_betaald_tot date default null
) returns json language sql security definer set search_path = '' as $$
  update public.companies
     set toegang = p_toegang,
         betaald_tot = coalesce(p_betaald_tot, betaald_tot)
   where id = p_company_id
  returning json_build_object('ok', true, 'toegang', toegang, 'betaald_tot', betaald_tot);
$$;

-- "Naar opvolging": bewust in Toekomstig zetten, met verkoper ------------------------
create or replace function public.sb_app_proef_naar_opvolging(p_company_id uuid, p_verkoper text default null)
returns json language plpgsql security definer set search_path = '' as $$
declare v_slug text;
begin
  v_slug := workflow.app_proef_rij(p_company_id);
  update workflow.previews
     set klant_kandidaat = true,
         verzamelaar = coalesce(nullif(trim(coalesce(p_verkoper, '')), ''), verzamelaar),
         updated_at = now()
   where slug = v_slug and klantnummer is null;
  return json_build_object('ok', true, 'slug', v_slug);
end $$;

-- Dagelijkse controle -----------------------------------------------------------------
-- 1. Verlopen proeven op 'verlopen' zetten.
-- 2. Lijst teruggeven van wie een herinnering (dag 5) of afloopmail (dag 7) nodig heeft.
create or replace function public.sb_app_proef_dagelijks()
returns json language plpgsql security definer set search_path = '' as $$
declare v_verlopen int;
begin
  update public.companies set toegang = 'verlopen'
   where toegang = 'proef' and proef_eindigt_op < now();
  get diagnostics v_verlopen = row_count;

  return json_build_object(
    'verlopen', v_verlopen,
    'mails', coalesce((
      select json_agg(json_build_object(
               'company_id', c.id, 'naam', c.name, 'contact', c.contact_naam,
               'email', c.email, 'proef_eindigt_op', c.proef_eindigt_op,
               'soort', case when c.toegang = 'verlopen' then 'dag7' else 'dag5' end))
        from public.companies c
       where not c.is_demo and c.email is not null
         and (
           (c.toegang = 'proef' and c.proef_eindigt_op <= now() + interval '2 days'
             and not exists (select 1 from workflow.app_proef_mail m where m.company_id = c.id and m.soort = 'dag5'))
           or
           (c.toegang = 'verlopen' and c.proef_eindigt_op > now() - interval '3 days'
             and not exists (select 1 from workflow.app_proef_mail m where m.company_id = c.id and m.soort = 'dag7'))
         )
    ), '[]'::json)
  );
end $$;

create or replace function public.sb_app_proef_mail_gestuurd(p_company_id uuid, p_soort text)
returns boolean language sql security definer set search_path = '' as $$
  insert into workflow.app_proef_mail (company_id, soort) values (p_company_id, p_soort)
  on conflict do nothing
  returning true;
$$;

-- Rechten: alleen de server ------------------------------------------------------------
do $$ declare f text; begin
  foreach f in array array[
    'sb_app_proef_instelling()', 'sb_app_proef_schakelaar(boolean,text)',
    'sb_app_proef_start(text,text,text,text,integer)', 'sb_app_proef_lijst()',
    'sb_app_proef_afrekenen_voorbereiden(uuid,text,text,text,text)',
    'sb_app_toegang_zet(uuid,text,date)', 'sb_app_proef_naar_opvolging(uuid,text)',
    'sb_app_proef_dagelijks()', 'sb_app_proef_mail_gestuurd(uuid,text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;
