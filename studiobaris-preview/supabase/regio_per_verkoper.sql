-- Regio per verkoper (23 okt 2026)
--
-- Benne benadert Noord-Holland, Kevin Zuid-Holland. Een verkoper met een regio
-- ziet op Leads alleen de leads uit die provincie en op Mijn previews alle
-- previews uit die provincie (ook die van Gerrit/Levi), plus altijd zijn eigen.
-- Beheer (Gerrit, Levi) ziet altijd alles. Een verkoper zonder regio werkt
-- zoals voorheen (alleen eigen previews, alle leads).
--
-- De provincie van een preview wordt automatisch bepaald, in deze volgorde:
--   1. de gekoppelde lead (leads.provincie)
--   2. de postcode in het adres
--   3. een bekende plaatsnaam / provincienaam in adres of regio
-- Beheer kan hem op de klantkaart met de hand zetten; dan blijft hij staan.

-- 1. Regio op het account
alter table public.app_users add column if not exists regio text;
update public.app_users set regio = 'Noord-Holland' where naam = 'Benne';
update public.app_users set regio = 'Zuid-Holland'  where naam = 'Kevin';

-- 2. Provincie op de preview
alter table workflow.previews
  add column if not exists provincie text,
  add column if not exists provincie_handmatig boolean not null default false;

-- 3. Plaatsnamen die we herkennen als er geen postcode is (uit te breiden)
create table if not exists workflow.plaats_provincie (
  plaats text primary key,
  provincie text not null
);
alter table workflow.plaats_provincie enable row level security;

insert into workflow.plaats_provincie (plaats, provincie) values
 -- Noord-Holland
 ('amsterdam','Noord-Holland'),('amstelveen','Noord-Holland'),('haarlem','Noord-Holland'),('zaandam','Noord-Holland'),
 ('zaanstad','Noord-Holland'),('alkmaar','Noord-Holland'),('hoorn','Noord-Holland'),('purmerend','Noord-Holland'),
 ('hilversum','Noord-Holland'),('heemskerk','Noord-Holland'),('beverwijk','Noord-Holland'),('velsen','Noord-Holland'),
 ('ijmuiden','Noord-Holland'),('den helder','Noord-Holland'),('enkhuizen','Noord-Holland'),('hoofddorp','Noord-Holland'),
 ('haarlemmermeer','Noord-Holland'),('nieuw-vennep','Noord-Holland'),('badhoevedorp','Noord-Holland'),('uithoorn','Noord-Holland'),
 ('aalsmeer','Noord-Holland'),('diemen','Noord-Holland'),('weesp','Noord-Holland'),('bussum','Noord-Holland'),
 ('naarden','Noord-Holland'),('huizen','Noord-Holland'),('laren','Noord-Holland'),('blaricum','Noord-Holland'),
 ('heemstede','Noord-Holland'),('bloemendaal','Noord-Holland'),('zandvoort','Noord-Holland'),('castricum','Noord-Holland'),
 ('heerhugowaard','Noord-Holland'),('dijk en waard','Noord-Holland'),('schagen','Noord-Holland'),('medemblik','Noord-Holland'),
 ('volendam','Noord-Holland'),('edam','Noord-Holland'),('monnickendam','Noord-Holland'),('wormerveer','Noord-Holland'),
 ('krommenie','Noord-Holland'),('landsmeer','Noord-Holland'),('heiloo','Noord-Holland'),('uitgeest','Noord-Holland'),
 ('zwanenburg','Noord-Holland'),('bergen','Noord-Holland'),('texel','Noord-Holland'),('wormer','Noord-Holland'),
 -- Zuid-Holland
 ('rotterdam','Zuid-Holland'),('den haag','Zuid-Holland'),('''s-gravenhage','Zuid-Holland'),('leiden','Zuid-Holland'),
 ('katwijk','Zuid-Holland'),('rijnsburg','Zuid-Holland'),('valkenburg','Zuid-Holland'),('noordwijk','Zuid-Holland'),
 ('noordwijkerhout','Zuid-Holland'),('oegstgeest','Zuid-Holland'),('leiderdorp','Zuid-Holland'),('voorschoten','Zuid-Holland'),
 ('wassenaar','Zuid-Holland'),('lisse','Zuid-Holland'),('hillegom','Zuid-Holland'),('sassenheim','Zuid-Holland'),
 ('teylingen','Zuid-Holland'),('voorhout','Zuid-Holland'),('warmond','Zuid-Holland'),('zoeterwoude','Zuid-Holland'),
 ('alphen aan den rijn','Zuid-Holland'),('ter aar','Zuid-Holland'),('nieuwkoop','Zuid-Holland'),('kaag','Zuid-Holland'),
 ('delft','Zuid-Holland'),('zoetermeer','Zuid-Holland'),('gouda','Zuid-Holland'),('dordrecht','Zuid-Holland'),
 ('schiedam','Zuid-Holland'),('vlaardingen','Zuid-Holland'),('maassluis','Zuid-Holland'),('capelle aan den ijssel','Zuid-Holland'),
 ('spijkenisse','Zuid-Holland'),('rijswijk','Zuid-Holland'),('leidschendam','Zuid-Holland'),('voorburg','Zuid-Holland'),
 ('pijnacker','Zuid-Holland'),('nootdorp','Zuid-Holland'),('westland','Zuid-Holland'),('naaldwijk','Zuid-Holland'),
 ('monster','Zuid-Holland'),('''s-gravenzande','Zuid-Holland'),('wateringen','Zuid-Holland'),('barendrecht','Zuid-Holland'),
 ('ridderkerk','Zuid-Holland'),('zwijndrecht','Zuid-Holland'),('papendrecht','Zuid-Holland'),('sliedrecht','Zuid-Holland'),
 ('gorinchem','Zuid-Holland'),('hellevoetsluis','Zuid-Holland'),('brielle','Zuid-Holland'),('oostvoorne','Zuid-Holland'),
 ('rozenburg','Zuid-Holland'),('krimpen aan den ijssel','Zuid-Holland'),('lansingerland','Zuid-Holland'),('bergschenhoek','Zuid-Holland'),
 ('berkel en rodenrijs','Zuid-Holland'),('bleiswijk','Zuid-Holland'),('waddinxveen','Zuid-Holland'),('boskoop','Zuid-Holland'),
 ('bodegraven','Zuid-Holland'),('reeuwijk','Zuid-Holland'),('hendrik-ido-ambacht','Zuid-Holland'),('alblasserdam','Zuid-Holland'),
 ('nieuwerkerk aan den ijssel','Zuid-Holland'),('zuidplas','Zuid-Holland'),('hoeksche waard','Zuid-Holland'),('oud-beijerland','Zuid-Holland'),
 ('middelharnis','Zuid-Holland'),('goeree-overflakkee','Zuid-Holland'),('duin- en bollenstreek','Zuid-Holland'),('bollenstreek','Zuid-Holland'),
 -- Grote plaatsen elders
 ('utrecht','Utrecht'),('amersfoort','Utrecht'),('zeist','Utrecht'),('nieuwegein','Utrecht'),('veenendaal','Utrecht'),
 ('arnhem','Gelderland'),('nijmegen','Gelderland'),('apeldoorn','Gelderland'),('ede','Gelderland'),
 ('eindhoven','Noord-Brabant'),('tilburg','Noord-Brabant'),('breda','Noord-Brabant'),('''s-hertogenbosch','Noord-Brabant'),('den bosch','Noord-Brabant'),
 ('zwolle','Overijssel'),('enschede','Overijssel'),('deventer','Overijssel'),
 ('groningen','Groningen'),('leeuwarden','Friesland'),('sneek','Friesland'),('assen','Drenthe'),('emmen','Drenthe'),
 ('almere','Flevoland'),('lelystad','Flevoland'),('maastricht','Limburg'),('venlo','Limburg'),
 ('middelburg','Zeeland'),('vlissingen','Zeeland')
on conflict (plaats) do nothing;

-- 4. Provincie uit een 4-cijferige postcode (grove, maar voor NH/ZH nauwkeurige indeling)
create or replace function workflow.sb_provincie_uit_postcode(p_pc int)
returns text language sql immutable set search_path = '' as $$
  select case
    when p_pc is null then null
    when p_pc between 1000 and 1299 then 'Noord-Holland'
    when p_pc between 1300 and 1379 then 'Flevoland'
    when p_pc between 1380 and 1389 then 'Noord-Holland'
    when p_pc between 1390 and 1393 then 'Utrecht'
    when p_pc between 1394 and 1395 then 'Noord-Holland'
    when p_pc = 1396 then 'Utrecht'
    when p_pc between 1397 and 2159 then 'Noord-Holland'
    when p_pc between 2160 and 3399 then 'Zuid-Holland'
    when p_pc between 3400 and 3769 then 'Utrecht'
    when p_pc between 3770 and 3794 then 'Gelderland'
    when p_pc between 3795 and 3999 then 'Utrecht'
    when p_pc between 4000 and 4119 then 'Gelderland'
    when p_pc between 4120 and 4199 then 'Utrecht'
    when p_pc between 4200 and 4209 then 'Zuid-Holland'
    when p_pc between 4210 and 4219 then 'Gelderland'
    when p_pc between 4220 and 4229 then 'Zuid-Holland'
    when p_pc between 4230 and 4249 then 'Utrecht'
    when p_pc between 4250 and 4299 then 'Noord-Brabant'
    when p_pc between 4300 and 4599 then 'Zeeland'
    when p_pc between 4600 and 5799 then 'Noord-Brabant'
    when p_pc between 5800 and 6499 then 'Limburg'
    when p_pc between 6500 and 7399 then 'Gelderland'
    when p_pc between 7400 and 7799 then 'Overijssel'
    when p_pc between 7800 and 7999 then 'Drenthe'
    when p_pc between 8000 and 8199 then 'Overijssel'
    when p_pc between 8200 and 8399 then 'Flevoland'
    when p_pc between 8400 and 9299 then 'Friesland'
    when p_pc between 9300 and 9499 then 'Drenthe'
    when p_pc between 9500 and 9999 then 'Groningen'
  end;
$$;

-- 5. Provincie bepalen voor één preview
create or replace function workflow.sb_preview_provincie(p_slug text, p_content jsonb)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_adres text := coalesce(p_content #>> '{bedrijf,adres}', '');
  v_regio text := coalesce(p_content #>> '{bedrijf,regio}', '');
  v_tekst text;
  v_prov  text;
begin
  -- 1. gekoppelde lead
  select l.provincie into v_prov from public.leads l
   where l.preview_slug = p_slug and nullif(l.provincie, '') is not null
   order by l.updated_at desc nulls last limit 1;
  if v_prov is not null then return v_prov; end if;

  -- 2. postcode in het adres
  v_prov := workflow.sb_provincie_uit_postcode(
    substring(v_adres from '(?:^|\D)([1-9][0-9]{3})\s?[A-Za-z]{2}(?:\s|,|$)')::int);
  if v_prov is not null then return v_prov; end if;

  -- 3. provincienaam of bekende plaats in adres/regio
  v_tekst := lower(v_adres || ' ' || v_regio);
  if v_tekst ~ '(zuid[- ]holland|\mzh\M)' then return 'Zuid-Holland'; end if;
  if v_tekst ~ '(noord[- ]holland|\mnh\M)' then return 'Noord-Holland'; end if;
  select pp.provincie into v_prov from workflow.plaats_provincie pp
   where v_tekst ~ ('(^|[^a-z])' || regexp_replace(pp.plaats, '([^a-z0-9 ])', '\\\1', 'g') || '($|[^a-z])')
   order by position(pp.plaats in v_tekst), length(pp.plaats) desc
   limit 1;
  return v_prov;
end $$;

-- 6. Automatisch bijhouden
create or replace function workflow.sb_preview_provincie_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not coalesce(new.provincie_handmatig, false) then
    new.provincie := coalesce(workflow.sb_preview_provincie(new.slug, new.content), new.provincie);
  end if;
  return new;
end $$;

drop trigger if exists previews_provincie on workflow.previews;
create trigger previews_provincie
  before insert or update of content, slug on workflow.previews
  for each row execute function workflow.sb_preview_provincie_trigger();

-- Lead wordt pas na het maken van de preview gekoppeld: dan alsnog bijwerken.
create or replace function workflow.sb_lead_koppel_provincie_trigger()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.preview_slug is not null and nullif(new.provincie, '') is not null then
    update workflow.previews w set provincie = new.provincie
     where w.slug = new.preview_slug and not w.provincie_handmatig
       and w.provincie is distinct from new.provincie;
  end if;
  return new;
end $$;

drop trigger if exists leads_preview_provincie on public.leads;
create trigger leads_preview_provincie
  after insert or update of preview_slug, provincie on public.leads
  for each row execute function workflow.sb_lead_koppel_provincie_trigger();

-- Bestaande previews één keer invullen
update workflow.previews w
   set provincie = workflow.sb_preview_provincie(w.slug, w.content)
 where not w.provincie_handmatig;

-- 7. Handmatig zetten (beheer) — leeg = weer automatisch
create or replace function public.sb_preview_provincie_zet(p_slug text, p_provincie text)
returns json language plpgsql security definer set search_path = '' as $$
begin
  if nullif(btrim(coalesce(p_provincie, '')), '') is null then
    update workflow.previews
       set provincie_handmatig = false,
           provincie = workflow.sb_preview_provincie(slug, content)
     where slug = p_slug;
  else
    update workflow.previews
       set provincie_handmatig = true, provincie = btrim(p_provincie)
     where slug = p_slug;
  end if;
  return json_build_object('ok', found,
    'provincie', (select provincie from workflow.previews where slug = p_slug));
end $$;

-- 8. Facetten voor de leadlijst, beperkt tot één provincie (voor verkopers met een regio)
create or replace function public.sb_lead_facetten_v3(p_naam text, p_lijst text default null, p_provincie text default null)
returns json language sql stable security definer set search_path = 'public' as $$
  with zichtbaar as (
    select l.*, public.sb_lead_alleen_socials(l) as alleen_socials
    from public.leads l
    where (case coalesce(p_lijst,'')
             when '' then true
             when 'oud' then l.lijst is null
             else l.lijst = p_lijst end)
      and (p_lijst = 'actueel'
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
$$;

-- 9. Provincie mee in de overzichten
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
           w.provincie,
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

-- Rechten: alleen de server (service_role)
revoke all on function workflow.sb_provincie_uit_postcode(int) from public, anon, authenticated;
revoke all on function workflow.sb_preview_provincie(text, jsonb) from public, anon, authenticated;
revoke all on function workflow.sb_preview_provincie_trigger() from public, anon, authenticated;
revoke all on function workflow.sb_lead_koppel_provincie_trigger() from public, anon, authenticated;
revoke all on function public.sb_preview_provincie_zet(text, text) from public, anon, authenticated;
revoke all on function public.sb_lead_facetten_v3(text, text, text) from public, anon, authenticated;
revoke all on function public.sb_benaderd_lijst() from public, anon, authenticated;
grant execute on function public.sb_preview_provincie_zet(text, text) to service_role;
grant execute on function public.sb_lead_facetten_v3(text, text, text) to service_role;
grant execute on function public.sb_benaderd_lijst() to service_role;

-- get_overview: provincie erbij (rest ongewijzigd)
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
