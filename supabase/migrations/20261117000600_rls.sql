-- Domzli · Fase 1 · Autorización: helpers, privilegios y políticas RLS.
-- Denegar por defecto: RLS en todas las tablas y privilegios explícitos por tabla.

-- ---------- Helpers (esquema private, no expuesto por la API) ----------

-- Organizaciones donde el usuario actual es owner o admin activo.
create or replace function private.staff_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.role in ('owner', 'admin');
$$;

create or replace function private.owner_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.status = 'active'
    and m.role = 'owner';
$$;

create or replace function private.member_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organization_id
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.status = 'active';
$$;

-- Contratos (no borradores) del usuario actual como inquilino vinculado y con acceso.
create or replace function private.tenant_lease_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select lt.lease_id
  from public.lease_tenants lt
  join public.tenants t on t.id = lt.tenant_id
  join public.leases l on l.id = lt.lease_id
  join public.memberships m on m.organization_id = t.organization_id and m.user_id = t.profile_id
  where t.profile_id = (select auth.uid())
    and m.role = 'tenant'
    and m.status = 'active'
    and l.status <> 'draft'
    and lt.portal_access;
$$;

create or replace function private.tenant_property_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select l.property_id
  from public.leases l
  where l.id in (select private.tenant_lease_ids());
$$;

-- Perfiles visibles para el staff: miembros de sus organizaciones.
create or replace function private.staff_visible_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id
  from public.memberships m
  where m.organization_id in (select private.staff_org_ids());
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.lease_tenants enable row level security;
alter table public.documents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_config enable row level security;

-- ---------- Privilegios: se parte de cero ----------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.app_config to anon, authenticated;
grant select on public.profiles, public.organizations, public.memberships, public.invitations,
  public.audit_logs to authenticated;
grant update (full_name, phone, data_consent_version, data_consent_at) on public.profiles to authenticated;
grant update (name, tax_id) on public.organizations to authenticated;
grant select, insert, update on public.properties, public.tenants, public.documents to authenticated;
grant select, insert, update, delete on public.property_photos, public.leases, public.lease_tenants to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ---------- Políticas ----------

-- app_config: lectura pública.
create policy app_config_select on public.app_config
  for select to anon, authenticated using (true);

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or id in (select private.staff_visible_profile_ids()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organizations: se crean con create_organization(); no se borran.
create policy organizations_select on public.organizations
  for select to authenticated
  using (id in (select private.member_org_ids()));
create policy organizations_update_owner on public.organizations
  for update to authenticated
  using (id in (select private.owner_org_ids()))
  with check (id in (select private.owner_org_ids()));

-- memberships: escritura solo mediante RPC.
create policy memberships_select on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or organization_id in (select private.staff_org_ids()));

-- invitations: escritura solo mediante RPC.
create policy invitations_select on public.invitations
  for select to authenticated
  using (organization_id in (select private.staff_org_ids()));

-- properties: se archivan, no se borran.
create policy properties_select on public.properties
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or id in (select private.tenant_property_ids())
  );
create policy properties_insert on public.properties
  for insert to authenticated
  with check (organization_id in (select private.staff_org_ids()));
create policy properties_update on public.properties
  for update to authenticated
  using (organization_id in (select private.staff_org_ids()))
  with check (organization_id in (select private.staff_org_ids()));

-- property_photos
create policy property_photos_select on public.property_photos
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or property_id in (select private.tenant_property_ids())
  );
create policy property_photos_insert on public.property_photos
  for insert to authenticated
  with check (organization_id in (select private.staff_org_ids()));
create policy property_photos_update on public.property_photos
  for update to authenticated
  using (organization_id in (select private.staff_org_ids()))
  with check (organization_id in (select private.staff_org_ids()));
create policy property_photos_delete on public.property_photos
  for delete to authenticated
  using (organization_id in (select private.staff_org_ids()));

-- tenants: el inquilino ve su ficha; sus datos los edita en profiles.
create policy tenants_select on public.tenants
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or profile_id = (select auth.uid())
  );
create policy tenants_insert on public.tenants
  for insert to authenticated
  with check (organization_id in (select private.staff_org_ids()) and profile_id is null);
create policy tenants_update on public.tenants
  for update to authenticated
  using (organization_id in (select private.staff_org_ids()))
  with check (organization_id in (select private.staff_org_ids()));

-- leases: el staff solo escribe borradores; las transiciones son RPC.
create policy leases_select on public.leases
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or id in (select private.tenant_lease_ids())
  );
create policy leases_insert_draft on public.leases
  for insert to authenticated
  with check (status = 'draft' and organization_id in (select private.staff_org_ids()));
create policy leases_update_draft on public.leases
  for update to authenticated
  using (status = 'draft' and organization_id in (select private.staff_org_ids()))
  with check (status = 'draft' and organization_id in (select private.staff_org_ids()));
create policy leases_delete_draft on public.leases
  for delete to authenticated
  using (status = 'draft' and organization_id in (select private.staff_org_ids()));

-- lease_tenants: solo se modifican mientras el contrato es borrador.
create or replace function private.staff_draft_lease_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select l.id
  from public.leases l
  where l.status = 'draft'
    and l.organization_id in (select private.staff_org_ids());
$$;
revoke execute on function private.staff_draft_lease_ids() from public, anon;
grant execute on function private.staff_draft_lease_ids() to authenticated, service_role;

create policy lease_tenants_select on public.lease_tenants
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or lease_id in (select private.tenant_lease_ids())
  );
create policy lease_tenants_insert on public.lease_tenants
  for insert to authenticated
  with check (lease_id in (select private.staff_draft_lease_ids()));
create policy lease_tenants_update on public.lease_tenants
  for update to authenticated
  using (lease_id in (select private.staff_draft_lease_ids()))
  with check (lease_id in (select private.staff_draft_lease_ids()));
create policy lease_tenants_delete on public.lease_tenants
  for delete to authenticated
  using (lease_id in (select private.staff_draft_lease_ids()));

-- documents: el inquilino ve los compartidos de su contrato.
create policy documents_select on public.documents
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or (visibility = 'shared' and archived_at is null and lease_id in (select private.tenant_lease_ids()))
  );
create policy documents_insert on public.documents
  for insert to authenticated
  with check (organization_id in (select private.staff_org_ids()));
create policy documents_update on public.documents
  for update to authenticated
  using (organization_id in (select private.staff_org_ids()))
  with check (organization_id in (select private.staff_org_ids()));

-- audit_logs: lectura para el staff; nadie escribe desde el cliente.
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (organization_id in (select private.staff_org_ids()));

-- ---------- Guardas adicionales ----------

-- Nadie cambia su propia membresía, ni siquiera a través de una función.
create or replace function private.tg_membership_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.user_id = (select auth.uid())
     and (new.role is distinct from old.role or new.status is distinct from old.status)
     and coalesce(current_setting('domzli.allow_membership_restore', true), '') <> 'on' then
    raise exception 'CANNOT_CHANGE_OWN_MEMBERSHIP' using errcode = 'P0001';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'MEMBERSHIP_USER_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger memberships_guard before update on public.memberships
  for each row execute function private.tg_membership_guard();

-- El staff no vincula ni desvincula perfiles a mano: eso lo hace accept_invitation().
create or replace function private.tg_tenant_profile_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Desvincular (dejar en null) sí se permite: equivale a retirar el acceso.
  if new.profile_id is not null
     and new.profile_id is distinct from old.profile_id
     and coalesce(current_setting('domzli.allow_profile_link', true), '') <> 'on' then
    raise exception 'TENANT_PROFILE_LINK_FORBIDDEN' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger tenants_profile_guard before update of profile_id on public.tenants
  for each row execute function private.tg_tenant_profile_guard();

-- ---------- Vistas de lectura (aplican la RLS de quien consulta) ----------
create view public.v_lease_overview
with (security_invoker = true) as
select
  l.*,
  p.name as property_name,
  p.city as property_city,
  t.id as tenant_id,
  t.full_name as tenant_name,
  (l.end_date - private.today()) as days_to_end,
  (l.status = 'active' and l.end_date >= private.today() and l.end_date - private.today() <= 60) as is_expiring_soon,
  (l.status = 'active' and l.end_date < private.today()) as is_in_extension
from public.leases l
join public.properties p on p.id = l.property_id
left join public.lease_tenants lt on lt.lease_id = l.id and lt.role = 'primary'
left join public.tenants t on t.id = lt.tenant_id;

create view public.v_property_overview
with (security_invoker = true) as
select
  p.*,
  l.id as active_lease_id,
  l.monthly_rent as current_rent,
  l.end_date as lease_end_date,
  t.id as tenant_id,
  t.full_name as tenant_name
from public.properties p
left join public.leases l on l.property_id = p.id and l.status = 'active'
left join public.lease_tenants lt on lt.lease_id = l.id and lt.role = 'primary'
left join public.tenants t on t.id = lt.tenant_id;

revoke all on public.v_lease_overview, public.v_property_overview from anon, authenticated;
grant select on public.v_lease_overview, public.v_property_overview to authenticated, service_role;
