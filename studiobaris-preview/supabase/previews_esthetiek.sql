-- Previews test · esthetiek (30 okt 2026)
-- Aparte leadlijst voor kappers, nagelsalons en beautysalons (leads.lijst =
-- 'esthetiek'), gevuld vanuit een eigen Google Sheet, op dezelfde manier als de
-- vakmannenlijst ('actueel'). Alleen zichtbaar voor beheer (tabblad /esthetiek).

-- 1. Zoeken en filters: "alleen social media"-leads ook tonen in de
--    esthetieklijst (net als in de actuele vakmannenlijst). Verder ongewijzigd.
create or replace function public.sb_leads_zoek_v2(p_naam text, p_tab text DEFAULT 'werk'::text, p_zoek text DEFAULT NULL::text, p_provincie text DEFAULT NULL::text, p_vakgebied text DEFAULT NULL::text, p_potentie text DEFAULT NULL::text, p_wie text DEFAULT 'alles'::text, p_limiet integer DEFAULT 30, p_reden text DEFAULT NULL::text, p_lijst text DEFAULT NULL::text, p_site text DEFAULT NULL::text)
 returns json
 language sql
 security definer
 set search_path to 'public'
as $function$
  with zichtbaar as (
    select l.*, public.sb_lead_alleen_socials(l) as alleen_socials
    from public.leads l
    where (case coalesce(p_lijst,'')
             when '' then true
             when 'oud' then l.lijst is null
             else l.lijst = p_lijst end)
      and (p_lijst in ('actueel','esthetiek')
           or not public.sb_lead_alleen_socials(l)
           or p_naam = 'Gerrit'
           or l.owner = p_naam)
  ),
  gefilterd as (
    select * from zichtbaar z
    where (case
             when coalesce(p_tab,'werk') = 'archief'  then coalesce(z.status,'nieuw') = 'archief'
             when coalesce(p_tab,'werk') = 'afgerond' then coalesce(z.status,'nieuw') in ('klant','afgewezen')
             else coalesce(z.status,'nieuw') not in ('klant','afgewezen','archief')
           end)
      and (coalesce(p_provincie,'') = '' or z.provincie = p_provincie)
      and (coalesce(p_vakgebied,'') = '' or z.vakgebied = p_vakgebied)
      and (coalesce(p_potentie,'')  = '' or z.potentie  = p_potentie)
      and (coalesce(p_site,'')      = '' or z.website_status = p_site)
      and (coalesce(p_reden,'')     = '' or z.archief_reden = p_reden)
      and (case when p_wie = 'mij'  then z.owner = p_naam
                when p_wie = 'vrij' then coalesce(z.owner,'') = ''
                else true end)
      and (coalesce(p_zoek,'') = '' or
           z.bedrijfsnaam ilike '%' || p_zoek || '%' or
           coalesce(z.plaats,'')   ilike '%' || p_zoek || '%' or
           coalesce(z.email,'')    ilike '%' || p_zoek || '%' or
           coalesce(z.telefoon,'') ilike '%' || p_zoek || '%')
  )
  select json_build_object(
    'totaal', (select count(*) from gefilterd),
    'rijen',  coalesce((
      select json_agg(row_to_json(t))
      from (
        select * from gefilterd
        order by (provincie = 'Zuid-Holland') desc,
                 alleen_socials desc,
                 score desc nulls last,
                 (coalesce(telefoon,'') <> '') desc,
                 scan_datum desc nulls last,
                 bedrijfsnaam
        limit greatest(coalesce(p_limiet, 30), 1)
      ) t
    ), '[]'::json)
  );
$function$;

create or replace function public.sb_lead_facetten_v3(p_naam text, p_lijst text DEFAULT NULL::text, p_provincie text DEFAULT NULL::text)
 returns json
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with zichtbaar as (
    select l.*, public.sb_lead_alleen_socials(l) as alleen_socials
    from public.leads l
    where (case coalesce(p_lijst,'')
             when '' then true
             when 'oud' then l.lijst is null
             else l.lijst = p_lijst end)
      and (p_lijst in ('actueel','esthetiek')
           or not public.sb_lead_alleen_socials(l)
           or p_naam = 'Gerrit'
           or l.owner = p_naam)
      and (coalesce(p_provincie,'') = '' or l.provincie = p_provincie)
  )
  select json_build_object(
    'provincies',  coalesce((select json_agg(p order by p) from (select distinct provincie p from zichtbaar where provincie is not null) x), '[]'::json),
    'vakgebieden', coalesce((select json_agg(v order by v) from (select distinct vakgebied v from zichtbaar where vakgebied is not null) y), '[]'::json),
    'sites',       coalesce((
       select json_agg(row_to_json(s) order by s.aantal desc)
       from (select website_status as site, count(*) as aantal
             from zichtbaar where website_status is not null group by 1) s), '[]'::json),
    'redenen',     coalesce((
       select json_agg(row_to_json(r) order by r.aantal desc)
       from (select archief_reden as reden, count(*) as aantal
             from zichtbaar where coalesce(status,'nieuw') = 'archief' and archief_reden is not null
             group by 1) r), '[]'::json),
    'werk',     (select count(*) from zichtbaar where coalesce(status,'nieuw') not in ('klant','afgewezen','archief')),
    'afgerond', (select count(*) from zichtbaar where coalesce(status,'nieuw') in ('klant','afgewezen')),
    'archief',  (select count(*) from zichtbaar where coalesce(status,'nieuw') = 'archief'),
    'mijn',     (select count(*) from zichtbaar where owner = p_naam and coalesce(status,'nieuw') not in ('klant','afgewezen','archief')),
    'socials',  (select count(*) from zichtbaar where alleen_socials),
    'totaal',   (select count(*) from zichtbaar)
  );
$function$;

-- 2. Sync voor de esthetiek-Sheet. Kopie van sb_leads_sync, maar dan voor
--    lijst 'esthetiek'. Een bedrijf dat (toevallig) al in een andere lijst
--    staat, wordt niet overgenomen of gewijzigd.
create or replace function public.sb_leads_sync_esthetiek(p_rijen jsonb)
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_in        int := 0;
  v_voor      int;
  v_na        int;
  v_actief    int;
  v_terug     int := 0;
  v_archief   int := 0;
  v_veilig    boolean;
begin
  create temp table _sheet on commit drop as
  select distinct on (lower(btrim(r->>'bedrijfsnaam')))
    btrim(r->>'bedrijfsnaam')                                    as bedrijfsnaam,
    nullif(btrim(coalesce(r->>'vakgebied','')), '')              as vakgebied,
    nullif(btrim(coalesce(r->>'plaats','')), '')                 as plaats,
    nullif(btrim(coalesce(r->>'provincie','')), '')              as provincie,
    nullif(btrim(coalesce(r->>'telefoon','')), '')               as telefoon,
    nullif(upper(btrim(coalesce(r->>'website_status',''))), '')  as website_status,
    nullif(btrim(coalesce(r->>'gevonden_url','')), '')           as gevonden_url,
    nullif(btrim(coalesce(r->>'opmerking','')), '')              as reden,
    case when coalesce(r->>'scan_datum','') ~ '^\d{4}-\d{2}-\d{2}$'
         then (r->>'scan_datum')::date end                       as scan_datum,
    nullif(btrim(coalesce(r->>'bron','')), '')                   as bron_url,
    lower(btrim(r->>'bedrijfsnaam')) || '|'                      as sleutel
  from jsonb_array_elements(p_rijen) r
  where btrim(coalesce(r->>'bedrijfsnaam','')) <> ''
  order by lower(btrim(r->>'bedrijfsnaam'));

  select count(*) into v_in from _sheet;
  select count(*) into v_voor from public.leads where lijst = 'esthetiek';
  select count(*) into v_actief from public.leads
   where lijst = 'esthetiek' and coalesce(status,'nieuw') <> 'archief';

  -- Alleen archiveren als de Sheet er compleet uitziet (zelfde vangnet als
  -- bij de vakmannen, maar met een lagere ondergrens: deze lijst is nieuw).
  v_veilig := v_in >= 5 and v_in >= v_actief * 0.5;

  insert into public.leads as l (
    bedrijfsnaam, vakgebied, plaats, provincie, telefoon, website_status, gevonden_url,
    reden, scan_datum, bron_url, facebook, instagram, lijst, status, bron_sheet,
    created_at, updated_at
  )
  select s.bedrijfsnaam, s.vakgebied, s.plaats, s.provincie, s.telefoon, s.website_status,
         s.gevonden_url, s.reden, s.scan_datum, s.bron_url,
         case when s.website_status = 'ALLEEN SOCIAL' and s.gevonden_url ilike '%facebook.%'  then s.gevonden_url end,
         case when s.website_status = 'ALLEEN SOCIAL' and s.gevonden_url ilike '%instagram.%' then s.gevonden_url end,
         'esthetiek', 'nieuw', 'StudioBaris-Leads-ESTHETIEK', now(), now()
  from _sheet s
  on conflict (dedup_key) do update set
    vakgebied      = excluded.vakgebied,
    plaats         = excluded.plaats,
    provincie      = excluded.provincie,
    telefoon       = coalesce(excluded.telefoon, l.telefoon),
    website_status = excluded.website_status,
    gevonden_url   = excluded.gevonden_url,
    reden          = excluded.reden,
    scan_datum     = excluded.scan_datum,
    bron_url       = excluded.bron_url,
    facebook       = coalesce(excluded.facebook, l.facebook),
    instagram      = coalesce(excluded.instagram, l.instagram),
    bron_sheet     = excluded.bron_sheet,
    updated_at     = now()
  where l.lijst = 'esthetiek';

  update public.leads l set status = 'nieuw', archief_reden = null, gearchiveerd_op = null, updated_at = now()
  from _sheet s
  where l.dedup_key = s.sleutel and l.lijst = 'esthetiek'
    and l.status = 'archief' and l.archief_reden = 'Niet meer in de leadlijst';
  get diagnostics v_terug = row_count;

  if v_veilig then
    update public.leads l
       set status = 'archief', archief_reden = 'Niet meer in de leadlijst',
           gearchiveerd_op = now(), updated_at = now()
     where l.lijst = 'esthetiek'
       and coalesce(l.status,'nieuw') = 'nieuw'
       and coalesce(l.owner,'') = ''
       and not exists (select 1 from _sheet s where s.sleutel = l.dedup_key);
    get diagnostics v_archief = row_count;
  end if;

  select count(*) into v_na from public.leads where lijst = 'esthetiek';

  return json_build_object(
    'in_sheet', v_in,
    'nieuw', v_na - v_voor,
    'terug_uit_archief', v_terug,
    'gearchiveerd', v_archief,
    'archiveren_overgeslagen', not v_veilig,
    'totaal_actueel', v_na
  );
end $function$;

revoke all on function public.sb_leads_sync_esthetiek(jsonb) from public, anon, authenticated;
grant execute on function public.sb_leads_sync_esthetiek(jsonb) to service_role;

-- 3. get_overview: branche meegeven, zodat het dashboard esthetiek-previews
--    (kapper, nagelsalon, beautysalon …) kan herkennen. Verder ongewijzigd.
create or replace function public.get_overview()
 returns json
 language sql
 security definer
 set search_path to ''
as $function$
  select coalesce(json_agg(t order by t.updated_at desc), '[]'::json)
  from (
    select p.slug, p.company_name, p.status, p.version, p.gepubliceerd,
           p.lead_phone, p.lead_email, p.laatste_inzending_op, p.updated_at,
           (p.concept_content is not null) as heeft_concept, p.internal_notes,
           p.maandbedrag, p.betaal_status, p.verzamelaar, p.pipeline_status,
           p.websiteprijs, p.contactpersoon, p.persoonlijk, p.factuur_email,
           p.aanbetaling, p.rest_status, p.klantnummer, p.pakket_type,
           p.klant_kandidaat, p.oud_klant,
           p.betaalwijze, p.betaal_mandaat_id, p.betaal_abonnement_id,
           p.slottermijn_bedrag, p.slottermijn_aangekondigd_op,
           p.provincie, p.provincie_handmatig,
           coalesce(p.content->'merk'->>'stijl', 'stoer') as stijl,
           p.klant_stijl, p.klant_stijl_op,
           case when coalesce(p.websiteprijs, 0) > 0
                then p.websiteprijs - coalesce(p.aanbetaling, round(p.websiteprijs / 2.0, 2))
                end as restbedrag,
           exists (select 1 from public.companies c
                   where c.demo_van_slug = p.slug and c.is_demo) as heeft_demo,
           exists (select 1 from public.companies c
                   where c.demo_van_slug = p.slug and c.is_demo
                     and (exists (select 1 from public.projects pr where pr.company_id = c.id)
                       or exists (select 1 from public.reviews  rv where rv.company_id = c.id))
                  ) as demo_gevuld,
           p.content->'bedrijf'->>'slogan'   as b_slogan,
           p.content->'bedrijf'->>'telefoon' as b_telefoon,
           p.content->'bedrijf'->>'whatsapp' as b_whatsapp,
           p.content->'bedrijf'->>'email'    as b_email,
           p.content->'bedrijf'->>'adres'    as b_adres,
           p.content->'bedrijf'->>'kvk'      as b_kvk,
           p.content->'bedrijf'->>'btw'      as b_btw,
           p.content->'bedrijf'->>'branche'  as b_branche,
           s.antwoorden as laatste_feedback,
           s.type       as laatste_feedback_type,
           s.created_at as laatste_feedback_op
    from workflow.previews p
    left join lateral (
      select sub.antwoorden, sub.type, sub.created_at
      from workflow.submissions sub
      where sub.preview_id = p.id
      order by sub.created_at desc
      limit 1
    ) s on true
  ) t;
$function$;
