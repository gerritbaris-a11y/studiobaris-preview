-- Proefperiode in het dashboard (okt 2026): startknop, verlengen, meldingen.

-- Wanneer plaatste de prospect zijn laatste proefproject (voor de melding).
alter table workflow.proef add column if not exists laatst_geplaatst_op timestamptz;

create or replace function public.trg_proef_teller()
returns trigger language plpgsql security definer set search_path = 'public' as $$
declare s text; n int;
begin
  if current_setting('sb.demo_reset', true) = '1' then return new; end if;
  select demo_van_slug into s from public.companies
  where id = new.company_id and is_demo and demo_van_slug is not null;
  if s is null then return new; end if;
  if not workflow.proef_geldt(s) then return new; end if;
  update workflow.proef set geplaatst = geplaatst + 1, laatst_geplaatst_op = now() where slug = s
  returning geplaatst into n;
  if n is not null and n >= 3 then
    update public.companies set daily_project_limit = 0 where id = new.company_id;
  end if;
  return new;
end $$;

-- Overzicht voor het dashboard: alleen previews waarvoor de proef geldt.
create or replace function public.sb_proef_overzicht()
returns json language sql stable security definer set search_path = 'public', 'workflow' as $$
  select coalesce(json_agg(x), '[]'::json) from (
    select w.slug, w.company_name as bedrijf,
           coalesce(w.verkoper, w.verzamelaar) as verkoper,
           w.lead_phone as telefoon,
           (c.id is not null) as heeft_demo,
           (coalesce(w.betaal_status,'') = 'actief' or coalesce(w.klant_kandidaat,false)
             or w.akkoord_voorwaarden_op is not null) as is_klant,
           (coalesce(w.pipeline_status,'') = 'Afgewezen') as afgewezen,
           p.gestart_op, p.tot, p.gestart_via, coalesce(p.geplaatst,0) as geplaatst,
           p.laatst_geplaatst_op, coalesce(p.verlengd,0) as verlengd
    from workflow.previews w
    left join public.companies c on c.demo_van_slug = w.slug and c.is_demo
    left join workflow.proef p on p.slug = w.slug
    where workflow.proef_geldt(w.slug)
  ) x;
$$;

revoke all on function public.sb_proef_overzicht() from public, anon, authenticated;
grant execute on function public.sb_proef_overzicht() to service_role;
