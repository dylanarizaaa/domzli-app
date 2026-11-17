-- Utilidades para las pruebas pgTAP (solo en la base de pruebas).
create schema if not exists tests;
grant usage on schema tests, extensions to anon, authenticated, service_role;

create or replace function tests.create_user(p_email text, p_confirmed boolean default true)
returns uuid language plpgsql security definer as $$
declare v_id uuid;
begin
  insert into auth.users (email, email_confirmed_at, raw_user_meta_data)
  values (p_email, case when p_confirmed then now() end, jsonb_build_object('full_name', split_part(p_email, '@', 1)))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function tests.user_id(p_email text)
returns uuid language sql security definer as $$
  select id from auth.users where email = p_email;
$$;

-- Actúa como un usuario autenticado (igual que PostgREST: rol + claims del JWT).
create or replace function tests.login_as(p_email text)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', tests.user_id(p_email), 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end;
$$;

create or replace function tests.login_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end;
$$;

create or replace function tests.logout()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;
