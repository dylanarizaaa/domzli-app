-- Aislamiento entre organizaciones y por rol (Q1 del TAD).
begin;
set search_path to public, extensions;
select plan(24);

create temp table ids (k text primary key, id uuid);
grant all on ids to public;

select tests.create_user('ana@a.co');    -- owner de la organización A
select tests.create_user('admin@a.co');  -- admin de A
select tests.create_user('beto@b.co');   -- owner de la organización B
select tests.create_user('juan@t.co');   -- inquilino en A
select tests.create_user('nadie@x.co');  -- sin membresías

-- Organización A
select tests.login_as('ana@a.co');
insert into ids select 'orgA', (create_organization('Inmuebles Ana')).id;
insert into properties (organization_id, name, address, city)
  select id, 'Apto 301', 'Cra 70 # 44-21', 'Medellín' from ids where k = 'orgA';
insert into properties (organization_id, name, address, city)
  select id, 'Casa 12', 'Calle 37 Sur # 27-15', 'Envigado' from ids where k = 'orgA';
insert into ids select 'A1', p.id from properties p where p.name = 'Apto 301';
insert into tenants (organization_id, full_name, document_type, document_number, email)
  select id, 'Juan Pérez', 'CC', '1020304050', 'juan@t.co' from ids where k = 'orgA';
insert into ids select 'juan', t.id from tenants t where t.full_name = 'Juan Pérez';
insert into leases (organization_id, property_id, start_date, end_date, monthly_rent)
  select (select id from ids where k = 'orgA'), (select id from ids where k = 'A1'), '2026-02-01', '2027-01-31', 1250000;
insert into ids select 'leaseA', l.id from leases l;
insert into lease_tenants (lease_id, tenant_id, organization_id)
  select (select id from ids where k = 'leaseA'), (select id from ids where k = 'juan'), (select id from ids where k = 'orgA');
select tests.logout();

-- Admin de A (la gestión de miembros llega en la Fase 4; aquí se inserta directo)
insert into memberships (organization_id, user_id, role)
  select (select id from ids where k = 'orgA'), tests.user_id('admin@a.co'), 'admin';

-- Organización B
select tests.login_as('beto@b.co');
insert into ids select 'orgB', (create_organization('Inmobiliaria Beto')).id;
insert into properties (organization_id, name, address, city)
  select id, 'Local 4', 'Calle 10 # 5-20', 'Bogotá' from ids where k = 'orgB';
insert into ids select 'B1', p.id from properties p where p.name = 'Local 4';
insert into tenants (organization_id, full_name, document_type, document_number)
  select id, 'Pedro Gil', 'CC', '900800700' from ids where k = 'orgB';
select tests.logout();

-- ── Staff: solo su organización ──
select tests.login_as('ana@a.co');
select is((select count(*) from properties), 2::bigint, 'ana ve solo los 2 inmuebles de A');
select is((select count(*) from tenants), 1::bigint, 'ana ve solo los inquilinos de A');
select is((select count(*) from organizations), 1::bigint, 'ana ve solo su organización');
select throws_ok(
  $$ insert into properties (organization_id, name, address, city) select id, 'Intruso', 'x', 'y' from ids where k = 'orgB' $$,
  '42501', null, 'ana no puede crear inmuebles en B');
update properties set name = 'Hackeado' where id = (select id from ids where k = 'B1');
select tests.logout();
select is((select name from properties where id = (select id from ids where k = 'B1')), 'Local 4', 'ana no puede editar inmuebles de B');

select tests.login_as('ana@a.co');
select throws_ok(
  $$ insert into memberships (organization_id, user_id, role) select (select id from ids where k = 'orgB'), tests.user_id('ana@a.co'), 'owner' $$,
  '42501', null, 'nadie escribe membresías directamente');
select throws_ok(
  $$ update memberships set role = 'admin' where user_id = tests.user_id('ana@a.co') $$,
  '42501', null, 'nadie actualiza membresías directamente');
select throws_ok(
  $$ insert into audit_logs (action, entity_type) values ('x', 'y') $$,
  '42501', null, 'nadie escribe la auditoría desde el cliente');
select throws_ok(
  $$ update leases set status = 'active' where id = (select id from ids where k = 'leaseA') $$,
  '42501', null, 'un contrato no se activa con UPDATE directo');
select throws_ok(
  $$ update properties set status = 'leased' where id = (select id from ids where k = 'A1') $$,
  'P0001', 'PROPERTY_NOT_LEASED', 'un inmueble no se marca arrendado sin contrato activo');
select throws_ok(
  $$ insert into lease_tenants (lease_id, tenant_id, organization_id)
     select (select id from ids where k = 'leaseA'), t.id, t.organization_id from tenants t where false
     union all
     select (select id from ids where k = 'leaseA'), (select id from ids where k = 'juan'), (select id from ids where k = 'orgA') $$,
  '23505', null, 'P-3: un solo inquilino por contrato');
select tests.logout();

-- ── Admin: opera, pero no modifica la organización ──
select tests.login_as('admin@a.co');
select is((select count(*) from properties), 2::bigint, 'el admin ve los inmuebles de A');
update organizations set name = 'Renombrada';
select tests.logout();
select is((select name from organizations where id = (select id from ids where k = 'orgA')), 'Inmuebles Ana', 'el admin no puede renombrar la organización');

-- ── Inquilino sin vincular y usuario sin membresías ──
select tests.login_as('juan@t.co');
select is((select count(*) from properties), 0::bigint, 'el inquilino sin vincular no ve inmuebles');
select is((select count(*) from leases), 0::bigint, 'el inquilino sin vincular no ve contratos');
select tests.logout();

select tests.login_as('nadie@x.co');
select is((select count(*) from properties) + (select count(*) from tenants) + (select count(*) from leases)
        + (select count(*) from organizations) + (select count(*) from memberships), 0::bigint,
  'un usuario sin membresías no ve nada');
select tests.logout();

-- ── Inquilino vinculado: solo su contrato ──
select tests.login_as('ana@a.co');
create temp table inv as select * from create_invitation((select id from ids where k = 'juan'));
grant all on inv to public;
select activate_lease((select id from ids where k = 'leaseA'));
select tests.logout();

select tests.login_as('juan@t.co');
select accept_invitation((select token from inv));
select is((select count(*) from leases), 1::bigint, 'el inquilino ve su contrato');
select is((select array_agg(name) from properties), array['Apto 301'], 'el inquilino ve solo su inmueble');
select is((select count(*) from tenants), 1::bigint, 'el inquilino ve solo su ficha');
select throws_ok(
  $$ insert into properties (organization_id, name, address, city) select id, 'X', 'x', 'y' from ids where k = 'orgA' $$,
  '42501', null, 'el inquilino no crea inmuebles');
select throws_ok(
  $$ select create_invitation((select id from ids where k = 'juan')) $$,
  '42501', 'FORBIDDEN', 'el inquilino no puede invitar');
select throws_ok(
  $$ select terminate_lease((select id from ids where k = 'leaseA'), current_date, 'porque sí') $$,
  '42501', 'FORBIDDEN', 'el inquilino no puede terminar el contrato');
select is((select count(*) from audit_logs), 0::bigint, 'el inquilino no ve la auditoría');
select tests.logout();

-- ── Anónimo ──
select tests.login_anon();
select throws_ok($$ select count(*) from properties $$, '42501', null, 'anon no tiene acceso a las tablas');
select tests.logout();

select * from finish();
rollback;
