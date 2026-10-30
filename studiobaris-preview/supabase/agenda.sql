-- Online agenda voor salons (esthetiek), 30 okt 2026.
-- Eén systeem voor de preview (testmodus, demo-bedrijf) en de echte klantsite
-- (live). Alles hangt aan public.companies, zodat de StudioBaris-app het via de
-- gewone eigenaar-RLS kan beheren. Bezoekers boeken alleen via de server-API
-- (service role) met de sb_agenda_*-functies.

create extension if not exists btree_gist with schema extensions;

create table if not exists public.agenda_instellingen (
  company_id uuid primary key references public.companies(id) on delete cascade,
  actief boolean not null default true,
  test_modus boolean not null default true,       -- preview: boekingen zijn test
  melding_email text,                              -- waar de salon meldingen krijgt
  whatsapp_aan boolean not null default false,     -- herinneringen via WhatsApp
  whatsapp_bundel int not null default 150,        -- per kalendermaand, daarna e-mail
  min_vooraf_minuten int not null default 120,     -- niet later dan x min vooraf boeken
  max_dagen_vooruit int not null default 60,
  slot_stap_minuten int not null default 15,
  annuleren_tot_uur int not null default 24,       -- zelf annuleren tot x uur vooraf
  updated_at timestamptz not null default now()
);

create table if not exists public.agenda_behandelingen (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  categorie text not null default 'Behandelingen',
  naam text not null,
  omschrijving text,
  duur_min int not null check (duur_min between 5 and 600),
  prijs numeric(8,2),
  prijs_vanaf boolean not null default false,
  volgorde int not null default 0,
  actief boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists agenda_behandelingen_company on public.agenda_behandelingen(company_id);

-- Weekrooster: weekdag 1 = maandag … 7 = zondag. Meerdere blokken per dag mag
-- (bijv. 9:00-12:30 en 13:00-17:30 = pauze ertussen).
create table if not exists public.agenda_rooster (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  weekdag int not null check (weekdag between 1 and 7),
  open time not null,
  dicht time not null,
  check (dicht > open)
);
create index if not exists agenda_rooster_company on public.agenda_rooster(company_id);

-- Vrije dagen, vakantie, pauzes die afwijken van het rooster.
create table if not exists public.agenda_blokkades (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  van timestamptz not null,
  tot timestamptz not null,
  reden text,
  check (tot > van)
);
create index if not exists agenda_blokkades_company on public.agenda_blokkades(company_id, van);

create table if not exists public.agenda_afspraken (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  behandeling_id uuid references public.agenda_behandelingen(id) on delete set null,
  behandeling_naam text not null,                  -- vastgelegd op het moment van boeken
  prijs numeric(8,2),
  start timestamptz not null,
  eind timestamptz not null,
  klant_naam text not null,
  klant_telefoon text,
  klant_email text,
  opmerking text,
  status text not null default 'bevestigd' check (status in ('bevestigd','geannuleerd')),
  test boolean not null default false,
  bron text not null default 'site' check (bron in ('preview','site','app')),
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  herinnering_verstuurd_op timestamptz,
  geannuleerd_op timestamptz,
  geannuleerd_door text,
  created_at timestamptz not null default now(),
  check (eind > start),
  -- Nooit dubbel geboekt: twee bevestigde afspraken van dezelfde salon mogen
  -- elkaar niet overlappen. De database weigert het, ook bij gelijktijdig klikken.
  constraint agenda_geen_overlap exclude using gist (
    company_id with =, tstzrange(start, eind) with &&
  ) where (status = 'bevestigd')
);
create index if not exists agenda_afspraken_company_start on public.agenda_afspraken(company_id, start);

-- Elk verstuurd bericht (voor de teller en de WhatsApp-bundel).
create table if not exists public.agenda_berichten (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  afspraak_id uuid references public.agenda_afspraken(id) on delete set null,
  kanaal text not null check (kanaal in ('email','whatsapp')),
  soort text not null,                             -- bevestiging / herinnering / annulering / melding_salon
  naar text,
  gelukt boolean not null default true,
  verstuurd_op timestamptz not null default now()
);
create index if not exists agenda_berichten_company_maand on public.agenda_berichten(company_id, verstuurd_op);

-- RLS: de eigenaar van het bedrijf beheert alles in de app (zelfde patroon als
-- projects/reviews). Bezoekers komen er alleen via de server-API bij.
do $$
declare t text;
begin
  foreach t in array array['agenda_instellingen','agenda_behandelingen','agenda_rooster','agenda_blokkades','agenda_afspraken','agenda_berichten'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Eigenaar beheert" on public.%I', t);
    execute format($p$create policy "Eigenaar beheert" on public.%I for all
      using (company_id in (select c.id from public.companies c where c.owner_id = auth.uid()))
      with check (company_id in (select c.id from public.companies c where c.owner_id = auth.uid()))$p$, t);
  end loop;
end $$;

-- ===================== Functies (alleen service role) =====================

-- Vrije starttijden voor één behandeling op één dag (lokale tijd Amsterdam).
create or replace function public.sb_agenda_vrije_tijden(p_company uuid, p_behandeling uuid, p_datum date)
returns jsonb
language plpgsql stable security definer
set search_path to 'public'
as $$
declare
  v_ins public.agenda_instellingen;
  v_duur int;
  v_tz text := 'Europe/Amsterdam';
  v_uit jsonb := '[]'::jsonb;
  v_blok record;
  v_t timestamptz;
  v_eind timestamptz;
  v_vroegst timestamptz;
begin
  select * into v_ins from public.agenda_instellingen where company_id = p_company;
  if v_ins.company_id is null or not v_ins.actief then return v_uit; end if;
  select duur_min into v_duur from public.agenda_behandelingen
   where id = p_behandeling and company_id = p_company and actief;
  if v_duur is null then return v_uit; end if;
  if p_datum < (now() at time zone v_tz)::date
     or p_datum > (now() at time zone v_tz)::date + v_ins.max_dagen_vooruit then
    return v_uit;
  end if;
  v_vroegst := now() + make_interval(mins => v_ins.min_vooraf_minuten);

  for v_blok in
    select open, dicht from public.agenda_rooster
     where company_id = p_company and weekdag = extract(isodow from p_datum)::int
     order by open
  loop
    v_t := (p_datum + v_blok.open) at time zone v_tz;
    loop
      v_eind := v_t + make_interval(mins => v_duur);
      exit when v_eind > (p_datum + v_blok.dicht) at time zone v_tz;
      if v_t >= v_vroegst
         and not exists (select 1 from public.agenda_afspraken a
                          where a.company_id = p_company and a.status = 'bevestigd'
                            and tstzrange(a.start, a.eind) && tstzrange(v_t, v_eind))
         and not exists (select 1 from public.agenda_blokkades b
                          where b.company_id = p_company
                            and tstzrange(b.van, b.tot) && tstzrange(v_t, v_eind)) then
        v_uit := v_uit || to_jsonb(to_char(v_t at time zone v_tz, 'HH24:MI'));
      end if;
      v_t := v_t + make_interval(mins => v_ins.slot_stap_minuten);
    end loop;
  end loop;
  return v_uit;
end $$;

-- Eerstvolgende dagen met minstens één vrije tijd (voor de datumkiezer).
create or replace function public.sb_agenda_vrije_dagen(p_company uuid, p_behandeling uuid, p_dagen int default 21)
returns jsonb
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(jsonb_agg(to_char(d, 'YYYY-MM-DD') order by d), '[]'::jsonb)
  from generate_series((now() at time zone 'Europe/Amsterdam')::date,
                       (now() at time zone 'Europe/Amsterdam')::date + least(greatest(p_dagen,1), 90),
                       interval '1 day') g(d)
  where jsonb_array_length(public.sb_agenda_vrije_tijden(p_company, p_behandeling, d::date)) > 0;
$$;

-- Afspraak boeken. Controleert of de tijd echt vrij is; de exclusion
-- constraint vangt een gelijktijdige dubbele boeking af.
create or replace function public.sb_agenda_boek(
  p_company uuid, p_behandeling uuid, p_datum date, p_tijd text,
  p_naam text, p_telefoon text, p_email text, p_opmerking text, p_bron text default 'site')
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_ins public.agenda_instellingen;
  v_beh public.agenda_behandelingen;
  v_start timestamptz;
  v_rij public.agenda_afspraken;
begin
  select * into v_ins from public.agenda_instellingen where company_id = p_company;
  select * into v_beh from public.agenda_behandelingen where id = p_behandeling and company_id = p_company and actief;
  if v_ins.company_id is null or v_beh.id is null then
    return jsonb_build_object('ok', false, 'fout', 'onbekend');
  end if;
  if coalesce(btrim(p_naam),'') = '' or (coalesce(btrim(p_telefoon),'') = '' and coalesce(btrim(p_email),'') = '') then
    return jsonb_build_object('ok', false, 'fout', 'gegevens');
  end if;
  if not (public.sb_agenda_vrije_tijden(p_company, p_behandeling, p_datum) ? p_tijd) then
    return jsonb_build_object('ok', false, 'fout', 'bezet');
  end if;
  v_start := (p_datum + p_tijd::time) at time zone 'Europe/Amsterdam';
  begin
    insert into public.agenda_afspraken (company_id, behandeling_id, behandeling_naam, prijs, start, eind,
      klant_naam, klant_telefoon, klant_email, opmerking, test, bron)
    values (p_company, v_beh.id, v_beh.naam, v_beh.prijs, v_start, v_start + make_interval(mins => v_beh.duur_min),
      left(btrim(p_naam), 120), nullif(left(btrim(p_telefoon), 40), ''), nullif(lower(left(btrim(p_email), 200)), ''),
      nullif(left(btrim(p_opmerking), 500), ''), v_ins.test_modus,
      case when p_bron in ('preview','site','app') then p_bron else 'site' end)
    returning * into v_rij;
  exception when exclusion_violation then
    return jsonb_build_object('ok', false, 'fout', 'bezet');
  end;
  return jsonb_build_object('ok', true, 'afspraak', to_jsonb(v_rij));
end $$;

-- Afspraak opvragen / annuleren met de token uit de bevestigingsmail.
create or replace function public.sb_agenda_afspraak_token(p_token text)
returns jsonb
language sql stable security definer
set search_path to 'public'
as $$
  select jsonb_build_object('afspraak', to_jsonb(a), 'bedrijf', c.name, 'company_id', c.id,
                            'annuleren_tot_uur', coalesce(i.annuleren_tot_uur, 24))
  from public.agenda_afspraken a
  join public.companies c on c.id = a.company_id
  left join public.agenda_instellingen i on i.company_id = a.company_id
  where a.token = p_token;
$$;

create or replace function public.sb_agenda_annuleer(p_token text, p_door text default 'klant')
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare v_a public.agenda_afspraken; v_uur int;
begin
  select a.* into v_a from public.agenda_afspraken a where a.token = p_token;
  if v_a.id is null then return jsonb_build_object('ok', false, 'fout', 'onbekend'); end if;
  if v_a.status = 'geannuleerd' then return jsonb_build_object('ok', true, 'al', true, 'afspraak', to_jsonb(v_a)); end if;
  select coalesce(annuleren_tot_uur, 24) into v_uur from public.agenda_instellingen where company_id = v_a.company_id;
  if p_door = 'klant' and v_a.start - make_interval(hours => coalesce(v_uur, 24)) < now() then
    return jsonb_build_object('ok', false, 'fout', 'te_laat', 'uur', coalesce(v_uur, 24));
  end if;
  update public.agenda_afspraken set status = 'geannuleerd', geannuleerd_op = now(), geannuleerd_door = p_door
   where id = v_a.id returning * into v_a;
  return jsonb_build_object('ok', true, 'afspraak', to_jsonb(v_a));
end $$;

-- Alles wat de boekingswidget nodig heeft, op preview-slug of company-id.
create or replace function public.sb_agenda_publiek(p_slug text default null, p_company uuid default null)
returns jsonb
language sql stable security definer
set search_path to 'public'
as $$
  with c as (
    select co.* from public.companies co
    where (p_company is not null and co.id = p_company)
       or (p_company is null and p_slug is not null and co.demo_van_slug = p_slug)
    order by co.created_at desc limit 1
  )
  select case when not exists (select 1 from c) then null else jsonb_build_object(
    'company_id', (select id from c),
    'naam', (select name from c),
    'instellingen', (select to_jsonb(i) - 'melding_email' from public.agenda_instellingen i where i.company_id = (select id from c)),
    'melding_email', (select i.melding_email from public.agenda_instellingen i where i.company_id = (select id from c)),
    'behandelingen', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'categorie', b.categorie, 'naam', b.naam,
         'omschrijving', b.omschrijving, 'duur_min', b.duur_min, 'prijs', b.prijs, 'prijs_vanaf', b.prijs_vanaf)
         order by b.volgorde, b.naam)
       from public.agenda_behandelingen b where b.company_id = (select id from c) and b.actief), '[]'::jsonb),
    'rooster', coalesce((select jsonb_agg(jsonb_build_object('weekdag', r.weekdag, 'open', to_char(r.open,'HH24:MI'), 'dicht', to_char(r.dicht,'HH24:MI'))
         order by r.weekdag, r.open)
       from public.agenda_rooster r where r.company_id = (select id from c)), '[]'::jsonb)
  ) end;
$$;

-- Agenda klaarzetten voor een (demo-)bedrijf met voorbeeldbehandelingen per vak.
-- Doet niets als er al behandelingen zijn.
create or replace function public.sb_agenda_standaard(p_company uuid, p_vak text, p_email text default null)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $$
declare v_vak text := lower(coalesce(p_vak,''));
begin
  insert into public.agenda_instellingen (company_id, melding_email)
  values (p_company, nullif(btrim(p_email),''))
  on conflict (company_id) do update set melding_email = coalesce(public.agenda_instellingen.melding_email, excluded.melding_email);

  if not exists (select 1 from public.agenda_rooster where company_id = p_company) then
    insert into public.agenda_rooster (company_id, weekdag, open, dicht)
    select p_company, d, '09:00', case when d = 6 then '16:00'::time else '17:30'::time end
    from generate_series(2, 6) d;                          -- dinsdag t/m zaterdag
  end if;

  if not exists (select 1 from public.agenda_behandelingen where company_id = p_company) then
    if v_vak ~ '(nagel|nail|manicure|gellak)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Handen','Gellak handen',45,32.50,false,1),
      (p_company,'Handen','BIAB nieuwe set',75,52.50,false,2),
      (p_company,'Handen','BIAB opvullen',60,45.00,false,3),
      (p_company,'Handen','Manicure',30,25.00,false,4),
      (p_company,'Voeten','Gellak voeten',45,32.50,false,5),
      (p_company,'Voeten','Pedicure',45,37.50,false,6);
    elsif v_vak ~ '(barb|heren)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Knippen','Knippen',30,25.00,false,1),
      (p_company,'Knippen','Skin fade',45,30.00,false,2),
      (p_company,'Baard','Baard trimmen',20,15.00,false,3),
      (p_company,'Baard','Knippen + baard',45,37.50,false,4),
      (p_company,'Overig','Kinderen t/m 12 jaar',20,17.50,false,5);
    elsif v_vak ~ '(beauty|schoonheid|huid|wimper|lash|brow|visag)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Gezicht','Basis gezichtsbehandeling',60,59.00,false,1),
      (p_company,'Gezicht','Luxe gezichtsbehandeling',90,85.00,false,2),
      (p_company,'Wimpers & brows','Wimperlift',60,55.00,false,3),
      (p_company,'Wimpers & brows','Brow lamination',45,45.00,false,4),
      (p_company,'Ontharen','Harsen bovenlip',15,12.50,false,5),
      (p_company,'Ontharen','Harsen onderbenen',30,29.50,false,6);
    else
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Dames','Knippen en föhnen',45,42.50,false,1),
      (p_company,'Dames','Wassen en föhnen',30,29.50,false,2),
      (p_company,'Kleur','Uitgroei kleuren',75,55.00,true,3),
      (p_company,'Kleur','Balayage',150,125.00,true,4),
      (p_company,'Heren','Knippen heren',30,27.50,false,5),
      (p_company,'Kinderen','Knippen t/m 12 jaar',20,19.50,false,6);
    end if;
  end if;
  return public.sb_agenda_publiek(null, p_company);
end $$;

-- Teller: berichten deze maand per kanaal (voor de WhatsApp-bundel en het dashboard).
create or replace function public.sb_agenda_berichten_maand(p_company uuid)
returns jsonb
language sql stable security definer
set search_path to 'public'
as $$
  select jsonb_build_object(
    'email',    count(*) filter (where kanaal = 'email' and gelukt),
    'whatsapp', count(*) filter (where kanaal = 'whatsapp' and gelukt),
    'bundel',   coalesce((select whatsapp_bundel from public.agenda_instellingen where company_id = p_company), 150))
  from public.agenda_berichten
  where company_id = p_company
    and verstuurd_op >= date_trunc('month', now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';
$$;

create or replace function public.sb_agenda_bericht_log(p_company uuid, p_afspraak uuid, p_kanaal text, p_soort text, p_naar text, p_gelukt boolean)
returns void
language sql security definer
set search_path to 'public'
as $$
  insert into public.agenda_berichten (company_id, afspraak_id, kanaal, soort, naar, gelukt)
  values (p_company, p_afspraak, p_kanaal, p_soort, p_naar, coalesce(p_gelukt, true));
$$;

-- Testmodus: e-mailadres voor meldingen wijzigen vanaf de preview.
create or replace function public.sb_agenda_test_email(p_company uuid, p_email text)
returns boolean
language sql security definer
set search_path to 'public'
as $$
  update public.agenda_instellingen set melding_email = nullif(lower(btrim(p_email)),''), updated_at = now()
   where company_id = p_company and test_modus
  returning true;
$$;

-- Dashboard: berichten per salon deze maand (één regel per salon).
create or replace function public.sb_agenda_berichten_overzicht()
returns jsonb
language sql stable security definer
set search_path to 'public'
as $$
  select coalesce(jsonb_agg(jsonb_build_object('company_id', c.id, 'naam', c.name, 'demo', c.is_demo,
     'test_modus', i.test_modus, 'whatsapp_aan', i.whatsapp_aan, 'bundel', i.whatsapp_bundel,
     'email', (public.sb_agenda_berichten_maand(c.id)->>'email')::int,
     'whatsapp', (public.sb_agenda_berichten_maand(c.id)->>'whatsapp')::int,
     'afspraken_maand', (select count(*) from public.agenda_afspraken a where a.company_id = c.id and a.status = 'bevestigd'
                           and a.start >= date_trunc('month', now())))
     order by c.name), '[]'::jsonb)
  from public.agenda_instellingen i join public.companies c on c.id = i.company_id;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'sb_agenda_vrije_tijden(uuid,uuid,date)', 'sb_agenda_vrije_dagen(uuid,uuid,int)',
    'sb_agenda_boek(uuid,uuid,date,text,text,text,text,text,text)', 'sb_agenda_afspraak_token(text)',
    'sb_agenda_annuleer(text,text)', 'sb_agenda_publiek(text,uuid)', 'sb_agenda_standaard(uuid,text,text)',
    'sb_agenda_berichten_maand(uuid)', 'sb_agenda_bericht_log(uuid,uuid,text,text,text,boolean)',
    'sb_agenda_test_email(uuid,text)', 'sb_agenda_berichten_overzicht()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ===== Aanvulling (migratie agenda_herinneringen_en_testlimiet) =====
-- sb_agenda_herinneringen_lijst(): afspraken van morgen zonder herinnering.
-- sb_agenda_herinnering_gezet(uuid): markeren als verstuurd.
-- sb_agenda_test_opruimen(): testboekingen ouder dan 30 dagen wissen.
-- sb_agenda_boek: in testmodus max. 25 boekingen per voorbeeldsite per 24 uur.
-- (Volledige definities: zie migratie in Supabase.)
-- ===== Aanvulling (migraties agenda_ical_feed, agenda_overzetten_naar_klant) =====
-- agenda_instellingen.ical_token + sb_agenda_ical(token): abonneerbare agenda.
-- sb_agenda_overzetten(van_slug, naar_company, email): demo-agenda naar het
--   echte app-account (behandelingen, rooster, instellingen; testmodus uit).
