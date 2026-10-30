-- Laatste controle (ronde 3) en overdrachtsdocument (okt 2026).
-- Toegepast als migratie site_feedback_eindcontrole_en_overdracht.

alter table workflow.site_feedback drop constraint if exists site_feedback_ronde_check;
alter table workflow.site_feedback add constraint site_feedback_ronde_check check (ronde in (1, 2, 3));
-- sb_site_feedback_nieuw accepteert sindsdien ronde 1, 2 of 3 (zie site_feedback.sql voor de rest).

create table if not exists workflow.overdracht (
  id           bigserial primary key,
  slug         text not null,
  site         text,
  naar         text,
  door         text,
  verstuurd_op timestamptz not null default now()
);
create index if not exists overdracht_slug_idx on workflow.overdracht (slug, verstuurd_op desc);
alter table workflow.overdracht enable row level security;
revoke all on workflow.overdracht from anon, authenticated;

create or replace function public.sb_overdracht_verstuurd(p_slug text, p_site text, p_naar text, p_door text)
returns json language sql security definer set search_path to '' as $$
  insert into workflow.overdracht (slug, site, naar, door)
  values (p_slug, left(coalesce(p_site,''),200), left(coalesce(p_naar,''),200), left(coalesce(p_door,''),60));
  select json_build_object('ok', true);
$$;

create or replace function public.sb_overdracht_overzicht()
returns json language sql stable security definer set search_path to '' as $$
  select coalesce(json_agg(x order by x.verstuurd_op desc), '[]'::json) from (
    select id, slug, site, naar, door, verstuurd_op from workflow.overdracht
  ) x;
$$;

revoke all on function public.sb_overdracht_verstuurd(text, text, text, text) from public, anon, authenticated;
revoke all on function public.sb_overdracht_overzicht() from public, anon, authenticated;
grant execute on function public.sb_overdracht_verstuurd(text, text, text, text) to service_role;
grant execute on function public.sb_overdracht_overzicht() to service_role;
