-- Nieuwe tekst bij de voorbeeldprojecten in de demo-app (okt 2026).
-- Was: "<titel> in <plaats>. Netjes opgeleverd, klant blij. Dit is een voorbeeldproject - jij vervangt het straks door je eigen werk."
-- Geldt voor nieuwe demo's (sb_demo_maak). Bestaande demo's krijgen hem bij livegang.

create or replace function public.sb_demo_voorbeeldtekst(p_titel text, p_plaats text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(p_titel, ''), 'Klus') ||
         case when coalesce(p_plaats, '') <> '' then ' in ' || p_plaats else '' end ||
         '. Dit is een voorbeeldproject. Tik op de + onderaan en zet je eigen klus erop: een foto en een paar woorden, wij maken er een nette tekst van. Bevalt het? Bel of app StudioBaris op 06 16 73 21 05.';
$$;

-- In sb_demo_maak alleen de tekstregel vervangen door de functie hierboven.
do $do$
declare d text;
begin
  select pg_get_functiondef('public.sb_demo_maak(text,uuid,text,text,text,text,text,jsonb,jsonb)'::regprocedure) into d;
  if position('sb_demo_voorbeeldtekst' in d) = 0 then
    d := regexp_replace(d,
      $r$txt := coalesce\(nullif\(e->>'titel', ''\), 'Klus'\) \|\|\s*case when coalesce\(e->>'plaats', ''\) <> '' then ' in ' \|\| \(e->>'plaats'\) else '' end \|\|\s*'[^']*';$r$,
      $n$txt := public.sb_demo_voorbeeldtekst(e->>'titel', e->>'plaats');$n$);
    if position('sb_demo_voorbeeldtekst' in d) = 0 then
      raise exception 'Tekstregel in sb_demo_maak niet gevonden; niets gewijzigd.';
    end if;
    execute d;
  end if;
end $do$;

revoke all on function public.sb_demo_voorbeeldtekst(text, text) from public, anon, authenticated;
grant execute on function public.sb_demo_voorbeeldtekst(text, text) to service_role;
