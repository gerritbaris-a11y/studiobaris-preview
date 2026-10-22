-- "Preview bekeken" begint opnieuw bij Benaderd (22 okt 2026).
-- Aanleiding: Gerrit controleerde een preview vlak voor het benaderen op een
-- toestel waar hij niet op de werkplek was ingelogd; dat telde als bezoek.
-- Bezoeken van vóór het eerste vinkje Benaderd zijn eigen controles van het
-- team (de prospect heeft de link dan nog niet), dus de teller gaat dan op 0.
-- Geen delete: aantal = 0 betekent "nog niet bekeken"; het volgende bezoek
-- telt weer als 1 en zet eerste_op opnieuw.

create or replace function public.sb_preview_bezocht(p_slug text)
returns void language sql security definer set search_path to '' as $function$
  insert into workflow.preview_bezoek (slug) values (p_slug)
  on conflict (slug) do update set
    aantal     = case when workflow.preview_bezoek.aantal = 0 then 1
                      else workflow.preview_bezoek.aantal
                           + case when workflow.preview_bezoek.laatste_op < now() - interval '30 minutes' then 1 else 0 end
                 end,
    eerste_op  = case when workflow.preview_bezoek.aantal = 0 then now() else workflow.preview_bezoek.eerste_op end,
    laatste_op = now();
$function$;

create or replace function public.sb_benaderd_zet(p_slug text, p_aan boolean, p_door text)
returns json language plpgsql security definer set search_path = '' as $$
declare r workflow.previews; proef_gestart boolean := false; s json; was_benaderd boolean;
begin
  select benaderd_op is not null into was_benaderd from workflow.previews where slug = p_slug;

  if p_aan then
    update workflow.previews
       set benaderd_op = coalesce(benaderd_op, now()),
           benaderd_door = case when benaderd_op is null then p_door else benaderd_door end
     where slug = p_slug
     returning * into r;
  else
    update workflow.previews set benaderd_op = null, benaderd_door = null
     where slug = p_slug
     returning * into r;
  end if;
  if r.id is null then
    return json_build_object('ok', false, 'error', 'Preview niet gevonden.');
  end if;

  -- Eerste keer benaderd: teller "Preview bekeken" opnieuw.
  if p_aan and not coalesce(was_benaderd, false) then
    update workflow.preview_bezoek set aantal = 0 where slug = p_slug;
  end if;

  if p_aan
     and workflow.proef_geldt(p_slug)
     and not exists (select 1 from workflow.proef where slug = p_slug)
     and exists (select 1 from public.companies where demo_van_slug = p_slug and is_demo)
  then
    s := public.sb_proef_start(p_slug, 'benaderd');
    proef_gestart := coalesce((s->>'ok')::boolean, false);
  end if;

  return json_build_object('ok', true, 'benaderd_op', r.benaderd_op, 'benaderd_door', r.benaderd_door,
                           'proef_gestart', proef_gestart);
end $$;

-- Eenmalig toegepast: de eigen controle bij Haasnoot Metselwerken (12:21, vóór benaderd 12:22).
update workflow.preview_bezoek set aantal = 0
 where slug = 'haasnoot-metselwerken' and laatste_op < '2026-10-22 10:22:31+00';

-- Aanvulling (22 okt 2026): bij het eerste vinkje Benaderd ook "App geopend"
-- terugzetten (verkoper die zijn eigen demo-app controleert). De proef zelf
-- loopt door; er wordt niets gewist.
-- In sb_benaderd_zet, binnen "if p_aan and not coalesce(was_benaderd, false)":
--   update workflow.proef set app_geopend_op = null where slug = p_slug;
