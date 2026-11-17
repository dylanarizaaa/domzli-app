-- Invitaciones: token de un solo uso ligado al correo verificado (ADR-0006).
begin;
set search_path to public, extensions;
select plan(13);

create temp table ids (k text primary key, id uuid);
grant all on ids to public;

select tests.create_user('ana@a.co');
select tests.create_user('juan@t.co');
select tests.create_user('otro@t.co');
select tests.create_user('sinverificar@t.co', false);

select tests.login_as('ana@a.co');
insert into ids select 'org', (create_organization('Inmuebles Ana')).id;
insert into tenants (organization_id, full_name, document_type, document_number, email)
  select id, 'Juan Pérez', 'CC', '1001', 'Juan@T.co' from ids where k = 'org';
insert into tenants (organization_id, full_name, document_type, document_number, email)
  select id, 'Sin Verificar', 'CC', '1002', 'sinverificar@t.co' from ids where k = 'org';
insert into tenants (organization_id, full_name, document_type, document_number)
  select id, 'Sin Correo', 'CC', '1003' from ids where k = 'org';
insert into ids select 'juan', id from tenants where document_number = '1001';
insert into ids select 'sv', id from tenants where document_number = '1002';
insert into ids select 'sc', id from tenants where document_number = '1003';

select throws_ok($$ select create_invitation((select id from ids where k = 'sc')) $$,
  'P0001', 'TENANT_EMAIL_REQUIRED', 'no se invita sin correo');

create temp table inv1 as select * from create_invitation((select id from ids where k = 'juan'));
create temp table inv2 as select * from create_invitation((select id from ids where k = 'juan'));
create temp table inv_sv as select * from create_invitation((select id from ids where k = 'sv'));
grant all on inv1, inv2, inv_sv to public;
select is((select count(*) from invitations where tenant_id = (select id from ids where k = 'juan') and status = 'pending'),
  1::bigint, 'una nueva invitación revoca la anterior');
select is((select count(*) from invitations where token_hash = (select token from inv2)), 0::bigint,
  'el token no se guarda en claro');
select throws_ok(
  $$ update tenants set profile_id = tests.user_id('ana@a.co') where id = (select id from ids where k = 'juan') $$,
  'P0001', 'TENANT_PROFILE_LINK_FORBIDDEN', 'el staff no vincula perfiles a mano');
select tests.logout();

-- Vista previa pública
select tests.login_anon();
select is((select email_masked from get_invitation_preview((select token from inv2))), 'j***@t.co',
  'la vista previa enmascara el correo');
select is((select status from get_invitation_preview((select token from inv1))), 'revoked'::invitation_status,
  'la vista previa muestra la invitación revocada');
select tests.logout();

-- Aceptación
select tests.login_as('otro@t.co');
select throws_ok($$ select accept_invitation((select token from inv2)) $$,
  'P0001', 'INVITATION_EMAIL_MISMATCH', 'otro correo no puede aceptar');
select tests.logout();

select tests.login_as('sinverificar@t.co');
select throws_ok($$ select accept_invitation((select token from inv_sv)) $$,
  'P0001', 'EMAIL_NOT_VERIFIED', 'el correo debe estar verificado');
select tests.logout();

select tests.login_as('juan@t.co');
select throws_ok($$ select accept_invitation((select token from inv1)) $$,
  'P0001', 'INVITATION_NOT_PENDING', 'una invitación revocada no se acepta');
select is(accept_invitation((select token from inv2)), (select id from ids where k = 'org'),
  'el invitado acepta y recibe la organización');
select is((select role from my_contexts()), 'tenant'::membership_role, 'queda con contexto de inquilino');
select throws_ok($$ select accept_invitation((select token from inv2)) $$,
  'P0001', 'INVITATION_NOT_PENDING', 'el token es de un solo uso');
select tests.logout();

select is((select profile_id from tenants where id = (select id from ids where k = 'juan')), tests.user_id('juan@t.co'),
  'la ficha queda vinculada al usuario');

select * from finish();
rollback;
