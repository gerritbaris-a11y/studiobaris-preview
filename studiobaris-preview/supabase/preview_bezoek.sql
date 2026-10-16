-- Preview bekeken (okt 2026): eerste en laatste bezoek en het aantal bezoeken
-- per preview. Een herladen of terugkeren binnen 30 minuten telt niet als
-- nieuw bezoek. Teambezoeken en bots filtert de previewpagina er al uit.
create table if not exists workflow.preview_bezoek (
  slug       text primary key,
  eerste_op  timestamptz not null default now(),
  laatste_op timestamptz not null default now(),
  aantal     int not null default 1
);
alter table workflow.preview_bezoek enable row level security;

create or replace function public.sb_preview_bezocht(p_slug text)
returns void language sql security definer set search_path = '' as $$
  insert into workflow.preview_bezoek (slug) values (p_slug)
  on conflict (slug) do update set
    aantal     = workflow.preview_bezoek.aantal
                 + case when workflow.preview_bezoek.laatste_op < now() - interval '30 minutes' then 1 else 0 end,
    laatste_op = now();
$$;
revoke all on function public.sb_preview_bezocht(text) from public, anon, authenticated;
grant execute on function public.sb_preview_bezocht(text) to service_role;

-- Overzicht voor het dashboard: nu met de bezoeken erbij.
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
           p.laatst_geplaatst_op, coalesce(p.verlengd,0) as verlengd,
           v.eerste_op as bekeken_eerst, v.laatste_op as bekeken_laatst, coalesce(v.aantal,0) as bekeken_aantal
    from workflow.previews w
    left join public.companies c on c.demo_van_slug = w.slug and c.is_demo
    left join workflow.proef p on p.slug = w.slug
    left join workflow.preview_bezoek v on v.slug = w.slug
    where workflow.proef_geldt(w.slug)
  ) x;
$$;
revoke all on function public.sb_proef_overzicht() from public, anon, authenticated;
grant execute on function public.sb_proef_overzicht() to service_role;
