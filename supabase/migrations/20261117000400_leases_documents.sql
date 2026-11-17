-- Domzli · Fase 1 · Contratos, participantes y documentos.

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  property_id uuid not null,
  lease_use public.lease_use not null default 'residential',
  status public.lease_status not null default 'draft',
  start_date date not null,
  end_date date not null,
  monthly_rent numeric(14, 2) not null check (monthly_rent > 0),
  administration_mode public.administration_mode not null default 'separate',
  administration_value numeric(14, 2) not null default 0 check (administration_value >= 0),
  payment_day smallint not null default 5 check (payment_day between 1 and 31),
  guarantee_type public.guarantee_type not null default 'none',
  increase_type public.increase_type not null default 'ipc',
  annual_increase_percentage numeric(5, 2) check (annual_increase_percentage between 0 and 100),
  notes text,
  activated_at timestamptz,
  terminated_on date,
  termination_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, property_id) references public.properties (organization_id, id) on delete restrict,
  check (end_date > start_date),
  check (increase_type <> 'fixed_percentage' or annual_increase_percentage is not null)
);
-- Un inmueble no puede tener dos contratos activos.
create unique index leases_one_active_per_property on public.leases (property_id) where status = 'active';
create index leases_org_status_idx on public.leases (organization_id, status);

create table public.lease_tenants (
  lease_id uuid not null,
  tenant_id uuid not null,
  organization_id uuid not null,
  role public.lease_party_role not null default 'primary',
  portal_access boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (lease_id, tenant_id),
  foreign key (organization_id, lease_id) references public.leases (organization_id, id) on delete cascade,
  foreign key (organization_id, tenant_id) references public.tenants (organization_id, id) on delete restrict
);
-- P-3 (MVP): un solo inquilino por contrato. Quitar este índice para admitir cotitulares o codeudores.
create unique index lease_tenants_one_per_lease on public.lease_tenants (lease_id);
create index lease_tenants_tenant_idx on public.lease_tenants (tenant_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  property_id uuid,
  lease_id uuid,
  tenant_id uuid,
  kind public.document_kind not null default 'other',
  title text not null check (char_length(btrim(title)) between 1 and 160),
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes >= 0),
  visibility public.document_visibility not null default 'staff_only',
  uploaded_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (organization_id, property_id) references public.properties (organization_id, id) on delete restrict,
  foreign key (organization_id, lease_id) references public.leases (organization_id, id) on delete restrict,
  foreign key (organization_id, tenant_id) references public.tenants (organization_id, id) on delete restrict,
  check (num_nonnulls(property_id, lease_id, tenant_id) >= 1)
);
create index documents_lease_idx on public.documents (lease_id);
create index documents_property_idx on public.documents (property_id);

create trigger leases_set_updated_at before update on public.leases
  for each row execute function private.tg_set_updated_at();
create trigger leases_immutable_org before update on public.leases
  for each row execute function private.tg_immutable_organization();

-- El estado "leased" de un inmueble siempre coincide con la existencia de un contrato activo.
create or replace function private.tg_property_status_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_has_active boolean;
begin
  if tg_op = 'INSERT' then
    if new.status = 'leased' then
      raise exception 'PROPERTY_NOT_LEASED' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    select exists (
      select 1 from public.leases l where l.property_id = new.id and l.status = 'active'
    ) into v_has_active;

    if v_has_active and new.status <> 'leased' then
      raise exception 'PROPERTY_HAS_ACTIVE_LEASE' using errcode = 'P0001';
    end if;
    if not v_has_active and new.status = 'leased' then
      raise exception 'PROPERTY_NOT_LEASED' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger properties_status_guard before insert or update of status on public.properties
  for each row execute function private.tg_property_status_guard();
