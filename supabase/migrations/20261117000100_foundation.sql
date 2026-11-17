-- Domzli · Fase 1 · Fundamentos: esquema privado, tipos y funciones utilitarias.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------- Tipos ----------
create type public.membership_role as enum ('owner', 'admin', 'tenant');
create type public.membership_status as enum ('active', 'suspended', 'revoked');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type public.property_type as enum ('apartment', 'house', 'studio', 'room', 'commercial', 'office', 'warehouse', 'lot', 'other');
create type public.property_status as enum ('available', 'leased', 'maintenance', 'inactive');
create type public.id_document_type as enum ('CC', 'CE', 'PA', 'PPT', 'NIT');
create type public.lease_use as enum ('residential', 'commercial');
create type public.lease_status as enum ('draft', 'active', 'terminated');
create type public.administration_mode as enum ('none', 'included', 'separate');
-- P-12: no se admiten depósitos en dinero; solo estas garantías.
create type public.guarantee_type as enum ('none', 'co_signer', 'insurance_policy');
create type public.increase_type as enum ('ipc', 'fixed_percentage', 'none');
create type public.lease_party_role as enum ('primary', 'co_tenant', 'guarantor');
create type public.document_kind as enum ('contract', 'addendum', 'inventory', 'id_copy', 'other');
create type public.document_visibility as enum ('staff_only', 'shared');

-- ---------- Utilidades ----------

-- Fecha de negocio: hoy en Colombia.
create or replace function private.today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Bogota')::date;
$$;

create or replace function private.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- organization_id no cambia después de insertar.
create or replace function private.tg_immutable_organization()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'ORGANIZATION_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
