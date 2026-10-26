-- Stijl kiezen door de klant (okt 2026).
-- De klant kan op zijn preview zelf tussen de stijlen wisselen en op
-- "Deze stijl kies ik" tikken. Die keuze wordt de stijl van de preview
-- (merk.stijl) en we onthouden apart dát de klant koos en wanneer, zodat het
-- dashboard er een badge van kan maken. De klant mag daarna nog wisselen.
-- Twee nieuwe stijlen erbij: ambacht en strak.

alter table workflow.previews add column if not exists klant_stijl text;
alter table workflow.previews add column if not exists klant_stijl_op timestamptz;

-- Team kiest de stijl (dashboard): nu vijf stijlen.
create or replace function public.sb_set_stijl(p_slug text, p_stijl text)
returns void language sql security definer set search_path to 'workflow', 'public' as $$
  update workflow.previews
     set content = jsonb_set(coalesce(content, '{}'::jsonb), '{merk,stijl}', to_jsonb(p_stijl), true),
         updated_at = now()
   where slug = p_slug
     and p_stijl in ('stoer', 'modern', 'persoonlijk', 'ambacht', 'strak');
$$;

-- Klant kiest de stijl (vanaf zijn preview). Alleen via de server-route.
create or replace function public.sb_klant_kiest_stijl(p_slug text, p_stijl text)
returns boolean language plpgsql security definer set search_path to 'workflow', 'public' as $$
begin
  if p_stijl not in ('stoer', 'modern', 'persoonlijk', 'ambacht', 'strak') then
    return false;
  end if;
  update workflow.previews
     set content = jsonb_set(coalesce(content, '{}'::jsonb), '{merk,stijl}', to_jsonb(p_stijl), true),
         klant_stijl = p_stijl,
         klant_stijl_op = now(),
         updated_at = now()
   where slug = p_slug;
  return found;
end;
$$;
revoke all on function public.sb_klant_kiest_stijl(text, text) from public, anon, authenticated;
grant execute on function public.sb_klant_kiest_stijl(text, text) to service_role;

-- Overzicht voor Mijn previews: klant_stijl + klant_stijl_op erbij.
create or replace function public.get_overview()
returns json language sql security definer set search_path to '' as $function$
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
