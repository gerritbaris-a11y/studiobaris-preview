-- Stijl "social" (Social & Creator, nov 2026) toevoegen aan de toegestane
-- stijlen. Tegelijk de spoedstijlen (signaal, helder, vakman, fris), die hier
-- ook nog ontbraken: kiezen gaf daar dezelfde foutmelding.

create or replace function public.sb_set_stijl(p_slug text, p_stijl text)
returns void language sql security definer set search_path to 'workflow', 'public' as $$
  update workflow.previews
     set content = jsonb_set(coalesce(content, '{}'::jsonb), '{merk,stijl}', to_jsonb(p_stijl), true),
         updated_at = now()
   where slug = p_slug
     and p_stijl in ('stoer', 'modern', 'persoonlijk', 'ambacht', 'strak', 'social',
                     'zacht', 'salonmodern', 'luxe', 'natuurlijk',
                     'signaal', 'helder', 'vakman', 'fris');
$$;

create or replace function public.sb_klant_kiest_stijl(p_slug text, p_stijl text)
returns boolean language plpgsql security definer set search_path to 'workflow', 'public' as $$
begin
  if p_stijl not in ('stoer', 'modern', 'persoonlijk', 'ambacht', 'strak', 'social',
                     'zacht', 'salonmodern', 'luxe', 'natuurlijk',
                     'signaal', 'helder', 'vakman', 'fris') then
    return false;
  end if;
  update workflow.previews
     set content = jsonb_set(coalesce(content, '{}'::jsonb), '{merk,stijl}', to_jsonb(p_stijl), true),
         klant_stijl = p_stijl,
         klant_stijl_op = now(),
         updated_at = now()
   where slug = p_slug;
  return found;
end;
$$;
