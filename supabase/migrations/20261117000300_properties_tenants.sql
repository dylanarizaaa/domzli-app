-- Domzli · Fase 1 · Inmuebles e inquilinos.

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  property_type public.property_type not null default 'apartment',
  address text not null,
  city text not null,
  department text,
  neighborhood text,
  stratum smallint check (stratum between 1 and 6),
  area_m2 numeric(8, 2) check (area_m2 > 0),
  bedrooms smallint check (bedrooms >= 0),
  bathrooms smallint check (bathrooms >= 0),
  parking_spaces smallint check (parking_spaces >= 0),
  administration_value numeric(14, 2) not null default 0 check (administration_value >= 0),
  status public.property_status not null default 'available',
  notes text,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);
create index properties_org_status_idx on public.properties (organization_id, status);

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  property_id uuid not null,
  storage_path text not null,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (organization_id, property_id) references public.properties (organization_id, id) on delete cascade
);
create index property_photos_property_idx on public.property_photos (property_id, position);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete set null,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  document_type public.id_document_type not null,
  document_number text not null check (char_length(btrim(document_number)) between 3 and 30),
  email text,
  phone text,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, document_type, document_number)
);
create index tenants_profile_idx on public.tenants (profile_id);
create unique index tenants_one_profile_per_org on public.tenants (organization_id, profile_id) where profile_id is not null;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  tenant_id uuid not null,
  email text not null,
  role public.membership_role not null default 'tenant' check (role = 'tenant'),
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (organization_id, tenant_id) references public.tenants (organization_id, id) on delete cascade
);
create unique index invitations_one_pending_per_tenant on public.invitations (tenant_id) where status = 'pending';
create index invitations_org_idx on public.invitations (organization_id, status);

create trigger properties_set_updated_at before update on public.properties
  for each row execute function private.tg_set_updated_at();
create trigger properties_immutable_org before update on public.properties
  for each row execute function private.tg_immutable_organization();
create trigger tenants_set_updated_at before update on public.tenants
  for each row execute function private.tg_set_updated_at();
create trigger tenants_immutable_org before update on public.tenants
  for each row execute function private.tg_immutable_organization();
