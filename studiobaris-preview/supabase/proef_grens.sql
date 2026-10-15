-- Harde grens: in een demo-app met lopende proefperiode kan de prospect
-- maximaal 3 projecten zelf plaatsen. Los van de app: de database weigert het 4e.
create or replace function public.trg_proef_grens()
returns trigger language plpgsql security definer set search_path = 'public' as $$
declare s text; n int;
begin
  if current_setting('sb.demo_reset', true) = '1' then return new; end if;
  select demo_van_slug into s from public.companies
  where id = new.company_id and is_demo and demo_van_slug is not null;
  if s is null then return new; end if;                      -- echte klant of algemene demo
  if not workflow.proef_geldt(s) then return new; end if;
  select geplaatst into n from workflow.proef where slug = s;
  if coalesce(n, 0) >= 3 then
    raise exception 'Je hebt de 3 proefprojecten geplaatst. Bel of app StudioBaris op 06 16 73 21 05 om je eigen app te krijgen.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists proef_grens on public.projects;
create trigger proef_grens before insert on public.projects
for each row execute function public.trg_proef_grens();

revoke all on function public.trg_proef_grens() from public, anon, authenticated;
