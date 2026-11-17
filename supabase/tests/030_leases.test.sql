-- Contratos: activación, unicidad, prórroga (P-13), renovación, terminación y auditoría.
begin;
set search_path to public, extensions;
select plan(18);

create temp table ids (k text primary key, id uuid);
grant all on ids to public;

select tests.create_user('ana@a.co');
select tests.login_as('ana@a.co');
insert into ids select 'org', (create_organization('Inmuebles Ana')).id;
insert into properties (organization_id, name, address, city)
  select id, 'Apto 301', 'Cra 70', 'Medellín' from ids where k = 'org';
insert into ids select 'prop', id from properties;
insert into tenants (organization_id, full_name, document_type, document_number)
  select id, 'Juan Pérez', 'CC', '1001' from ids where k = 'org';
insert into tenants (organization_id, full_name, document_type, document_number)
  select id, 'María Gómez', 'CC', '1002' from ids where k = 'org';
insert into ids select 'juan', id from tenants where document_number = '1001';
insert into ids select 'maria', id from tenants where document_number = '1002';

-- Contrato ya vencido en el calendario: debe poder seguir activo (prórroga).
insert into leases (organization_id, property_id, start_date, end_date, monthly_rent)
  select (select id from ids where k = 'org'), (select id from ids where k = 'prop'), '2024-01-01', '2024-12-31', 1250000;
insert into ids select 'lease1', id from leases;

select throws_ok($$ select activate_lease((select id from ids where k = 'lease1')) $$,
  'P0001', 'LEASE_REQUIRES_ONE_TENANT', 'no se activa un contrato sin inquilino');

insert into lease_tenants (lease_id, tenant_id, organization_id)
  select (select id from ids where k = 'lease1'), (select id from ids where k = 'juan'), (select id from ids where k = 'org');
select throws_ok(
  $$ insert into lease_tenants (lease_id, tenant_id, organization_id)
     select (select id from ids where k = 'lease1'), (select id from ids where k = 'maria'), (select id from ids where k = 'org') $$,
  '23505', null, 'P-3: no se agrega un segundo inquilino al contrato');
select is((activate_lease((select id from ids where k = 'lease1'))).status, 'active'::lease_status, 'el borrador se activa');
select is((select status from properties), 'leased'::property_status, 'el inmueble pasa a arrendado');
select throws_ok($$ select activate_lease((select id from ids where k = 'lease1')) $$,
  'P0001', 'LEASE_NOT_DRAFT', 'no se activa dos veces');
update leases set monthly_rent = 1 where id = (select id from ids where k = 'lease1');
select is((select monthly_rent from leases where id = (select id from ids where k = 'lease1')), 1250000::numeric,
  'un contrato activo no se edita directamente');
select throws_ok(
  $$ update properties set status = 'available' where id = (select id from ids where k = 'prop') $$,
  'P0001', 'PROPERTY_HAS_ACTIVE_LEASE', 'el inmueble no se libera con contrato activo');

-- Segundo contrato sobre el mismo inmueble
insert into leases (organization_id, property_id, start_date, end_date, monthly_rent)
  select (select id from ids where k = 'org'), (select id from ids where k = 'prop'), '2026-01-01', '2026-12-31', 900000;
insert into ids select 'lease2', id from leases where status = 'draft';
insert into lease_tenants (lease_id, tenant_id, organization_id)
  select (select id from ids where k = 'lease2'), (select id from ids where k = 'maria'), (select id from ids where k = 'org');
select throws_ok($$ select activate_lease((select id from ids where k = 'lease2')) $$,
  'P0001', 'PROPERTY_NOT_AVAILABLE', 'un inmueble no admite dos contratos activos');

-- P-13: prórroga y renovación
select ok((select is_in_extension from v_lease_overview where id = (select id from ids where k = 'lease1')),
  'un contrato vencido sin terminar queda en prórroga');
select throws_ok($$ select renew_lease((select id from ids where k = 'lease1'), '2024-06-30') $$,
  'P0001', 'INVALID_END_DATE', 'la renovación exige una fecha posterior');
select is((renew_lease((select id from ids where k = 'lease1'), (current_date + 365))).end_date, current_date + 365,
  'el contrato se renueva');
select ok(not (select is_in_extension from v_lease_overview where id = (select id from ids where k = 'lease1')),
  'tras renovar deja de estar en prórroga');

-- Terminación
select throws_ok($$ select terminate_lease((select id from ids where k = 'lease1'), current_date - 1, '  ') $$,
  'P0001', 'TERMINATION_REASON_REQUIRED', 'terminar exige un motivo');
select is((terminate_lease((select id from ids where k = 'lease1'), current_date - 1, 'Entrega del inmueble')).status,
  'terminated'::lease_status, 'el contrato se termina');
select is((select status from properties), 'available'::property_status, 'el inmueble vuelve a disponible');
select is((select count(*) from leases where status = 'terminated'), 1::bigint, 'el historial del contrato se conserva');
select ok((select count(*) from audit_logs where entity_type = 'leases') >= 4, 'los cambios del contrato quedan auditados');
select tests.logout();

select throws_ok($$ update audit_logs set action = 'x' $$, 'P0001', 'AUDIT_LOG_IMMUTABLE', 'la auditoría no se modifica');

select * from finish();
rollback;
