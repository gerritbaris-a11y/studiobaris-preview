-- Bring a friend (20 nov 2026).
--
-- Een bestaande klant (de aanbrenger) brengt een nieuwe klant (de vriend) aan.
-- Zodra de eerste betaling van de vriend binnen is, krijgen ze ALLEBEI één
-- maand gratis. Brengt iemand meerdere vrienden aan, dan krijgt hij per vriend
-- een maand: de tegoeden worden één per maand verrekend, achter elkaar.
--
-- Hoe het geld loopt:
--   * Een gratis maand = een maandfactuur met een kortingsregel ter grootte van
--     het maandbedrag, totaal € 0,00. Die factuur gaat gewoon uit (het is ook
--     de SEPA-vooraankondiging) en staat meteen op 'betaald'.
--   * Voor die maand wordt bij Mollie de volgende incasso van het abonnement
--     een maand opgeschoven (de dagelijkse cron regelt dat). Het mandaat zelf
--     wordt nooit aangeraakt.
--
-- Alles hieronder is toevoegend: bestaande kolommen, facturen en functies
-- veranderen niet.

alter table workflow.previews
  add column if not exists aangebracht_door uuid references workflow.previews(id) on delete set null,
  add column if not exists bring_a_friend_toegekend_op timestamptz;

alter table workflow.previews drop constraint if exists previews_niet_zelf_aangebracht;
alter table workflow.previews add constraint previews_niet_zelf_aangebracht
  check (aangebracht_door is null or aangebracht_door <> id);

create table if not exists workflow.tegoeden (
  id                      uuid primary key default gen_random_uuid(),
  preview_id              uuid not null references workflow.previews(id) on delete cascade,
  reden                   text not null default 'bring_a_friend',
  gekoppeld_aan           uuid references workflow.previews(id) on delete set null,
  aantal_maanden          integer not null default 1 check (aantal_maanden > 0),
  status                  text not null default 'gepland'
                            check (status in ('gepland','verrekend','ingetrokken')),
  verrekend_op_factuur_id uuid references workflow.facturen(id),
  aangemaakt_op           timestamptz not null default now(),
  verrekend_op            timestamptz
);
alter table workflow.tegoeden enable row level security;

-- Per vriend precies één tegoed voor de vriend zelf en één voor de aanbrenger,
-- ook als de webhook twee keer afgaat.
create unique index if not exists tegoeden_baf_uniek
  on workflow.tegoeden(preview_id, gekoppeld_aan, reden)
  where reden = 'bring_a_friend';
create index if not exists tegoeden_gepland
  on workflow.tegoeden(preview_id, aangemaakt_op) where status = 'gepland';

-- ── Aanbrenger instellen of wissen ─────────────────────────────────────────
create or replace function public.sb_baf_instellen(p_slug text, p_aanbrenger_slug text)
returns json language plpgsql security definer set search_path to '' as $$
declare
  v_klant workflow.previews%rowtype;
  v_aan   workflow.previews%rowtype;
begin
  select * into v_klant from workflow.previews where slug = p_slug;
  if not found then raise exception 'klant niet gevonden'; end if;
  if v_klant.bring_a_friend_toegekend_op is not null then
    raise exception 'De beloning is al toegekend; de aanbrenger kan niet meer veranderen.';
  end if;

  if p_aanbrenger_slug is null or btrim(p_aanbrenger_slug) = '' then
    update workflow.previews set aangebracht_door = null where id = v_klant.id;
    return json_build_object('ok', true, 'aangebracht_door', null);
  end if;

  select * into v_aan from workflow.previews where slug = p_aanbrenger_slug;
  if not found then raise exception 'aanbrenger niet gevonden'; end if;
  if v_aan.id = v_klant.id then raise exception 'Een klant kan zichzelf niet aanbrengen.'; end if;
  if v_aan.aangebracht_door = v_klant.id then
    raise exception 'Deze twee klanten kunnen elkaar niet over en weer aanbrengen.';
  end if;

  update workflow.previews set aangebracht_door = v_aan.id where id = v_klant.id;
  return json_build_object('ok', true, 'aangebracht_door', v_aan.slug);
end; $$;

-- ── Beloning toekennen (na de eerste betaling van de vriend) ───────────────
-- Idempotent: tweede aanroep doet niets.
create or replace function public.sb_baf_toekennen(p_slug text)
returns json language plpgsql security definer set search_path to '' as $$
declare
  v_klant workflow.previews%rowtype;
begin
  select * into v_klant from workflow.previews where slug = p_slug for update;
  if not found then return json_build_object('ok', false, 'reden', 'klant niet gevonden'); end if;
  if v_klant.aangebracht_door is null then
    return json_build_object('ok', true, 'toegekend', false, 'reden', 'niet aangebracht');
  end if;
  if v_klant.bring_a_friend_toegekend_op is not null then
    return json_build_object('ok', true, 'toegekend', false, 'reden', 'al toegekend');
  end if;

  insert into workflow.tegoeden (preview_id, gekoppeld_aan, reden)
  values (v_klant.id, v_klant.aangebracht_door, 'bring_a_friend'),
         (v_klant.aangebracht_door, v_klant.id, 'bring_a_friend')
  on conflict do nothing;

  update workflow.previews set bring_a_friend_toegekend_op = now() where id = v_klant.id;
  return json_build_object('ok', true, 'toegekend', true);
end; $$;

-- ── Het eerstvolgende openstaande tegoed van een klant ─────────────────────
create or replace function public.sb_tegoed_volgende(p_slug text)
returns json language sql stable security definer set search_path to '' as $$
  select row_to_json(t) from (
    select tg.id, tg.reden, tg.aantal_maanden,
           coalesce(a.company_name, a.slug) as gekoppeld_aan_naam
    from workflow.tegoeden tg
    join workflow.previews p on p.id = tg.preview_id
    left join workflow.previews a on a.id = tg.gekoppeld_aan
    where p.slug = p_slug and tg.status = 'gepland'
    order by tg.aangemaakt_op, tg.id
    limit 1
  ) t;
$$;

create or replace function public.sb_tegoed_verrekenen(p_id uuid, p_factuur_nummer text)
returns json language plpgsql security definer set search_path to '' as $$
begin
  update workflow.tegoeden
     set status = 'verrekend', verrekend_op = now(),
         verrekend_op_factuur_id = (select id from workflow.facturen where nummer = p_factuur_nummer)
   where id = p_id and status = 'gepland';
  return json_build_object('ok', found);
end; $$;

create or replace function public.sb_tegoed_intrekken(p_id uuid)
returns json language plpgsql security definer set search_path to '' as $$
begin
  update workflow.tegoeden set status = 'ingetrokken' where id = p_id and status = 'gepland';
  return json_build_object('ok', found);
end; $$;

-- ── Overzicht per klant, voor het Beheren-paneel ───────────────────────────
create or replace function public.sb_baf_overzicht(p_slug text)
returns json language sql stable security definer set search_path to '' as $$
  select json_build_object(
    'aangebracht_door', (
      select json_build_object('slug', a.slug, 'naam', coalesce(a.company_name, a.slug))
      from workflow.previews a where a.id = p.aangebracht_door),
    'toegekend_op', p.bring_a_friend_toegekend_op,
    'vrienden', coalesce((
      select json_agg(json_build_object(
               'slug', v.slug, 'naam', coalesce(v.company_name, v.slug),
               'toegekend_op', v.bring_a_friend_toegekend_op) order by v.company_name)
      from workflow.previews v where v.aangebracht_door = p.id), '[]'::json),
    'tegoeden', coalesce((
      select json_agg(json_build_object(
               'id', tg.id, 'status', tg.status, 'aangemaakt_op', tg.aangemaakt_op,
               'verrekend_op', tg.verrekend_op,
               'factuur', f.nummer, 'periode', f.periode,
               'gekoppeld_aan_naam', coalesce(g.company_name, g.slug)) order by tg.aangemaakt_op)
      from workflow.tegoeden tg
      left join workflow.facturen f on f.id = tg.verrekend_op_factuur_id
      left join workflow.previews g on g.id = tg.gekoppeld_aan
      where tg.preview_id = p.id), '[]'::json)
  )
  from workflow.previews p where p.slug = p_slug;
$$;

revoke all on function public.sb_baf_instellen(text, text) from public, anon, authenticated;
revoke all on function public.sb_baf_toekennen(text) from public, anon, authenticated;
revoke all on function public.sb_tegoed_volgende(text) from public, anon, authenticated;
revoke all on function public.sb_tegoed_verrekenen(uuid, text) from public, anon, authenticated;
revoke all on function public.sb_tegoed_intrekken(uuid) from public, anon, authenticated;
revoke all on function public.sb_baf_overzicht(text) from public, anon, authenticated;
grant execute on function public.sb_baf_instellen(text, text) to service_role;
grant execute on function public.sb_baf_toekennen(text) to service_role;
grant execute on function public.sb_tegoed_volgende(text) to service_role;
grant execute on function public.sb_tegoed_verrekenen(uuid, text) to service_role;
grant execute on function public.sb_tegoed_intrekken(uuid) to service_role;
grant execute on function public.sb_baf_overzicht(text) to service_role;
