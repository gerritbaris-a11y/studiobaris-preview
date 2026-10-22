-- Financieel overzicht per verkoper (22 okt 2026), pagina /verdiensten.
-- Per klant dezelfde rekenregels als public.sb_omzet_overzicht (Team & omzet),
-- zodat de totalen op beide pagina's gelijk zijn:
--   commissie   = 50% van de websiteprijs (model 100eur: €100 per klant)
--   uitbetaald  = 25% zodra betaal_status 'akkoord' of 'actief' is,
--                 + 25% zodra de fase 'Klaar' is   (model 100eur: €100 bij akkoord/actief)
--   nog te verdienen = commissie - uitbetaald
-- Alleen previews met een verzamelaar en een websiteprijs tellen mee.
-- p_naam null = iedereen (beheer).

create or replace function public.sb_verkoper_financieel(p_naam text)
returns json language sql stable security definer set search_path = '' as $$
  select coalesce(json_agg(x order by x.verkoper, x.bedrijf), '[]'::json) from (
    select p.slug,
           coalesce(nullif(p.company_name, ''), p.slug) as bedrijf,
           p.verzamelaar as verkoper,
           coalesce(u.vergoeding_model, '50pct') as model,
           p.pipeline_status as fase,
           p.betaal_status,
           p.websiteprijs as verkoopbedrag,
           round(case when coalesce(u.vergoeding_model, '50pct') = '100eur' then 100::numeric
                      else p.websiteprijs * 0.5 end, 2) as commissie,
           round(case when coalesce(u.vergoeding_model, '50pct') = '100eur'
                      then case when p.betaal_status in ('akkoord','actief') then 100::numeric else 0 end
                      else (case when p.betaal_status in ('akkoord','actief') then p.websiteprijs * 0.25 else 0 end)
                         + (case when p.pipeline_status = 'Klaar' then p.websiteprijs * 0.25 else 0 end)
                 end, 2) as uitbetaald
    from workflow.previews p
    left join public.app_users u on u.naam = p.verzamelaar
    where p.verzamelaar is not null and p.websiteprijs is not null
      and (p_naam is null or p.verzamelaar = p_naam)
  ) x;
$$;

revoke all on function public.sb_verkoper_financieel(text) from public, anon, authenticated;
grant execute on function public.sb_verkoper_financieel(text) to service_role;
