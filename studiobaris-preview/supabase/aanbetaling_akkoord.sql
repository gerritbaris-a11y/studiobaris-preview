-- Aanbetaling binnen (betaal_status wordt 'actief') -> fase Akkoord in Mijn previews (16 okt 2026).
-- Staat de preview al op Akkoord of Klaar, dan verandert er niets. "Klaar" (site opgeleverd)
-- blijft een handmatige klik in de fasebalk: daar bestaat nog geen signaal voor.
create or replace function workflow.trg_aanbetaling_akkoord()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.betaal_status = 'actief'
     and coalesce(old.betaal_status, '') <> 'actief'
     and coalesce(new.pipeline_status, '') not in
         ('Akkoord', 'Klaar', 'Klant-intake', 'Feedback 1', 'Feedback 2',
          'Wachten op feedback 1', 'Wachten op feedback 2', 'Wachten op feedback 3')
  then
    insert into public.activiteit (persoon, soort, slug, bedrijf, van, naar, details)
    values ('automatisch', 'klant_fase', new.slug, new.company_name,
            new.pipeline_status, 'Akkoord', jsonb_build_object('reden', 'aanbetaling binnen'));
    new.pipeline_status := 'Akkoord';
  end if;
  return new;
end $$;

revoke all on function workflow.trg_aanbetaling_akkoord() from public, anon, authenticated;

create or replace trigger aanbetaling_akkoord
before update of betaal_status on workflow.previews
for each row execute function workflow.trg_aanbetaling_akkoord();
