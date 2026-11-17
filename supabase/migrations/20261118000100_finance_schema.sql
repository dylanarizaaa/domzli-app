-- Domzli · Fase 2 · Esquema financiero: cobros, pagos, asignaciones, reajustes e IPC.

create type public.charge_status as enum ('pending', 'partially_paid', 'paid', 'void');
create type public.charge_source as enum ('scheduled', 'manual');
create type public.charge_concept as enum ('rent', 'administration', 'utility', 'repair', 'other');
create type public.payment_method as enum ('bank_transfer', 'bre_b', 'pse', 'nequi', 'daviplata', 'cash', 'card', 'other');
create type public.payment_status as enum ('in_review', 'approved', 'rejected', 'cancelled', 'reversed');
create type public.payment_source as enum ('tenant_report', 'staff_record', 'gateway');
create type public.adjustment_type as enum ('ipc', 'fixed', 'negotiated');

-- Desde cuándo se generan cobros en Domzli. Evita cobrar meses anteriores al registrar
-- un contrato que ya venía corriendo. Nulo = desde el inicio del contrato.
alter table public.leases add column billing_start_date date;
alter table public.leases add constraint leases_billing_start_check
  check (billing_start_date is null or (billing_start_date >= start_date));

-- ---------- Reajustes del canon e IPC ----------

create table public.lease_rent_adjustments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lease_id uuid not null,
  effective_from date not null,
  previous_rent numeric(14, 2) not null check (previous_rent > 0),
  new_rent numeric(14, 2) not null check (new_rent > 0),
  adjustment_type public.adjustment_type not null,
  percentage numeric(7, 2) not null,
  reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, lease_id) references public.leases (organization_id, id) on delete restrict,
  unique (lease_id, effective_from)
);

-- Variación anual del IPC (DANE): tope del reajuste anual en vivienda urbana (Ley 820 de 2003, art. 20).
create table public.ipc_annual (
  year integer primary key check (year between 2000 and 2100),
  variation numeric(6, 3) not null check (variation >= 0),
  source text not null default 'DANE',
  created_at timestamptz not null default now()
);
insert into public.ipc_annual (year, variation) values (2022, 13.12), (2023, 9.28), (2024, 5.20);

-- ---------- Cobros ----------

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lease_id uuid not null,
  source public.charge_source not null default 'scheduled',
  period_start date not null,
  period_end date not null,
  due_date date not null,
  description text,
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  status public.charge_status not null default 'pending',
  voided_at timestamptz,
  void_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, lease_id) references public.leases (organization_id, id) on delete restrict,
  check (period_end >= period_start),
  check (paid_amount <= total_amount)
);
-- No se generan dos cobros programados para el mismo período de un contrato.
create unique index charges_one_scheduled_per_period on public.charges (lease_id, period_start) where source = 'scheduled';
create index charges_org_status_due_idx on public.charges (organization_id, status, due_date);
create index charges_lease_due_idx on public.charges (lease_id, due_date);

create table public.charge_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  charge_id uuid not null,
  concept public.charge_concept not null,
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  foreign key (organization_id, charge_id) references public.charges (organization_id, id) on delete cascade
);
create index charge_items_charge_idx on public.charge_items (charge_id);

-- ---------- Pagos ----------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  lease_id uuid not null,
  amount numeric(14, 2) not null check (amount > 0),
  paid_on date not null,
  method public.payment_method not null,
  reference text,
  receipt_path text,
  source public.payment_source not null,
  status public.payment_status not null,
  notes text,
  reported_by uuid references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, lease_id) references public.leases (organization_id, id) on delete restrict
);
create index payments_org_status_idx on public.payments (organization_id, status, created_at desc);
create index payments_lease_idx on public.payments (lease_id, created_at desc);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  payment_id uuid not null,
  charge_id uuid not null,
  allocated_amount numeric(14, 2) not null check (allocated_amount > 0),
  created_at timestamptz not null default now(),
  unique (payment_id, charge_id),
  foreign key (organization_id, payment_id) references public.payments (organization_id, id) on delete cascade,
  foreign key (organization_id, charge_id) references public.charges (organization_id, id) on delete restrict
);
create index payment_allocations_charge_idx on public.payment_allocations (charge_id);

create trigger charges_set_updated_at before update on public.charges
  for each row execute function private.tg_set_updated_at();
create trigger charges_immutable_org before update on public.charges
  for each row execute function private.tg_immutable_organization();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function private.tg_set_updated_at();
create trigger payments_immutable_org before update on public.payments
  for each row execute function private.tg_immutable_organization();

create trigger charges_audit after insert or update or delete on public.charges
  for each row execute function private.tg_audit();
create trigger payments_audit after insert or update or delete on public.payments
  for each row execute function private.tg_audit();
create trigger lease_rent_adjustments_audit after insert on public.lease_rent_adjustments
  for each row execute function private.tg_audit();

-- ---------- Utilidades ----------

create or replace function private.month_label(p_date date)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
                'septiembre', 'octubre', 'noviembre', 'diciembre'])[extract(month from p_date)::int]
         || ' ' || extract(year from p_date)::int;
$$;

-- Canon vigente en una fecha, según el historial de reajustes.
create or replace function private.rent_at(p_lease_id uuid, p_date date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select a.new_rent from public.lease_rent_adjustments a
      where a.lease_id = p_lease_id and a.effective_from <= p_date
      order by a.effective_from desc limit 1),
    (select a.previous_rent from public.lease_rent_adjustments a
      where a.lease_id = p_lease_id
      order by a.effective_from asc limit 1),
    (select l.monthly_rent from public.leases l where l.id = p_lease_id)
  );
$$;

-- Monto de un cobro que está comprometido por pagos aún en revisión.
create or replace function private.pending_allocated(p_charge_id uuid, p_exclude_payment uuid default null)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(pa.allocated_amount), 0)
  from public.payment_allocations pa
  join public.payments p on p.id = pa.payment_id
  where pa.charge_id = p_charge_id
    and p.status = 'in_review'
    and (p_exclude_payment is null or p.id <> p_exclude_payment);
$$;

-- ---------- RLS y privilegios ----------
alter table public.lease_rent_adjustments enable row level security;
alter table public.ipc_annual enable row level security;
alter table public.charges enable row level security;
alter table public.charge_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;

-- Supabase concede todo por defecto en tablas nuevas: se parte de cero.
revoke all on public.lease_rent_adjustments, public.ipc_annual, public.charges, public.charge_items,
  public.payments, public.payment_allocations from anon, authenticated;
-- Escrituras financieras solo mediante RPC (ADR-0004): los clientes solo leen.
grant select on public.lease_rent_adjustments, public.ipc_annual, public.charges, public.charge_items,
  public.payments, public.payment_allocations to authenticated;
grant all on public.lease_rent_adjustments, public.ipc_annual, public.charges, public.charge_items,
  public.payments, public.payment_allocations to service_role;

create policy ipc_annual_select on public.ipc_annual
  for select to authenticated using (true);

create policy lease_rent_adjustments_select on public.lease_rent_adjustments
  for select to authenticated
  using (organization_id in (select private.staff_org_ids()) or lease_id in (select private.tenant_lease_ids()));

create policy charges_select on public.charges
  for select to authenticated
  using (organization_id in (select private.staff_org_ids()) or lease_id in (select private.tenant_lease_ids()));

create policy charge_items_select on public.charge_items
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or charge_id in (select c.id from public.charges c where c.lease_id in (select private.tenant_lease_ids()))
  );

create policy payments_select on public.payments
  for select to authenticated
  using (organization_id in (select private.staff_org_ids()) or lease_id in (select private.tenant_lease_ids()));

create policy payment_allocations_select on public.payment_allocations
  for select to authenticated
  using (
    organization_id in (select private.staff_org_ids())
    or payment_id in (select p.id from public.payments p where p.lease_id in (select private.tenant_lease_ids()))
  );

-- ---------- Storage: comprobantes de pago ----------
-- Ruta: {organization_id}/leases/{lease_id}/payments/{archivo}. Inmutables (sin UPDATE ni DELETE).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy payment_receipts_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (
      (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
      or (storage.foldername(name))[3] in (select t.id::text from private.tenant_lease_ids() as t(id))
    )
  );
create policy payment_receipts_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and (storage.foldername(name))[2] = 'leases'
    and (storage.foldername(name))[4] = 'payments'
    and (
      (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
      or (
        (storage.foldername(name))[3] in (select t.id::text from private.tenant_lease_ids() as t(id))
        and (storage.foldername(name))[1] in (
          select l.organization_id::text from public.leases l where l.id::text = (storage.foldername(name))[3]
        )
      )
    )
  );

-- ---------- Vistas de lectura (aplican la RLS de quien consulta) ----------

-- Se recrean para incluir billing_start_date y el canon vigente según los reajustes.
drop view public.v_lease_overview;
drop view public.v_property_overview;

create view public.v_lease_overview
with (security_invoker = true) as
select
  l.*,
  private.rent_at(l.id, private.today()) as current_rent,
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
  case when l.id is not null then private.rent_at(l.id, private.today()) end as current_rent,
  l.end_date as lease_end_date,
  t.id as tenant_id,
  t.full_name as tenant_name
from public.properties p
left join public.leases l on l.property_id = p.id and l.status = 'active'
left join public.lease_tenants lt on lt.lease_id = l.id and lt.role = 'primary'
left join public.tenants t on t.id = lt.tenant_id;

create view public.v_charge_balances
with (security_invoker = true) as
select
  c.*,
  (c.total_amount - c.paid_amount) as balance,
  private.pending_allocated(c.id) as in_review_amount,
  (c.status in ('pending', 'partially_paid') and c.due_date < private.today()) as is_overdue,
  greatest(private.today() - c.due_date, 0) as days_overdue,
  l.status as lease_status,
  p.id as property_id,
  p.name as property_name,
  t.full_name as tenant_name
from public.charges c
join public.leases l on l.id = c.lease_id
join public.properties p on p.id = l.property_id
left join public.lease_tenants lt on lt.lease_id = l.id and lt.role = 'primary'
left join public.tenants t on t.id = lt.tenant_id;

create view public.v_payment_overview
with (security_invoker = true) as
select
  py.*,
  p.name as property_name,
  t.full_name as tenant_name,
  pr.full_name as reporter_name,
  (
    select string_agg(coalesce(c.description, private.month_label(c.period_start)), ', ' order by c.period_start)
    from public.payment_allocations pa
    join public.charges c on c.id = pa.charge_id
    where pa.payment_id = py.id
  ) as applied_to
from public.payments py
join public.leases l on l.id = py.lease_id
join public.properties p on p.id = l.property_id
left join public.lease_tenants lt on lt.lease_id = l.id and lt.role = 'primary'
left join public.tenants t on t.id = lt.tenant_id
left join public.profiles pr on pr.id = py.reported_by;

revoke all on public.v_lease_overview, public.v_property_overview, public.v_charge_balances, public.v_payment_overview
  from anon, authenticated;
grant select on public.v_lease_overview, public.v_property_overview, public.v_charge_balances, public.v_payment_overview
  to authenticated, service_role;

-- Las vistas con security_invoker ejecutan estas utilidades con el rol de quien consulta.
revoke execute on function private.month_label(date), private.rent_at(uuid, date), private.pending_allocated(uuid, uuid)
  from public, anon;
grant execute on function private.month_label(date), private.rent_at(uuid, date), private.pending_allocated(uuid, uuid)
  to authenticated, service_role;
