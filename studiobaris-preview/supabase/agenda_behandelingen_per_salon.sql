-- Behandelingen in de testagenda passend bij de salon (27 nov 2026).
-- Aanleiding: een pedicurepraktijk kreeg "Wassen en föhnen", omdat elke branche
-- die niet herkend werd de kapperslijst kreeg.
--
-- 1. sb_agenda_behandelingen_zet: zet behandelingen die de werkplek uit de
--    preview haalt (intake of diensten). Doet niets als er al behandelingen zijn.
-- 2. sb_agenda_standaard (terugval): meer vakken herkend (voetzorg, massage,
--    zonnestudio, losse wimper-/browsalon) en de kapperslijst alleen nog bij
--    een kapper; anders een neutrale lijst.

create or replace function public.sb_agenda_behandelingen_zet(p_company uuid, p_items jsonb)
returns integer
language plpgsql security definer
set search_path to 'public'
as $$
declare n integer := 0;
begin
  if p_company is null or jsonb_typeof(p_items) <> 'array' then return 0; end if;
  if exists (select 1 from public.agenda_behandelingen where company_id = p_company) then return 0; end if;

  insert into public.agenda_behandelingen (company_id, categorie, naam, omschrijving, duur_min, prijs, prijs_vanaf, volgorde)
  select p_company,
         coalesce(nullif(left(btrim(x->>'categorie'), 40), ''), 'Behandelingen'),
         left(btrim(x->>'naam'), 80),
         nullif(left(btrim(coalesce(x->>'omschrijving', '')), 240), ''),
         least(greatest(coalesce((x->>'duur_min')::numeric, 45)::int, 5), 480),
         case when (x->>'prijs') ~ '^[0-9]+(\.[0-9]+)?$' then least((x->>'prijs')::numeric, 4999) end,
         coalesce((x->>'prijs_vanaf')::boolean, false),
         i::int
  from jsonb_array_elements(p_items) with ordinality as t(x, i)
  where coalesce(btrim(x->>'naam'), '') <> '' and i <= 20;
  get diagnostics n = row_count;
  return n;
end $$;

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
    if v_vak ~ '(nagelstudio|nagelsalon|nail|gellak|biab)' or (v_vak ~ '(nagel|manicure)' and v_vak !~ '(voet|pedicure|podo)') then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Handen','Gellak handen',45,32.50,false,1),
      (p_company,'Handen','BIAB nieuwe set',75,52.50,false,2),
      (p_company,'Handen','BIAB opvullen',60,45.00,false,3),
      (p_company,'Handen','Manicure',30,25.00,false,4),
      (p_company,'Voeten','Gellak voeten',45,32.50,false,5),
      (p_company,'Voeten','Pedicure',45,37.50,false,6);
    elsif v_vak ~ '(voet|pedicure|podo|likdoorn|eelt)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Voeten','Basispedicure',45,37.50,false,1),
      (p_company,'Voeten','Nagels knippen en vijlen',20,22.50,false,2),
      (p_company,'Voeten','Eelt en likdoorns verwijderen',30,29.50,false,3),
      (p_company,'Voeten','Medisch pedicure',45,45.00,false,4),
      (p_company,'Ontspanning','Voetmassage',30,32.50,false,5),
      (p_company,'Ontspanning','Voetreflexmassage',60,49.50,false,6);
    elsif v_vak ~ '(barb|heren)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Knippen','Knippen',30,25.00,false,1),
      (p_company,'Knippen','Skin fade',45,30.00,false,2),
      (p_company,'Baard','Baard trimmen',20,15.00,false,3),
      (p_company,'Baard','Knippen + baard',45,37.50,false,4),
      (p_company,'Overig','Kinderen t/m 12 jaar',20,17.50,false,5);
    elsif v_vak ~ '(kap|haar|hair|knip)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Dames','Knippen en föhnen',45,42.50,false,1),
      (p_company,'Dames','Wassen en föhnen',30,29.50,false,2),
      (p_company,'Kleur','Uitgroei kleuren',75,55.00,true,3),
      (p_company,'Kleur','Balayage',150,125.00,true,4),
      (p_company,'Heren','Knippen heren',30,27.50,false,5),
      (p_company,'Kinderen','Knippen t/m 12 jaar',20,19.50,false,6);
    elsif v_vak ~ '(massage|ontspanning|wellness|spa\M)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Massage','Ontspanningsmassage 30 min',30,35.00,false,1),
      (p_company,'Massage','Ontspanningsmassage 60 min',60,59.00,false,2),
      (p_company,'Massage','Hot stone massage',75,75.00,false,3),
      (p_company,'Massage','Rug-, nek- en schoudermassage',30,35.00,false,4),
      (p_company,'Massage','Voetreflexmassage',60,55.00,false,5);
    elsif v_vak ~ '(wimper|lash|brow|wenkbrauw)' and v_vak !~ '(schoonheid|beauty|huid|gezicht)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Wimpers','Wimperlift',60,55.00,false,1),
      (p_company,'Wimpers','Wimperextensions nieuwe set',120,85.00,false,2),
      (p_company,'Wimpers','Wimperextensions opvullen',60,45.00,false,3),
      (p_company,'Brows','Brow lamination',45,45.00,false,4),
      (p_company,'Brows','Wenkbrauwen epileren en verven',30,25.00,false,5);
    elsif v_vak ~ '(zonne|bruin|tan\M)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Bruinen','Zonnebank 10 minuten',10,8.50,false,1),
      (p_company,'Bruinen','Zonnebank 15 minuten',15,10.50,false,2),
      (p_company,'Bruinen','Spray tan',30,35.00,false,3);
    elsif v_vak ~ '(beauty|schoonheid|huid|gezicht|visag|make-?up|hars|ontharen|laser)' then
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Gezicht','Basis gezichtsbehandeling',60,59.00,false,1),
      (p_company,'Gezicht','Luxe gezichtsbehandeling',90,85.00,false,2),
      (p_company,'Wimpers & brows','Wimperlift',60,55.00,false,3),
      (p_company,'Wimpers & brows','Brow lamination',45,45.00,false,4),
      (p_company,'Ontharen','Harsen bovenlip',15,12.50,false,5),
      (p_company,'Ontharen','Harsen onderbenen',30,29.50,false,6);
    else
      -- Onbekend vak: neutraal, niets dat duidelijk niet bij de salon past.
      insert into public.agenda_behandelingen (company_id, categorie, naam, duur_min, prijs, prijs_vanaf, volgorde) values
      (p_company,'Behandelingen','Kennismaking en advies',30,null,false,1),
      (p_company,'Behandelingen','Behandeling 30 minuten',30,null,false,2),
      (p_company,'Behandelingen','Behandeling 60 minuten',60,null,false,3);
    end if;
  end if;
  return public.sb_agenda_publiek(null, p_company);
end $$;

revoke all on function public.sb_agenda_behandelingen_zet(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.sb_agenda_standaard(uuid, text, text) from public, anon, authenticated;
