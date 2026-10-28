-- Feedbackrondes op de gebouwde WordPress-site (na akkoord).
-- De klant loopt via /ronde/<slug>?r=1|2 de site stap voor stap door
-- (Home, Diensten, Projecten, Over, Contact) en zegt per pagina
-- "goed" of "dit wil ik anders". Wij verwerken het met de hand.
-- Alleen via service_role (werkplek-backend); dicht voor anon/authenticated.

create table if not exists workflow.site_feedback (
  id            bigserial primary key,
  slug          text not null,
  ronde         int  not null check (ronde in (1, 2)),
  site          text,
  antwoorden    jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  verwerkt_op   timestamptz,
  verwerkt_door text
);
create index if not exists site_feedback_slug_idx on workflow.site_feedback (slug, aangemaakt_op desc);
alter table workflow.site_feedback enable row level security;
revoke all on workflow.site_feedback from anon, authenticated;

-- Nieuwe ronde opslaan. Alleen voor previews met akkoord/betaling,
-- en max 3 inzendingen per preview per uur.
create or replace function public.sb_site_feedback_nieuw(p_slug text, p_ronde int, p_site text, p_antwoorden jsonb)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare v_id bigint;
begin
  -- Klanten met akkoord/betaling, plus Gerrits testpreview 'test'.
  if not exists (select 1 from workflow.previews where slug = p_slug and (betaal_status in ('akkoord','actief') or p_slug = 'test')) then
    return json_build_object('ok', false, 'error', 'onbekend'); end if;
  if p_ronde not in (1, 2) then return json_build_object('ok', false, 'error', 'ronde'); end if;
  if (select count(*) from workflow.site_feedback where slug = p_slug and aangemaakt_op > now() - interval '1 hour') >= 3 then
    return json_build_object('ok', false, 'error', 'te_vaak'); end if;
  insert into workflow.site_feedback (slug, ronde, site, antwoorden)
  values (p_slug, p_ronde, left(coalesce(p_site, ''), 200), coalesce(p_antwoorden, '{}'::jsonb))
  returning id into v_id;
  return json_build_object('ok', true, 'id', v_id);
end $$;

-- Alle ingestuurde rondes, nieuwste eerst (voor Mijn previews).
create or replace function public.sb_site_feedback_overzicht()
returns json
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(json_agg(x order by x.aangemaakt_op desc), '[]'::json) from (
    select id, slug, ronde, site, antwoorden, aangemaakt_op, verwerkt_op, verwerkt_door
    from workflow.site_feedback
  ) x;
$$;

-- Ronde afvinken als verwerkt.
create or replace function public.sb_site_feedback_verwerkt(p_id bigint, p_door text)
returns json
language sql
security definer
set search_path to ''
as $$
  update workflow.site_feedback set verwerkt_op = now(), verwerkt_door = left(coalesce(p_door, ''), 60)
  where id = p_id and verwerkt_op is null;
  select json_build_object('ok', true);
$$;

revoke all on function public.sb_site_feedback_nieuw(text, int, text, jsonb) from public, anon, authenticated;
revoke all on function public.sb_site_feedback_overzicht() from public, anon, authenticated;
revoke all on function public.sb_site_feedback_verwerkt(bigint, text) from public, anon, authenticated;
grant execute on function public.sb_site_feedback_nieuw(text, int, text, jsonb) to service_role;
grant execute on function public.sb_site_feedback_overzicht() to service_role;
grant execute on function public.sb_site_feedback_verwerkt(bigint, text) to service_role;
