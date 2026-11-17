-- Domzli · Fase 1 · Identidad: organizaciones, perfiles, membresías e invitaciones.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  data_consent_version text,
  data_consent_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  tax_id text,
  currency char(3) not null default 'COP',
  timezone text not null default 'America/Bogota',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_user_status_idx on public.memberships (user_id, status);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.tg_set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function private.tg_set_updated_at();
create trigger memberships_set_updated_at before update on public.memberships
  for each row execute function private.tg_set_updated_at();
create trigger memberships_immutable_org before update on public.memberships
  for each row execute function private.tg_immutable_organization();

-- Perfil automático al registrarse; el correo se sincroniza desde Auth.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, data_consent_version, data_consent_at)
  values (
    new.id,
    coalesce(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    new.email,
    new.raw_user_meta_data ->> 'data_consent_version',
    case when new.raw_user_meta_data ->> 'data_consent_version' is not null then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function private.handle_user_email_change();
