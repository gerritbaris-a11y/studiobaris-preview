-- Proefperiode start bij "Benaderd" (22 okt 2026).
-- Zet een verkoper het vinkje Benaderd aan, dan start de proefperiode van de
-- demo-app meteen (als hij nog niet liep). De knop "Start proefperiode" is weg.
--
-- Omdat de proef nu vaak al loopt vóórdat de prospect de app opent, kan
-- "App geopend" niet meer worden afgeleid uit gestart_via = 'app'. Daarom een
-- eigen kolom app_geopend_op: gezet bij de eerste keer dat de demo-link
-- geopend wordt, ook als de proef al liep.

alter table workflow.proef add column if not exists app_geopend_op timestamptz;

-- Bestaande proeven die door het openen van de app startten: dat moment telt.
update workflow.proef set app_geopend_op = gestart_op
 where gestart_via = 'app' and app_geopend_op is null;

-- Proef starten: zelfde als voorheen, plus app_geopend_op bij start via de app.
-- Een al bekend openingsmoment blijft staan.
create or replace function public.sb_proef_start(p_slug text, p_via text default 'knop')
returns json language plpgsql security definer set search_path to 'public' as $function$
declare ok boolean; r workflow.proef%rowtype;
begin
  ok := public.sb_demo_terugzetten(p_slug);
  if not ok then return json_build_object('ok', false, 'error', 'Geen demo-app gevonden voor deze preview.'); end if;

  update public.companies set daily_project_limit = 3
  where demo_van_slug = p_slug and is_demo;

  insert into workflow.proef as pr (slug, gestart_op, tot, gestart_via, geplaatst, verlengd, app_geopend_op)
  values (p_slug, now(), now() + interval '30 days', coalesce(p_via, 'knop'), 0, 0,
          case when p_via = 'app' then now() end)
  on conflict (slug) do update set
    gestart_op = excluded.gestart_op, tot = excluded.tot,
    gestart_via = excluded.gestart_via, geplaatst = 0, verlengd = 0,
    app_geopend_op = coalesce(pr.app_geopend_op, excluded.app_geopend_op)
  returning * into r;

  return json_build_object('ok', true, 'gestart_op', r.gestart_op, 'tot', r.tot);
end $function$;

-- Demo-link geopend: loopt de proef al, dan alleen het eerste openingsmoment
-- vastleggen (er wordt nog steeds niets gewist).
create or replace function public.sb_demo_reset_klant(p_van_slug text)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare cid uuid;
begin
  if not workflow.proef_geldt(p_van_slug) then
    return public.sb_demo_terugzetten(p_van_slug);           -- oude gedrag
  end if;

  select id into cid from public.companies where demo_van_slug = p_van_slug and is_demo;
  if cid is null then return false; end if;

  if exists (select 1 from workflow.proef where slug = p_van_slug) then
    update workflow.proef set app_geopend_op = now()
     where slug = p_van_slug and app_geopend_op is null;
    return true;                                             -- proef loopt: niets wissen
  end if;

  -- Eerste keer geopend: proef start automatisch.
  return coalesce((public.sb_proef_start(p_van_slug, 'app')->>'ok')::boolean, false);
end $function$;

-- Benaderd aan: ook de proef starten als die nog niet loopt (en er een demo-app is).
-- Lukt het starten niet, dan blijft het vinkje gewoon staan.
create or replace function public.sb_benaderd_zet(p_slug text, p_aan boolean, p_door text)
returns json language plpgsql security definer set search_path = '' as $$
declare r workflow.previews; proef_gestart boolean := false; s json;
begin
  if p_aan then
    update workflow.previews
       set benaderd_op = coalesce(benaderd_op, now()),
           benaderd_door = case when benaderd_op is null then p_door else benaderd_door end
     where slug = p_slug
     returning * into r;
  else
    update workflow.previews set benaderd_op = null, benaderd_door = null
     where slug = p_slug
     returning * into r;
  end if;
  if r.id is null then
    return json_build_object('ok', false, 'error', 'Preview niet gevonden.');
  end if;

  if p_aan
     and workflow.proef_geldt(p_slug)
     and not exists (select 1 from workflow.proef where slug = p_slug)
     and exists (select 1 from public.companies where demo_van_slug = p_slug and is_demo)
  then
    s := public.sb_proef_start(p_slug, 'benaderd');
    proef_gestart := coalesce((s->>'ok')::boolean, false);
  end if;

  return json_build_object('ok', true, 'benaderd_op', r.benaderd_op, 'benaderd_door', r.benaderd_door,
                           'proef_gestart', proef_gestart);
end $$;

revoke all on function public.sb_benaderd_zet(text, boolean, text) from public, anon, authenticated;
grant execute on function public.sb_benaderd_zet(text, boolean, text) to service_role;

-- Overzichten: app_geopend_op meegeven.
create or replace function public.sb_proef_overzicht()
returns json language sql stable security definer set search_path to 'public', 'workflow' as $function$
  select coalesce(json_agg(x), '[]'::json) from (
    select w.slug, w.company_name as bedrijf,
           coalesce(w.verkoper, w.verzamelaar) as verkoper,
           w.lead_phone as telefoon,
           (c.id is not null) as heeft_demo,
           (coalesce(w.betaal_status,'') = 'actief' or coalesce(w.klant_kandidaat,false)
             or w.akkoord_voorwaarden_op is not null) as is_klant,
           (coalesce(w.pipeline_status,'') = 'Afgewezen') as afgewezen,
           p.gestart_op, p.tot, p.gestart_via, coalesce(p.geplaatst,0) as geplaatst,
           p.laatst_geplaatst_op, coalesce(p.verlengd,0) as verlengd,
           v.eerste_op as bekeken_eerst, v.laatste_op as bekeken_laatst, coalesce(v.aantal,0) as bekeken_aantal,
           p.app_geopend_op
    from workflow.previews w
    left join public.companies c on c.demo_van_slug = w.slug and c.is_demo
    left join workflow.proef p on p.slug = w.slug
    left join workflow.preview_bezoek v on v.slug = w.slug
    where workflow.proef_geldt(w.slug)
  ) x;
$function$;

create or replace function public.sb_benaderd_lijst()
returns json language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(x order by x.benaderd_op desc), '[]'::json) from (
    select w.slug,
           coalesce(nullif(w.company_name, ''), w.slug) as bedrijf,
           nullif(trim(w.content #>> '{bedrijf,branche}'), '') as branche,
           coalesce(
             nullif(trim(substring(w.content #>> '{bedrijf,adres}' from '[0-9]{4}\s?[A-Za-z]{2}\s+(.+)$')), ''),
             nullif(trim(split_part(w.content #>> '{bedrijf,regio}', ',', 1)), '')
           ) as plaats,
           w.lead_phone as telefoon,
           w.verzamelaar,
           case when pg_input_is_valid(w.internal_notes, 'jsonb')
                then (w.internal_notes::jsonb ->> 'bron') end as bron,
           w.pipeline_status as fase,
           w.benaderd_op, w.benaderd_door,
           coalesce(v.aantal, 0) as bekeken_aantal, v.laatste_op as bekeken_laatst,
           (p.app_geopend_op is not null) as app_geopend,
           p.app_geopend_op,
           coalesce(p.geplaatst, 0) as geplaatst, p.laatst_geplaatst_op
    from workflow.previews w
    left join workflow.preview_bezoek v on v.slug = w.slug
    left join workflow.proef p on p.slug = w.slug
    where w.benaderd_op is not null
  ) x;
$$;
