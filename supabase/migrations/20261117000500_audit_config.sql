-- Domzli · Fase 1 · Auditoría y configuración de la app.

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete restrict,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (organization_id, entity_type, entity_id, created_at desc);

-- La auditoría es de solo anexar.
create or replace function private.tg_audit_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'AUDIT_LOG_IMMUTABLE' using errcode = 'P0001';
end;
$$;

create trigger audit_logs_immutable before update or delete on public.audit_logs
  for each row execute function private.tg_audit_immutable();

-- Registro genérico de cambios de fila.
create or replace function private.tg_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_row jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, old_data, new_data)
  values (
    (v_row ->> 'organization_id')::uuid,
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    (v_row ->> 'id')::uuid,
    v_old,
    v_new
  );
  return null;
end;
$$;

create trigger leases_audit after insert or update or delete on public.leases
  for each row execute function private.tg_audit();
create trigger memberships_audit after insert or update or delete on public.memberships
  for each row execute function private.tg_audit();
create trigger properties_audit after insert or update or delete on public.properties
  for each row execute function private.tg_audit();
create trigger tenants_audit after insert or update or delete on public.tenants
  for each row execute function private.tg_audit();

-- Versión mínima soportada de la app (actualización obligatoria).
create table public.app_config (
  platform text primary key check (platform in ('ios', 'android', 'web')),
  min_supported_version text not null default '0.1.0',
  updated_at timestamptz not null default now()
);
insert into public.app_config (platform) values ('ios'), ('android'), ('web');
