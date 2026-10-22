-- Benaderd (22 okt 2026).
-- Verkoper zet per preview een vinkje "Benaderd" (met datum en naam). Alleen
-- die previews komen op de pagina /benaderd, met wat de prospect daarna deed:
-- preview bekeken, app geopend, project geplaatst (zelfde bronnen als
-- Mijn previews: workflow.preview_bezoek en workflow.proef).
-- Alleen toevoegingen: geen bestaande kolom of functie wordt gewijzigd.

alter table workflow.previews add column if not exists benaderd_op timestamptz;
alter table workflow.previews add column if not exists benaderd_door text;

-- Vinkje aan of uit. Aan: datum = nu, door = wie klikt (alleen als hij nog uit stond,
-- zodat de eerste benaderdatum blijft staan). Uit: beide leeg.
create or replace function public.sb_benaderd_zet(p_slug text, p_aan boolean, p_door text)
returns json language plpgsql security definer set search_path = '' as $$
declare r workflow.previews;
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
  return json_build_object('ok', true, 'benaderd_op', r.benaderd_op, 'benaderd_door', r.benaderd_door);
end $$;

revoke all on function public.sb_benaderd_zet(text, boolean, text) from public, anon, authenticated;
grant execute on function public.sb_benaderd_zet(text, boolean, text) to service_role;

-- Lijst van alle benaderde previews met activiteit. Welke rijen een verkoper
-- mag zien, filtert de werkplek (zelfde regel als Mijn previews:
-- verzamelaar of bron = zijn naam).
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
           (p.gestart_op is not null and p.gestart_via = 'app') as app_geopend,
           case when p.gestart_via = 'app' then p.gestart_op end as app_geopend_op,
           coalesce(p.geplaatst, 0) as geplaatst, p.laatst_geplaatst_op
    from workflow.previews w
    left join workflow.preview_bezoek v on v.slug = w.slug
    left join workflow.proef p on p.slug = w.slug
    where w.benaderd_op is not null
  ) x;
$$;

revoke all on function public.sb_benaderd_lijst() from public, anon, authenticated;
grant execute on function public.sb_benaderd_lijst() to service_role;
