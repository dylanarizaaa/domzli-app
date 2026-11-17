-- Domzli · Fase 1 · Comandos (RPC).
-- Convenciones: SECURITY DEFINER, search_path vacío, verificación explícita de usuario y rol,
-- bloqueo de filas, auditoría en la misma transacción y errores con código de máquina.

-- ---------- Organizaciones ----------

create or replace function public.create_organization(p_name text, p_tax_id text default null)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_org public.organizations;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;
  if coalesce(char_length(btrim(p_name)), 0) < 2 then
    raise exception 'ORGANIZATION_NAME_REQUIRED' using errcode = 'P0001';
  end if;

  insert into public.organizations (name, tax_id, created_by)
  values (btrim(p_name), nullif(btrim(p_tax_id), ''), v_user)
  returning * into v_org;

  insert into public.memberships (organization_id, user_id, role)
  values (v_org.id, v_user, 'owner');

  return v_org;
end;
$$;

-- Contextos (organización + rol) del usuario actual.
create or replace function public.my_contexts()
returns table (organization_id uuid, organization_name text, role public.membership_role)
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id, o.name, m.role
  from public.memberships m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = (select auth.uid())
    and m.status = 'active'
  order by m.created_at;
$$;

-- ---------- Invitaciones ----------

create or replace function private.hash_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

create or replace function public.create_invitation(p_tenant_id uuid)
returns table (invitation_id uuid, token text, email text, organization_name text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_tenant public.tenants;
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + interval '7 days';
  v_org_name text;
begin
  select * into v_tenant from public.tenants t where t.id = p_tenant_id for update;
  if not found then
    raise exception 'TENANT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_tenant.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_tenant.archived_at is not null then
    raise exception 'TENANT_ARCHIVED' using errcode = 'P0001';
  end if;
  if v_tenant.profile_id is not null then
    raise exception 'TENANT_ALREADY_LINKED' using errcode = 'P0001';
  end if;
  if coalesce(btrim(v_tenant.email), '') = '' or position('@' in v_tenant.email) = 0 then
    raise exception 'TENANT_EMAIL_REQUIRED' using errcode = 'P0001';
  end if;

  -- Una sola invitación pendiente por inquilino: la anterior se revoca.
  update public.invitations i set status = 'revoked'
  where i.tenant_id = p_tenant_id and i.status = 'pending';

  -- 244 bits aleatorios; en la base solo se guarda el hash.
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.invitations (organization_id, tenant_id, email, token_hash, expires_at, invited_by)
  values (v_tenant.organization_id, v_tenant.id, lower(btrim(v_tenant.email)), private.hash_token(v_token), v_expires, v_user)
  returning id into v_id;

  select o.name into v_org_name from public.organizations o where o.id = v_tenant.organization_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, new_data)
  values (v_tenant.organization_id, v_user, 'invitation.create', 'invitations', v_id,
          jsonb_build_object('tenant_id', v_tenant.id, 'email', lower(btrim(v_tenant.email))));

  return query select v_id, v_token, lower(btrim(v_tenant.email)), v_org_name, v_expires;
end;
$$;

-- Vista previa pública: solo organización, correo enmascarado y estado.
create or replace function public.get_invitation_preview(p_token text)
returns table (organization_name text, email_masked text, status public.invitation_status, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.name,
    left(i.email, 1) || '***' || substring(i.email from position('@' in i.email)),
    case when i.status = 'pending' and i.expires_at < now() then 'expired'::public.invitation_status else i.status end,
    i.expires_at
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = private.hash_token(p_token);
$$;

create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_inv public.invitations;
  v_email text;
  v_confirmed timestamptz;
  v_membership public.memberships;
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  select * into v_inv from public.invitations i
  where i.token_hash = private.hash_token(p_token)
  for update;
  if not found then
    raise exception 'INVITATION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'INVITATION_NOT_PENDING' using errcode = 'P0001';
  end if;
  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'INVITATION_EXPIRED' using errcode = 'P0001';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed from auth.users u where u.id = v_user;
  if v_confirmed is null then
    raise exception 'EMAIL_NOT_VERIFIED' using errcode = 'P0001';
  end if;
  if lower(v_email) <> lower(v_inv.email) then
    raise exception 'INVITATION_EMAIL_MISMATCH' using errcode = 'P0001';
  end if;

  select * into v_membership from public.memberships m
  where m.organization_id = v_inv.organization_id and m.user_id = v_user
  for update;

  if found then
    if v_membership.role <> 'tenant' then
      raise exception 'ALREADY_STAFF_MEMBER' using errcode = 'P0001';
    end if;
    if v_membership.status <> 'active' then
      perform set_config('domzli.allow_membership_restore', 'on', true);
      update public.memberships set status = 'active' where id = v_membership.id;
      perform set_config('domzli.allow_membership_restore', 'off', true);
    end if;
  else
    insert into public.memberships (organization_id, user_id, role)
    values (v_inv.organization_id, v_user, 'tenant');
  end if;

  perform set_config('domzli.allow_profile_link', 'on', true);
  update public.tenants set profile_id = v_user where id = v_inv.tenant_id and profile_id is null;
  if not found then
    raise exception 'TENANT_ALREADY_LINKED' using errcode = 'P0001';
  end if;
  perform set_config('domzli.allow_profile_link', 'off', true);

  update public.invitations
     set status = 'accepted', accepted_by = v_user, accepted_at = now()
   where id = v_inv.id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, new_data)
  values (v_inv.organization_id, v_user, 'invitation.accept', 'invitations', v_inv.id,
          jsonb_build_object('tenant_id', v_inv.tenant_id));

  return v_inv.organization_id;
end;
$$;

create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations;
begin
  select * into v_inv from public.invitations i where i.id = p_invitation_id for update;
  if not found then
    raise exception 'INVITATION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_inv.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'INVITATION_NOT_PENDING' using errcode = 'P0001';
  end if;

  update public.invitations set status = 'revoked' where id = p_invitation_id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id)
  values (v_inv.organization_id, (select auth.uid()), 'invitation.revoke', 'invitations', v_inv.id);
end;
$$;

create or replace function private.expire_invitations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.invitations set status = 'expired'
  where status = 'pending' and expires_at < now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------- Contratos ----------

create or replace function public.activate_lease(p_lease_id uuid)
returns public.leases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
  v_property public.properties;
  v_tenants integer;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id for update;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'draft' then
    raise exception 'LEASE_NOT_DRAFT' using errcode = 'P0001';
  end if;

  select * into v_property from public.properties p where p.id = v_lease.property_id for update;
  if v_property.archived_at is not null then
    raise exception 'PROPERTY_ARCHIVED' using errcode = 'P0001';
  end if;
  if v_property.status <> 'available' then
    raise exception 'PROPERTY_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select count(*) into v_tenants
  from public.lease_tenants lt
  join public.tenants t on t.id = lt.tenant_id
  where lt.lease_id = p_lease_id and lt.role = 'primary' and t.archived_at is null;
  if v_tenants <> 1 then
    raise exception 'LEASE_REQUIRES_ONE_TENANT' using errcode = 'P0001';
  end if;

  update public.leases
     set status = 'active', activated_at = now()
   where id = p_lease_id
  returning * into v_lease;

  update public.properties set status = 'leased' where id = v_lease.property_id;

  return v_lease;
end;
$$;

-- P-13: un contrato vencido sigue activo (en prórroga) hasta que se termina o se renueva.
create or replace function public.renew_lease(p_lease_id uuid, p_new_end_date date)
returns public.leases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id for update;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'active' then
    raise exception 'LEASE_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if p_new_end_date is null or p_new_end_date <= v_lease.end_date or p_new_end_date <= private.today() then
    raise exception 'INVALID_END_DATE' using errcode = 'P0001';
  end if;

  update public.leases set end_date = p_new_end_date where id = p_lease_id
  returning * into v_lease;
  return v_lease;
end;
$$;

create or replace function public.terminate_lease(p_lease_id uuid, p_terminated_on date, p_reason text)
returns public.leases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id for update;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'active' then
    raise exception 'LEASE_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if p_terminated_on is null or p_terminated_on < v_lease.start_date or p_terminated_on > private.today() then
    raise exception 'INVALID_TERMINATION_DATE' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'TERMINATION_REASON_REQUIRED' using errcode = 'P0001';
  end if;

  update public.leases
     set status = 'terminated', terminated_on = p_terminated_on, termination_reason = btrim(p_reason)
   where id = p_lease_id
  returning * into v_lease;

  update public.properties set status = 'available' where id = v_lease.property_id;

  return v_lease;
end;
$$;

-- ---------- Privilegios de ejecución ----------
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.my_contexts() to authenticated;
grant execute on function public.create_invitation(uuid) to authenticated;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.activate_lease(uuid) to authenticated;
grant execute on function public.renew_lease(uuid, date) to authenticated;
grant execute on function public.terminate_lease(uuid, date, text) to authenticated;
grant execute on all functions in schema public to service_role;

-- Las funciones futuras no quedan abiertas por defecto.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------- Tarea programada ----------
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('expire-invitations', '0 * * * *', 'select private.expire_invitations()');
  end if;
end;
$$;
