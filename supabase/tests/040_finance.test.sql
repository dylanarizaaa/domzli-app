-- Fase 2: generación de cobros, pagos, revisión, reversión, anulación y reajustes.
begin;
set search_path to public, extensions;
select plan(39);

create temp table ids (k text primary key, id uuid);
create temp table pays (k text primary key, id uuid);
grant all on ids, pays to public;

select tests.create_user('ana@a.co');
select tests.create_user('juan@t.co');
select tests.create_user('beto@b.co');

select tests.login_as('beto@b.co');
insert into ids select 'orgB', (create_organization('Inmobiliaria Beto')).id;
select tests.logout();

select tests.login_as('ana@a.co');
insert into ids select 'org', (create_organization('Inmuebles Ana')).id;
insert into properties (organization_id, name, address, city) select id, 'Apto 301', 'Cra 70', 'Medellín' from ids where k = 'org';
insert into properties (organization_id, name, address, city) select id, 'Casa 12', 'Calle 37', 'Envigado' from ids where k = 'org';
insert into properties (organization_id, name, address, city) select id, 'Local 4', 'Calle 10', 'Bogotá' from ids where k = 'org';
insert into ids select 'p1', id from properties where name = 'Apto 301';
insert into ids select 'p2', id from properties where name = 'Casa 12';
insert into ids select 'p3', id from properties where name = 'Local 4';
insert into tenants (organization_id, full_name, document_type, document_number, email)
  select id, 'Juan Pérez', 'CC', '1001', 'juan@t.co' from ids where k = 'org';
insert into tenants (organization_id, full_name, document_type, document_number)
  select id, 'María Gómez', 'CC', '1002' from ids where k = 'org';
insert into tenants (organization_id, full_name, document_type, document_number)
  select id, 'Carlos Ríos', 'CC', '1003' from ids where k = 'org';
insert into ids select 'juan', id from tenants where document_number = '1001';
insert into ids select 'maria', id from tenants where document_number = '1002';
insert into ids select 'carlos', id from tenants where document_number = '1003';

-- Contrato 1: empieza a mitad de enero; administración aparte.
insert into leases (organization_id, property_id, start_date, end_date, monthly_rent, administration_mode, administration_value, payment_day)
  select (select id from ids where k = 'org'), (select id from ids where k = 'p1'), '2026-01-15', '2027-01-14', 1000000, 'separate', 200000, 5;
insert into ids select 'l1', id from leases where property_id = (select id from ids where k = 'p1');
insert into lease_tenants (lease_id, tenant_id, organization_id)
  select (select id from ids where k = 'l1'), (select id from ids where k = 'juan'), (select id from ids where k = 'org');
create temp table inv as select * from create_invitation((select id from ids where k = 'juan'));
grant all on inv to public;
select activate_lease((select id from ids where k = 'l1'));

-- Contrato 2: para probar la terminación.
insert into leases (organization_id, property_id, start_date, end_date, monthly_rent, administration_mode)
  select (select id from ids where k = 'org'), (select id from ids where k = 'p2'), '2026-01-01', '2026-12-31', 800000, 'none';
insert into ids select 'l2', id from leases where property_id = (select id from ids where k = 'p2');
insert into lease_tenants (lease_id, tenant_id, organization_id)
  select (select id from ids where k = 'l2'), (select id from ids where k = 'maria'), (select id from ids where k = 'org');
select activate_lease((select id from ids where k = 'l2'));

-- Contrato 3: contrato antiguo que empieza a cobrarse en Domzli desde noviembre de 2026.
insert into leases (organization_id, property_id, start_date, end_date, monthly_rent, administration_mode, billing_start_date, lease_use)
  select (select id from ids where k = 'org'), (select id from ids where k = 'p3'), '2025-01-01', '2027-12-31', 3000000, 'none', '2026-11-01', 'commercial';
insert into ids select 'l3', id from leases where property_id = (select id from ids where k = 'p3');
insert into lease_tenants (lease_id, tenant_id, organization_id)
  select (select id from ids where k = 'l3'), (select id from ids where k = 'carlos'), (select id from ids where k = 'org');
select activate_lease((select id from ids where k = 'l3'));

-- ── Generación ──
select is(
  (select row(period_end, due_date, total_amount, description)::text from charges
    where lease_id = (select id from ids where k = 'l1') and period_start = '2026-01-15'),
  row('2026-01-31'::date, '2026-01-15'::date, 658064.00::numeric(14,2), 'Enero 2026'::text)::text,
  'el primer mes se prorratea por días (17 de 31) y vence al inicio');
select is(
  (select array_agg(ci.description order by ci.concept) from charge_items ci join charges c on c.id = ci.charge_id
    where c.lease_id = (select id from ids where k = 'l1') and c.period_start = '2026-01-15'),
  array['Canon enero 2026 (17 días)', 'Administración enero 2026 (17 días)'],
  'el cobro detalla canon y administración');
select is(
  (select row(due_date, total_amount)::text from charges where lease_id = (select id from ids where k = 'l1') and period_start = '2026-02-01'),
  row('2026-02-05'::date, 1200000.00::numeric(14,2))::text,
  'los meses completos vencen el día de pago');
select is(
  (select min(period_start) from charges where lease_id = (select id from ids where k = 'l3')),
  '2026-11-01'::date, 'un contrato antiguo solo se cobra desde su inicio de cobro');

create temp table before_count as select count(*) as n from charges;
grant all on before_count to public;
select is(generate_due_charges((select id from ids where k = 'org')), 0, 'volver a generar no crea cobros');
select is((select count(*) from charges), (select n from before_count), 'la generación es idempotente');
select tests.logout();

select tests.login_as('beto@b.co');
select is((select count(*) from charges) + (select count(*) from payments), 0::bigint, 'otra organización no ve cobros ni pagos');
select throws_ok($$ select generate_due_charges((select id from ids where k = 'org')) $$, '42501', 'FORBIDDEN',
  'otra organización no genera cobros ajenos');
select tests.logout();

-- ── Inquilino reporta ──
select tests.login_as('juan@t.co');
select accept_invitation((select token from inv));
select ok((select count(*) from charges) > 0, 'el inquilino ve sus cobros');
select is((select count(distinct lease_id) from v_charge_balances), 1::bigint, 'el inquilino solo ve los cobros de su contrato');
select throws_ok(
  $$ insert into charges (organization_id, lease_id, period_start, period_end, due_date) select (select id from ids where k = 'org'), (select id from ids where k = 'l1'), current_date, current_date, current_date $$,
  '42501', null, 'nadie escribe cobros directamente');
select throws_ok(
  $$ select report_payment((select id from ids where k = 'l1'), 1000000, current_date, 'bank_transfer') $$,
  'P0001', 'RECEIPT_REQUIRED', 'el inquilino debe adjuntar comprobante');
select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('payment-receipts', (select id from ids where k = 'org') || '/leases/' || gen_random_uuid() || '/payments/x.jpg') $$,
  '42501', null, 'el inquilino no sube comprobantes a otro contrato');
insert into storage.objects (bucket_id, name)
  values ('payment-receipts', (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/r1.jpg');
select throws_ok(
  $$ select report_payment((select id from ids where k = 'l1'), 1000000, current_date, 'bank_transfer', null,
       (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/otro.jpg') $$,
  'P0001', 'RECEIPT_NOT_FOUND', 'el comprobante debe existir en Storage');
select throws_ok(
  $$ select report_payment((select id from ids where k = 'l1'), 999999999, current_date, 'bank_transfer', null,
       (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/r1.jpg') $$,
  'P0001', 'PAYMENT_EXCEEDS_BALANCE', 'P-4: no se paga más de lo pendiente');
insert into pays select 'p1', (report_payment((select id from ids where k = 'l1'), 1000000, current_date, 'bre_b', '84731205',
  (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/r1.jpg')).id;
select is((select status from payments where id = (select id from pays where k = 'p1')), 'in_review'::payment_status,
  'el reporte del inquilino queda en revisión');
select is(
  (select array_agg(pa.allocated_amount order by c.due_date) from payment_allocations pa join charges c on c.id = pa.charge_id
    where pa.payment_id = (select id from pays where k = 'p1')),
  array[658064.00, 341936.00]::numeric[], 'el pago se asigna del cobro más antiguo al más reciente');
select is((select sum(paid_amount) from charges), 0::numeric, 'un pago en revisión no altera los saldos');
select throws_ok($$ select review_payment((select id from pays where k = 'p1'), 'approve') $$, '42501', 'FORBIDDEN',
  'el inquilino no aprueba sus pagos');
select tests.logout();

-- ── Revisión ──
select tests.login_as('ana@a.co');
select throws_ok($$ select review_payment((select id from pays where k = 'p1'), 'reject', '  ') $$, 'P0001', 'REJECTION_REASON_REQUIRED',
  'rechazar exige motivo');
select is((review_payment((select id from pays where k = 'p1'), 'approve')).status, 'approved'::payment_status, 'el arrendador aprueba');
select is(
  (select array_agg(status::text || ':' || paid_amount order by period_start) from charges
    where lease_id = (select id from ids where k = 'l1') and period_start in ('2026-01-15', '2026-02-01')),
  array['paid:658064.00', 'partially_paid:341936.00'], 'al aprobar se actualizan los saldos');
select throws_ok($$ select review_payment((select id from pays where k = 'p1'), 'approve') $$, 'P0001', 'PAYMENT_NOT_IN_REVIEW',
  'un pago no se aprueba dos veces');
select tests.logout();

select tests.login_as('juan@t.co');
insert into storage.objects (bucket_id, name)
  values ('payment-receipts', (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/r2.jpg');
insert into pays select 'p2', (report_payment((select id from ids where k = 'l1'), 100000, current_date, 'nequi', null,
  (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/r2.jpg')).id;
insert into pays select 'p3', (report_payment((select id from ids where k = 'l1'), 50000, current_date, 'nequi', null,
  (select id from ids where k = 'org') || '/leases/' || (select id from ids where k = 'l1') || '/payments/r2.jpg')).id;
select is((cancel_payment((select id from pays where k = 'p3'))).status, 'cancelled'::payment_status, 'el inquilino retira un reporte sin revisar');
select tests.logout();

select tests.login_as('ana@a.co');
select is((review_payment((select id from pays where k = 'p2'), 'reject', 'Comprobante ilegible')).status, 'rejected'::payment_status,
  'el arrendador rechaza con motivo');
select is((select paid_amount from charges where lease_id = (select id from ids where k = 'l1') and period_start = '2026-02-01'),
  341936.00::numeric(14,2), 'un pago rechazado no altera los saldos');

-- ── Registro directo y reversión ──
insert into pays select 'cash', (report_payment((select id from ids where k = 'l1'), 858064, current_date, 'cash', null, null,
  array[(select id from charges where lease_id = (select id from ids where k = 'l1') and period_start = '2026-02-01')])).id;
select is(
  (select status::text || ':' || paid_amount from charges where lease_id = (select id from ids where k = 'l1') and period_start = '2026-02-01'),
  'paid:1200000.00', 'el pago registrado por el arrendador se aplica de inmediato al cobro elegido');
select is((reverse_payment((select id from pays where k = 'cash'), 'Registrado por error')).status, 'reversed'::payment_status,
  'el propietario revierte un pago aprobado');
select is(
  (select status::text || ':' || paid_amount from charges where lease_id = (select id from ids where k = 'l1') and period_start = '2026-02-01'),
  'partially_paid:341936.00', 'la reversión restaura el saldo');

-- ── Cobros manuales y anulación ──
select throws_ok(
  $$ select void_charge((select id from charges where lease_id = (select id from ids where k = 'l1') and period_start = '2026-01-15'), 'x') $$,
  'P0001', 'CHARGE_HAS_PAYMENTS', 'no se anula un cobro con pagos');
create temp table manual as select * from create_manual_charge((select id from ids where k = 'l1'), current_date, 'repair', 'Reparación de la ducha', 150000);
grant all on manual to public;
select is((select source from manual), 'manual'::charge_source, 'se crea un cobro manual');
select is((void_charge((select id from manual), 'Lo asume el propietario')).status, 'void'::charge_status, 'un cobro sin pagos se anula');

-- ── Terminación ──
select terminate_lease((select id from ids where k = 'l2'), '2026-03-31', 'Entrega anticipada');
select is(
  (select array_agg(distinct status) from charges where lease_id = (select id from ids where k = 'l2') and period_start > '2026-03-31'),
  array['void'::charge_status], 'terminar anula los cobros posteriores sin pagos');
select is((select status from charges where lease_id = (select id from ids where k = 'l2') and period_start = '2026-03-01'),
  'pending'::charge_status, 'los cobros hasta la terminación se conservan');

-- ── Reajustes (P-2) ──
select throws_ok($$ select apply_rent_adjustment((select id from ids where k = 'l1'), '2026-06-01', 1100000) $$,
  'P0001', 'ADJUSTMENT_AFTER_BILLED', 'no se reajusta un período ya cobrado');
select throws_ok($$ select apply_rent_adjustment((select id from ids where k = 'l1'), '2027-01-15', 1100000) $$,
  'P0001', 'IPC_NOT_AVAILABLE', 'en vivienda el reajuste exige el IPC del año anterior');
select tests.logout();
insert into ipc_annual (year, variation) values (2026, 5.00);
select tests.login_as('ana@a.co');
select throws_ok($$ select apply_rent_adjustment((select id from ids where k = 'l1'), '2027-01-15', 1060000) $$,
  'P0001', 'ADJUSTMENT_EXCEEDS_IPC', 'en vivienda el reajuste no supera el IPC');
select is((apply_rent_adjustment((select id from ids where k = 'l1'), '2027-01-15', 1050000)).percentage, 5.00::numeric(7,2),
  'se aplica un reajuste dentro del tope');

-- ── Resumen ──
select is((select in_review_count from get_finance_summary((select id from ids where k = 'org'))), 0,
  'el resumen cuenta los pagos en revisión');
select tests.logout();

select * from finish();
rollback;
