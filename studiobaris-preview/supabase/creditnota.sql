-- Creditnota's (18 nov 2026).
--
-- Aanleiding: Baris Meubelstofferingen accepteerde de SEPA-link per ongeluk
-- vanaf zijn privérekening. Het bedrag is teruggestort, maar een verstuurde
-- of betaalde factuur mag fiscaal niet zomaar verdwijnen of op "geannuleerd".
-- Die hoort gecorrigeerd te worden met een creditnota: een eigen nummer uit
-- dezelfde reeks, negatieve bedragen en een verwijzing naar de originele
-- factuur.
--
-- Zo telt het in de boekhouding:
--   * De originele factuur blijft staan met haar status (verstuurd/betaald) en
--     blijft meetellen in het kwartaal van haar factuurdatum. Een al ingediende
--     btw-aangifte verandert dus nooit met terugwerkende kracht.
--   * De creditnota (soort 'credit', status 'verstuurd') telt mee in het
--     kwartaal van háár datum, met negatieve bedragen. Samen vallen ze tegen
--     elkaar weg.
--   * Per factuur maximaal één creditnota (volledige creditering).

alter table workflow.facturen drop constraint if exists facturen_soort_check;
alter table workflow.facturen add constraint facturen_soort_check
  check (soort = any (array['eenmalig','aanbetaling','slottermijn','maandelijks','credit']));

alter table workflow.facturen
  add column if not exists credit_van uuid references workflow.facturen(id),
  add column if not exists gecrediteerd_op timestamptz,
  add column if not exists credit_reden text;

create unique index if not exists facturen_credit_van_uniek
  on workflow.facturen(credit_van) where credit_van is not null;

-- ── Crediteren ──────────────────────────────────────────────────────────────
create or replace function public.sb_factuur_crediteren(p_nummer text, p_reden text default null)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_f      workflow.facturen%rowtype;
  v_nummer text;
  v_regels jsonb;
begin
  select * into v_f from workflow.facturen where nummer = p_nummer for update;
  if not found then raise exception 'factuur niet gevonden'; end if;

  if v_f.soort = 'credit' then
    raise exception 'een creditnota kan niet zelf gecrediteerd worden';
  end if;
  if v_f.gecrediteerd_op is not null
     or exists (select 1 from workflow.facturen c where c.credit_van = v_f.id) then
    raise exception 'deze factuur is al gecrediteerd';
  end if;
  if v_f.status = 'concept' then
    raise exception 'een conceptfactuur is nooit verstuurd: annuleer die gewoon';
  end if;
  if v_f.status not in ('verstuurd','betaald') then
    raise exception 'alleen een verstuurde of betaalde factuur kan gecrediteerd worden (status nu: %)', v_f.status;
  end if;

  select coalesce(jsonb_agg(
           r || jsonb_build_object(
             'omschrijving', 'Creditering: ' || coalesce(r->>'omschrijving', ''),
             'bedrag_excl', -1 * coalesce((r->>'bedrag_excl')::numeric, 0)
           )), '[]'::jsonb)
    into v_regels
  from jsonb_array_elements(coalesce(v_f.snapshot->'regels', '[]'::jsonb)) r;

  v_nummer := workflow.volgend_factuurnummer();

  insert into workflow.facturen (
    preview_id, nummer, soort, periode, bedrag_excl, btw_bedrag, bedrag_incl,
    btw_tarief, status, factuurdatum, vervaldatum, verstuurd_op,
    credit_van, credit_reden, snapshot
  ) values (
    v_f.preview_id, v_nummer, 'credit', v_f.periode,
    -v_f.bedrag_excl, -v_f.btw_bedrag, -v_f.bedrag_incl,
    v_f.btw_tarief, 'verstuurd', current_date, current_date, now(),
    v_f.id, nullif(btrim(p_reden), ''),
    v_f.snapshot || jsonb_build_object(
      'regels', v_regels,
      'credit_van_nummer', v_f.nummer,
      'credit_van_datum', v_f.factuurdatum,
      'credit_reden', nullif(btrim(p_reden), '')
    )
  );

  update workflow.facturen
     set gecrediteerd_op = now(), updated_at = now()
   where id = v_f.id;

  return public.sb_factuur(v_nummer);
end;
$$;

revoke all on function public.sb_factuur_crediteren(text, text) from public, anon, authenticated;
grant execute on function public.sb_factuur_crediteren(text, text) to service_role;

-- ── Statuswijziging: creditnota's en gecrediteerde facturen liggen vast ─────
create or replace function public.sb_factuur_status(p_nummer text, p_status text)
returns json
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_huidig text;
  v_soort  text;
  v_gecred timestamptz;
begin
  if p_status not in ('concept','verstuurd','betaald','mislukt','geannuleerd') then
    raise exception 'onbekende status';
  end if;

  select status, soort, gecrediteerd_op into v_huidig, v_soort, v_gecred
  from workflow.facturen where nummer = p_nummer;
  if not found then raise exception 'factuur niet gevonden'; end if;

  if v_soort = 'credit' and p_status <> v_huidig then
    raise exception 'de status van een creditnota ligt vast';
  end if;
  if v_gecred is not null and p_status in ('concept','geannuleerd') then
    raise exception 'deze factuur is gecrediteerd en kan niet meer terug naar concept of geannuleerd';
  end if;
  if p_status = 'geannuleerd' and v_huidig <> 'concept' then
    raise exception 'alleen een conceptfactuur kan geannuleerd worden — crediteer een verstuurde of betaalde factuur';
  end if;
  if v_huidig = 'geannuleerd' and p_status <> 'concept' and p_status <> 'geannuleerd' then
    raise exception 'een geannuleerde factuur kan alleen terug naar concept gezet worden';
  end if;

  update workflow.facturen set
    status       = p_status,
    verstuurd_op = case when p_status = 'verstuurd' then coalesce(verstuurd_op, now()) else verstuurd_op end,
    betaald_op   = case when p_status = 'betaald'   then coalesce(betaald_op, now())   else betaald_op end,
    updated_at   = now()
  where nummer = p_nummer;

  return public.sb_factuur(p_nummer);
end;
$$;

-- ── Overzicht: wie is gecrediteerd, en waarvoor is een creditnota ───────────
create or replace function public.sb_facturen_overzicht()
returns json
language sql
stable security definer
set search_path to ''
as $$
  select coalesce(json_agg(row_to_json(r) order by r.factuurdatum desc, r.created_at desc), '[]'::json)
  from (
    select
      f.nummer, f.soort, f.periode, f.status, f.bedrag_excl, f.btw_bedrag, f.bedrag_incl, f.btw_tarief,
      f.factuurdatum, f.vervaldatum, f.incassodatum, f.verstuurd_op, f.betaald_op, f.created_at, f.pdf_url,
      f.mollie_payment_id is not null as via_mollie,
      f.gecrediteerd_op, f.credit_reden,
      (select c.nummer from workflow.facturen c where c.credit_van = f.id) as creditnota_nummer,
      (select o.nummer from workflow.facturen o where o.id = f.credit_van) as credit_van_nummer,
      p.slug,
      coalesce(p.company_name, p.content->'bedrijf'->>'naam', p.slug) as klant,
      p.contactpersoon,
      (coalesce(p.websiteprijs, 0) = 0 and coalesce(p.maandbedrag, 0) = 0) as klant_gratis
    from workflow.facturen f
    join workflow.previews p on p.id = f.preview_id
  ) r;
$$;

-- ── Nog te ontvangen: creditnota's en gecrediteerde facturen niet meetellen ─
create or replace function public.sb_omzet_kwartaal(p_jaar integer default null::integer)
returns json
language sql
stable security definer
set search_path to ''
as $$
  with jaar as (
    select coalesce(p_jaar, extract(year from current_date)::int) as j
  ),
  kwartalen as (
    select
      q.kwartaal,
      coalesce(sum(f.bedrag_excl), 0) as omzet_excl,
      coalesce(sum(f.btw_bedrag), 0) as btw,
      coalesce(sum(f.bedrag_incl), 0) as omzet_incl
    from generate_series(1, 4) as q(kwartaal)
    left join workflow.facturen f
      on extract(year from f.factuurdatum)::int = (select j from jaar)
     and extract(quarter from f.factuurdatum)::int = q.kwartaal
     and f.status <> 'geannuleerd'
    group by q.kwartaal
    order by q.kwartaal
  )
  select json_build_object(
    'jaar', (select j from jaar),
    'kwartalen', (select coalesce(json_agg(row_to_json(kwartalen)), '[]'::json) from kwartalen),
    'jaartotaal_excl', (select coalesce(sum(omzet_excl), 0) from kwartalen),
    'jaartotaal_btw', (select coalesce(sum(btw), 0) from kwartalen),
    'jaartotaal_incl', (select coalesce(sum(omzet_incl), 0) from kwartalen),
    'nog_te_ontvangen', (
      select coalesce(sum(bedrag_incl), 0)
      from workflow.facturen
      where status in ('concept', 'verstuurd')
        and soort <> 'credit'
        and gecrediteerd_op is null
        and extract(year from factuurdatum)::int = (select j from jaar)
    )
  );
$$;
