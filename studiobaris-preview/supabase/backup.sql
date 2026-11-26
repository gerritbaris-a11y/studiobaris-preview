-- Wekelijkse backup naar Google Drive (app/api/backup/*).
-- Alleen de service-role mag deze functies aanroepen. public.ops_secrets gaat
-- bewust NOOIT mee: wachtwoorden en sleutels horen niet in een Drive-map.

-- 1. Welke tabellen gaan mee (public + workflow, behalve ops_secrets).
create or replace function public.sb_backup_tabellen()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(jsonb_agg(jsonb_build_object('schema', n.nspname, 'tabel', c.relname)
                            order by n.nspname, c.relname), '[]'::jsonb)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p')
    and n.nspname in ('public', 'workflow')
    and not (n.nspname = 'public' and c.relname = 'ops_secrets');
$$;

-- 2. Eén pagina rijen uit één tabel (alleen tabellen uit de lijst hierboven).
create or replace function public.sb_backup_tabel(p_schema text, p_tabel text, p_offset int, p_limit int)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  uitkomst jsonb;
begin
  if not exists (
    select 1 from jsonb_array_elements(public.sb_backup_tabellen()) t
    where t->>'schema' = p_schema and t->>'tabel' = p_tabel
  ) then
    raise exception 'Tabel %.% hoort niet bij de backup', p_schema, p_tabel;
  end if;

  execute format(
    'select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from (select * from %I.%I order by ctid offset %s limit %s) x',
    p_schema, p_tabel, greatest(p_offset, 0), least(greatest(p_limit, 1), 10000)
  ) into uitkomst;
  return uitkomst;
end;
$$;

-- 3. De opbouw van de database: kolommen, sleutels, functies, policies, views,
--    triggers. Nodig om alles na een crash weer op te bouwen.
create or replace function public.sb_backup_schema()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select jsonb_build_object(
    'kolommen', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'schema', table_schema, 'tabel', table_name, 'kolom', column_name,
        'type', data_type, 'udt', udt_name, 'nullable', is_nullable,
        'standaard', column_default, 'positie', ordinal_position)
        order by table_schema, table_name, ordinal_position), '[]'::jsonb)
      from information_schema.columns
      where table_schema in ('public', 'workflow')),
    'constraints', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'schema', n.nspname, 'tabel', c.relname, 'naam', con.conname,
        'definitie', pg_get_constraintdef(con.oid))
        order by n.nspname, c.relname, con.conname), '[]'::jsonb)
      from pg_constraint con
      join pg_class c on c.oid = con.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname in ('public', 'workflow')),
    'indexen', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'schema', schemaname, 'tabel', tablename, 'naam', indexname, 'definitie', indexdef)
        order by schemaname, tablename, indexname), '[]'::jsonb)
      from pg_indexes
      where schemaname in ('public', 'workflow')),
    'functies', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'schema', n.nspname, 'naam', p.proname, 'definitie', pg_get_functiondef(p.oid))
        order by n.nspname, p.proname), '[]'::jsonb)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public', 'workflow') and p.prokind in ('f', 'p')
        and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')),
    'views', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'schema', schemaname, 'naam', viewname, 'definitie', definition)
        order by schemaname, viewname), '[]'::jsonb)
      from pg_views
      where schemaname in ('public', 'workflow')),
    'policies', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.schemaname, p.tablename, p.policyname), '[]'::jsonb)
      from pg_policies p
      where p.schemaname in ('public', 'workflow', 'storage')),
    'triggers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'schema', n.nspname, 'tabel', c.relname, 'naam', t.tgname,
        'definitie', pg_get_triggerdef(t.oid))
        order by n.nspname, c.relname, t.tgname), '[]'::jsonb)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname in ('public', 'workflow') and not t.tgisinternal),
    'buckets', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'naam', name, 'publiek', public)
        order by id), '[]'::jsonb)
      from storage.buckets)
  );
$$;

-- 4. Alle bestanden in Supabase Storage (voor de doorlopende bestandsspiegel).
create or replace function public.sb_backup_bestanden()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'bucket', o.bucket_id, 'pad', o.name,
    'grootte', coalesce((o.metadata->>'size')::bigint, 0),
    'type', o.metadata->>'mimetype')
    order by o.bucket_id, o.name), '[]'::jsonb)
  from storage.objects o
  where o.name is not null and o.name not like '%/.emptyFolderPlaceholder'
    and o.name <> '.emptyFolderPlaceholder';
$$;

revoke all on function public.sb_backup_tabellen() from public, anon, authenticated;
revoke all on function public.sb_backup_tabel(text, text, int, int) from public, anon, authenticated;
revoke all on function public.sb_backup_schema() from public, anon, authenticated;
revoke all on function public.sb_backup_bestanden() from public, anon, authenticated;
grant execute on function public.sb_backup_tabellen() to service_role;
grant execute on function public.sb_backup_tabel(text, text, int, int) to service_role;
grant execute on function public.sb_backup_schema() to service_role;
grant execute on function public.sb_backup_bestanden() to service_role;

-- 5. Logboek van elke run (zodat te controleren is of de backup draait).
create table if not exists workflow.backup_log (
  id bigserial primary key,
  gemaakt_op timestamptz not null default now(),
  soort text not null,
  ok boolean not null,
  uitkomst jsonb
);
alter table workflow.backup_log enable row level security;

create or replace function public.sb_backup_log(p_soort text, p_ok boolean, p_uitkomst jsonb)
returns void
language sql
security definer
set search_path = public, pg_catalog
as $$
  insert into workflow.backup_log (soort, ok, uitkomst) values (p_soort, p_ok, p_uitkomst);
  delete from workflow.backup_log where gemaakt_op < now() - interval '90 days';
$$;
revoke all on function public.sb_backup_log(text, boolean, jsonb) from public, anon, authenticated;
grant execute on function public.sb_backup_log(text, boolean, jsonb) to service_role;

-- 6. Google Drive-koppeling: refresh token opgeslagen via /api/backup/koppelen
--    (gaat zelf NIET mee in de backup).
create table if not exists workflow.drive_koppeling (
  id int primary key default 1 check (id = 1),
  refresh_token text not null,
  scope text,
  bijgewerkt_op timestamptz not null default now()
);
alter table workflow.drive_koppeling enable row level security;
revoke all on workflow.drive_koppeling from public, anon, authenticated;

create or replace function public.sb_drive_token_get()
returns text language sql security definer set search_path = public, pg_catalog
as $$ select refresh_token from workflow.drive_koppeling where id = 1; $$;

create or replace function public.sb_drive_token_set(p_token text, p_scope text)
returns void language sql security definer set search_path = public, pg_catalog
as $$
  insert into workflow.drive_koppeling (id, refresh_token, scope, bijgewerkt_op)
  values (1, p_token, p_scope, now())
  on conflict (id) do update set refresh_token = excluded.refresh_token, scope = excluded.scope, bijgewerkt_op = now();
$$;
revoke all on function public.sb_drive_token_get() from public, anon, authenticated;
revoke all on function public.sb_drive_token_set(text, text) from public, anon, authenticated;
grant execute on function public.sb_drive_token_get() to service_role;
grant execute on function public.sb_drive_token_set(text, text) to service_role;

-- sb_backup_tabellen sluit sindsdien ook workflow.drive_koppeling uit:
create or replace function public.sb_backup_tabellen()
returns jsonb
language sql
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(jsonb_agg(jsonb_build_object('schema', n.nspname, 'tabel', c.relname)
                            order by n.nspname, c.relname), '[]'::jsonb)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p')
    and n.nspname in ('public', 'workflow')
    and not (n.nspname = 'public' and c.relname = 'ops_secrets')
    and not (n.nspname = 'workflow' and c.relname = 'drive_koppeling');
$$;
