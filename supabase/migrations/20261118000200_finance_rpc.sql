-- Domzli · Fase 2 · Comandos financieros (RPC) y generación de cobros.
-- Convenciones (TAD §8.5): SECURITY DEFINER, search_path vacío, verificación explícita,
-- bloqueo de filas en orden determinista, auditoría en la misma transacción.

-- ---------- Generación de cobros ----------
-- P-11 (recomendación del TAD, aplicada): períodos de mes calendario. El primer período se
-- prorratea por días si el contrato (o el inicio de cobro) empieza a mitad de mes.
-- Vence el día de pago del mes (o el último día si el mes es más corto), nunca antes del inicio.
-- Se genera con 5 días de anticipación al inicio del período. Idempotente.
create or replace function private.generate_charges_for_lease(p_lease_id uuid, p_today date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
  v_lead constant integer := 5;
  v_start date;
  v_month_start date;
  v_end date;
  v_days_in_month integer;
  v_days integer;
  v_factor numeric;
  v_rent numeric(14, 2);
  v_admin numeric(14, 2);
  v_due date;
  v_charge_id uuid;
  v_label text;
  v_count integer := 0;
begin
  select * into v_lease from public.leases where id = p_lease_id;
  if not found or v_lease.status <> 'active' then
    return 0;
  end if;

  v_start := greatest(v_lease.start_date, coalesce(v_lease.billing_start_date, v_lease.start_date));
  loop
    exit when v_start - v_lead > p_today;

    v_month_start := date_trunc('month', v_start)::date;
    v_end := (v_month_start + interval '1 month' - interval '1 day')::date;
    v_days_in_month := extract(day from v_end)::integer;
    v_days := v_end - v_start + 1;
    v_factor := v_days::numeric / v_days_in_month;
    v_rent := round(private.rent_at(v_lease.id, v_start) * v_factor, 0);
    v_admin := case
      when v_lease.administration_mode = 'separate' then round(v_lease.administration_value * v_factor, 0)
      else 0
    end;
    v_due := greatest(
      v_start,
      make_date(extract(year from v_month_start)::integer, extract(month from v_month_start)::integer,
                least(v_lease.payment_day, v_days_in_month))
    );
    v_label := private.month_label(v_month_start);

    v_charge_id := null;
    insert into public.charges (organization_id, lease_id, source, period_start, period_end, due_date, description, total_amount)
    values (v_lease.organization_id, v_lease.id, 'scheduled', v_start, v_end, v_due,
            initcap(split_part(v_label, ' ', 1)) || ' ' || split_part(v_label, ' ', 2), v_rent + v_admin)
    on conflict (lease_id, period_start) where source = 'scheduled' do nothing
    returning id into v_charge_id;

    if v_charge_id is not null then
      insert into public.charge_items (organization_id, charge_id, concept, description, amount)
      values (v_lease.organization_id, v_charge_id, 'rent',
              'Canon ' || v_label || case when v_days < v_days_in_month then ' (' || v_days || ' días)' else '' end,
              v_rent);
      if v_admin > 0 then
        insert into public.charge_items (organization_id, charge_id, concept, description, amount)
        values (v_lease.organization_id, v_charge_id, 'administration',
                'Administración ' || v_label || case when v_days < v_days_in_month then ' (' || v_days || ' días)' else '' end,
                v_admin);
      end if;
      v_count := v_count + 1;
    end if;

    v_start := (v_month_start + interval '1 month')::date;
  end loop;

  return v_count;
end;
$$;

-- Proceso programado (pg_cron): todos los contratos activos.
create or replace function private.generate_all_due_charges()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_total integer := 0;
begin
  -- Evita ejecuciones solapadas.
  if not pg_try_advisory_xact_lock(hashtext('domzli.generate_all_due_charges')) then
    return 0;
  end if;
  for v_id in select id from public.leases where status = 'active' order by id loop
    v_total := v_total + private.generate_charges_for_lease(v_id, private.today());
  end loop;
  return v_total;
end;
$$;

-- Puesta al día bajo demanda (la app la llama al abrir Finanzas). Idempotente.
create or replace function public.generate_due_charges(p_organization_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_total integer := 0;
begin
  if p_organization_id is null or p_organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  for v_id in
    select id from public.leases where organization_id = p_organization_id and status = 'active' order by id
  loop
    v_total := v_total + private.generate_charges_for_lease(v_id, private.today());
  end loop;
  return v_total;
end;
$$;

-- ---------- Contratos: activar y terminar ahora también gestionan cobros ----------

create or replace function public.activate_lease(p_lease_id uuid)
returns public.leases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
  v_property public.properties;
  v_tenants integer;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id for update;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'draft' then
    raise exception 'LEASE_NOT_DRAFT' using errcode = 'P0001';
  end if;

  select * into v_property from public.properties p where p.id = v_lease.property_id for update;
  if v_property.archived_at is not null then
    raise exception 'PROPERTY_ARCHIVED' using errcode = 'P0001';
  end if;
  if v_property.status <> 'available' then
    raise exception 'PROPERTY_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select count(*) into v_tenants
  from public.lease_tenants lt
  join public.tenants t on t.id = lt.tenant_id
  where lt.lease_id = p_lease_id and lt.role = 'primary' and t.archived_at is null;
  if v_tenants <> 1 then
    raise exception 'LEASE_REQUIRES_ONE_TENANT' using errcode = 'P0001';
  end if;

  update public.leases
     set status = 'active', activated_at = now()
   where id = p_lease_id
  returning * into v_lease;

  update public.properties set status = 'leased' where id = v_lease.property_id;

  -- Cobros vencidos o próximos desde el inicio de cobro.
  perform private.generate_charges_for_lease(v_lease.id, private.today());

  return v_lease;
end;
$$;

create or replace function public.terminate_lease(p_lease_id uuid, p_terminated_on date, p_reason text)
returns public.leases
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id for update;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'active' then
    raise exception 'LEASE_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if p_terminated_on is null or p_terminated_on < v_lease.start_date or p_terminated_on > private.today() then
    raise exception 'INVALID_TERMINATION_DATE' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'TERMINATION_REASON_REQUIRED' using errcode = 'P0001';
  end if;

  update public.leases
     set status = 'terminated', terminated_on = p_terminated_on, termination_reason = btrim(p_reason)
   where id = p_lease_id
  returning * into v_lease;

  update public.properties set status = 'available' where id = v_lease.property_id;

  -- Se anulan los cobros programados posteriores a la terminación que no tengan pagos.
  update public.charges c
     set status = 'void', voided_at = now(), void_reason = 'Contrato terminado'
   where c.lease_id = p_lease_id
     and c.source = 'scheduled'
     and c.period_start > p_terminated_on
     and c.status = 'pending'
     and c.paid_amount = 0
     and private.pending_allocated(c.id) = 0;

  return v_lease;
end;
$$;

-- ---------- Cobros manuales y anulación ----------

create or replace function public.create_manual_charge(
  p_lease_id uuid,
  p_due_date date,
  p_concept public.charge_concept,
  p_description text,
  p_amount numeric
)
returns public.charges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
  v_charge public.charges;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'active' then
    raise exception 'LEASE_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_description), '') = '' then
    raise exception 'CHARGE_DESCRIPTION_REQUIRED' using errcode = 'P0001';
  end if;
  if p_due_date is null then
    raise exception 'INVALID_DUE_DATE' using errcode = 'P0001';
  end if;

  insert into public.charges (organization_id, lease_id, source, period_start, period_end, due_date, description, total_amount, created_by)
  values (v_lease.organization_id, v_lease.id, 'manual', p_due_date, p_due_date, p_due_date, btrim(p_description), p_amount, (select auth.uid()))
  returning * into v_charge;

  insert into public.charge_items (organization_id, charge_id, concept, description, amount)
  values (v_lease.organization_id, v_charge.id, coalesce(p_concept, 'other'), btrim(p_description), p_amount);

  return v_charge;
end;
$$;

create or replace function public.void_charge(p_charge_id uuid, p_reason text)
returns public.charges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_charge public.charges;
begin
  select * into v_charge from public.charges c where c.id = p_charge_id for update;
  if not found then
    raise exception 'CHARGE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_charge.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_charge.status = 'void' then
    raise exception 'CHARGE_VOID' using errcode = 'P0001';
  end if;
  if v_charge.paid_amount > 0 then
    raise exception 'CHARGE_HAS_PAYMENTS' using errcode = 'P0001';
  end if;
  if private.pending_allocated(v_charge.id) > 0 then
    raise exception 'CHARGE_HAS_PENDING_PAYMENTS' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'VOID_REASON_REQUIRED' using errcode = 'P0001';
  end if;

  update public.charges
     set status = 'void', voided_at = now(), void_reason = btrim(p_reason)
   where id = p_charge_id
  returning * into v_charge;
  return v_charge;
end;
$$;

-- ---------- Pagos ----------

-- Inquilino: crea un pago "en revisión" con comprobante obligatorio.
-- Staff: registra un pago recibido, que queda aprobado y aplicado de inmediato.
-- Asignación: a los cobros indicados o, si no se indican, del más antiguo al más reciente.
-- P-4: sin saldo a favor; el monto no puede superar lo pendiente.
create or replace function public.report_payment(
  p_lease_id uuid,
  p_amount numeric,
  p_paid_on date,
  p_method public.payment_method,
  p_reference text default null,
  p_receipt_path text default null,
  p_charge_ids uuid[] default null,
  p_notes text default null
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_lease public.leases;
  v_is_staff boolean;
  v_is_tenant boolean;
  v_payment public.payments;
  v_remaining numeric(14, 2);
  v_charge record;
  v_available numeric(14, 2);
  v_take numeric(14, 2);
begin
  if v_user is null then
    raise exception 'UNAUTHENTICATED' using errcode = '42501';
  end if;

  select * into v_lease from public.leases l where l.id = p_lease_id;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  v_is_staff := v_lease.organization_id in (select private.staff_org_ids());
  v_is_tenant := p_lease_id in (select private.tenant_lease_ids());
  if not (v_is_staff or v_is_tenant) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status = 'draft' then
    raise exception 'LEASE_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;
  if p_paid_on is null or p_paid_on > private.today() or p_paid_on < v_lease.start_date - 31 then
    raise exception 'INVALID_PAYMENT_DATE' using errcode = 'P0001';
  end if;
  if p_method is null then
    raise exception 'PAYMENT_METHOD_REQUIRED' using errcode = 'P0001';
  end if;

  if not v_is_staff and coalesce(p_receipt_path, '') = '' then
    raise exception 'RECEIPT_REQUIRED' using errcode = 'P0001';
  end if;
  if coalesce(p_receipt_path, '') <> '' then
    if split_part(p_receipt_path, '/', 1) <> v_lease.organization_id::text
       or split_part(p_receipt_path, '/', 2) <> 'leases'
       or split_part(p_receipt_path, '/', 3) <> p_lease_id::text
       or split_part(p_receipt_path, '/', 4) <> 'payments' then
      raise exception 'INVALID_RECEIPT' using errcode = 'P0001';
    end if;
    if not exists (
      select 1 from storage.objects o where o.bucket_id = 'payment-receipts' and o.name = p_receipt_path
    ) then
      raise exception 'RECEIPT_NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  insert into public.payments (
    organization_id, lease_id, amount, paid_on, method, reference, receipt_path, source, status, notes,
    reported_by, reviewed_by, reviewed_at
  )
  values (
    v_lease.organization_id, v_lease.id, p_amount, p_paid_on, p_method, nullif(btrim(p_reference), ''),
    nullif(p_receipt_path, ''),
    case when v_is_staff then 'staff_record' else 'tenant_report' end::public.payment_source,
    case when v_is_staff then 'approved' else 'in_review' end::public.payment_status,
    nullif(btrim(p_notes), ''),
    v_user,
    case when v_is_staff then v_user end,
    case when v_is_staff then now() end
  )
  returning * into v_payment;

  v_remaining := p_amount;
  for v_charge in
    select c.id, c.total_amount, c.paid_amount
    from public.charges c
    where c.lease_id = p_lease_id
      and c.status in ('pending', 'partially_paid')
      and (p_charge_ids is null or c.id = any (p_charge_ids))
    order by c.due_date, c.period_start, c.id
    for update of c
  loop
    exit when v_remaining <= 0;
    v_available := v_charge.total_amount - v_charge.paid_amount - private.pending_allocated(v_charge.id, v_payment.id);
    continue when v_available <= 0;
    v_take := least(v_available, v_remaining);

    insert into public.payment_allocations (organization_id, payment_id, charge_id, allocated_amount)
    values (v_lease.organization_id, v_payment.id, v_charge.id, v_take);

    if v_is_staff then
      update public.charges
         set paid_amount = paid_amount + v_take,
             status = (case when paid_amount + v_take >= total_amount then 'paid' else 'partially_paid' end)::public.charge_status
       where id = v_charge.id;
    end if;

    v_remaining := v_remaining - v_take;
  end loop;

  if v_remaining > 0 then
    raise exception 'PAYMENT_EXCEEDS_BALANCE' using errcode = 'P0001';
  end if;

  return v_payment;
end;
$$;

create or replace function public.review_payment(p_payment_id uuid, p_decision text, p_reason text default null)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_alloc record;
  v_applied numeric(14, 2) := 0;
begin
  -- Bloquear el pago serializa revisiones concurrentes.
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_payment.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_payment.status <> 'in_review' then
    raise exception 'PAYMENT_NOT_IN_REVIEW' using errcode = 'P0001';
  end if;

  if p_decision = 'reject' then
    if coalesce(btrim(p_reason), '') = '' then
      raise exception 'REJECTION_REASON_REQUIRED' using errcode = 'P0001';
    end if;
    update public.payments
       set status = 'rejected', rejection_reason = btrim(p_reason), reviewed_by = (select auth.uid()), reviewed_at = now()
     where id = p_payment_id
    returning * into v_payment;

  elsif p_decision = 'approve' then
    for v_alloc in
      select pa.charge_id, pa.allocated_amount, c.total_amount, c.paid_amount, c.status
      from public.payment_allocations pa
      join public.charges c on c.id = pa.charge_id
      where pa.payment_id = p_payment_id
      order by c.id
      for update of c
    loop
      if v_alloc.status = 'void' then
        raise exception 'CHARGE_VOID' using errcode = 'P0001';
      end if;
      if v_alloc.allocated_amount > v_alloc.total_amount - v_alloc.paid_amount then
        raise exception 'ALLOCATION_EXCEEDS_BALANCE' using errcode = 'P0001';
      end if;
      update public.charges
         set paid_amount = paid_amount + v_alloc.allocated_amount,
             status = (case when paid_amount + v_alloc.allocated_amount >= total_amount then 'paid' else 'partially_paid' end)::public.charge_status
       where id = v_alloc.charge_id;
      v_applied := v_applied + v_alloc.allocated_amount;
    end loop;

    if v_applied <> v_payment.amount then
      raise exception 'ALLOCATIONS_DO_NOT_MATCH_AMOUNT' using errcode = 'P0001';
    end if;

    update public.payments
       set status = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now()
     where id = p_payment_id
    returning * into v_payment;
  else
    raise exception 'INVALID_DECISION' using errcode = '22023';
  end if;

  return v_payment;
end;
$$;

-- El inquilino retira un reporte que aún no se ha revisado.
create or replace function public.cancel_payment(p_payment_id uuid)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_payment.reported_by is distinct from (select auth.uid()) or v_payment.source <> 'tenant_report' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_payment.status <> 'in_review' then
    raise exception 'PAYMENT_NOT_IN_REVIEW' using errcode = 'P0001';
  end if;
  update public.payments set status = 'cancelled' where id = p_payment_id returning * into v_payment;
  return v_payment;
end;
$$;

-- Solo el propietario revierte un pago aprobado por error; los saldos se restauran.
create or replace function public.reverse_payment(p_payment_id uuid, p_reason text)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_alloc record;
  v_new_paid numeric(14, 2);
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_payment.organization_id not in (select private.owner_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_payment.status <> 'approved' then
    raise exception 'PAYMENT_NOT_APPROVED' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'REVERSAL_REASON_REQUIRED' using errcode = 'P0001';
  end if;

  for v_alloc in
    select pa.charge_id, pa.allocated_amount, c.total_amount, c.paid_amount
    from public.payment_allocations pa
    join public.charges c on c.id = pa.charge_id
    where pa.payment_id = p_payment_id
    order by c.id
    for update of c
  loop
    v_new_paid := greatest(v_alloc.paid_amount - v_alloc.allocated_amount, 0);
    update public.charges
       set paid_amount = v_new_paid,
           status = (case when v_new_paid = 0 then 'pending'
                          when v_new_paid < total_amount then 'partially_paid'
                          else 'paid' end)::public.charge_status
     where id = v_alloc.charge_id;
  end loop;

  update public.payments
     set status = 'reversed', rejection_reason = btrim(p_reason), reviewed_by = (select auth.uid()), reviewed_at = now()
   where id = p_payment_id
  returning * into v_payment;
  return v_payment;
end;
$$;

-- ---------- Reajuste del canon (P-2) ⚖️ ----------
-- Vivienda: solo tras 12 meses con el mismo canon y con tope en el IPC del año anterior
-- (Ley 820 de 2003, art. 20). Comercial: según el contrato. Las rebajas siempre se permiten.
create or replace function public.apply_rent_adjustment(
  p_lease_id uuid,
  p_effective_from date,
  p_new_rent numeric,
  p_reason text default null
)
returns public.lease_rent_adjustments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lease public.leases;
  v_current numeric(14, 2);
  v_last date;
  v_ipc numeric;
  v_max numeric(14, 2);
  v_adjustment public.lease_rent_adjustments;
begin
  select * into v_lease from public.leases l where l.id = p_lease_id for update;
  if not found then
    raise exception 'LEASE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_lease.organization_id not in (select private.staff_org_ids()) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_lease.status <> 'active' then
    raise exception 'LEASE_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if p_new_rent is null or p_new_rent <= 0 or p_new_rent <> round(p_new_rent, 2) then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;
  if p_effective_from is null or p_effective_from <= v_lease.start_date then
    raise exception 'INVALID_EFFECTIVE_DATE' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.charges c
    where c.lease_id = p_lease_id and c.source = 'scheduled' and c.status <> 'void' and c.period_start >= p_effective_from
  ) then
    raise exception 'ADJUSTMENT_AFTER_BILLED' using errcode = 'P0001';
  end if;

  v_current := private.rent_at(p_lease_id, p_effective_from);
  if p_new_rent = v_current then
    raise exception 'ADJUSTMENT_NO_CHANGE' using errcode = 'P0001';
  end if;

  if p_new_rent > v_current then
    select coalesce(max(a.effective_from), v_lease.start_date) into v_last
    from public.lease_rent_adjustments a where a.lease_id = p_lease_id and a.effective_from < p_effective_from;
    if p_effective_from < (v_last + interval '12 months')::date then
      raise exception 'ADJUSTMENT_TOO_EARLY' using errcode = 'P0001';
    end if;

    if v_lease.lease_use = 'residential' then
      select i.variation into v_ipc from public.ipc_annual i
      where i.year = extract(year from p_effective_from)::integer - 1;
      if not found then
        raise exception 'IPC_NOT_AVAILABLE' using errcode = 'P0001';
      end if;
      v_max := round(v_current * (1 + v_ipc / 100), 0);
      if p_new_rent > v_max then
        raise exception 'ADJUSTMENT_EXCEEDS_IPC' using errcode = 'P0001', detail = v_max::text;
      end if;
    end if;
  end if;

  insert into public.lease_rent_adjustments (
    organization_id, lease_id, effective_from, previous_rent, new_rent, adjustment_type, percentage, reason, created_by
  )
  values (
    v_lease.organization_id, v_lease.id, p_effective_from, v_current, p_new_rent,
    case v_lease.increase_type when 'ipc' then 'ipc' when 'fixed_percentage' then 'fixed' else 'negotiated' end::public.adjustment_type,
    round((p_new_rent / v_current - 1) * 100, 2),
    nullif(btrim(p_reason), ''),
    (select auth.uid())
  )
  returning * into v_adjustment;

  return v_adjustment;
end;
$$;

-- ---------- Resumen financiero (aplica la RLS de quien consulta) ----------
-- expected/collected: cobros que vencen en el mes. pending/overdue: todo lo no pagado.
create or replace function public.get_finance_summary(p_organization_id uuid, p_month date default null)
returns table (
  month_start date,
  expected numeric,
  collected numeric,
  pending numeric,
  overdue numeric,
  overdue_count integer,
  in_review_count integer,
  in_review_amount numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with m as (
    select date_trunc('month', coalesce(p_month, private.today()))::date as s
  ),
  c as (
    select ch.* from public.charges ch
    where ch.organization_id = p_organization_id and ch.status <> 'void'
  )
  select
    m.s,
    coalesce((select sum(c.total_amount) from c where c.due_date >= m.s and c.due_date < (m.s + interval '1 month')::date), 0),
    coalesce((select sum(c.paid_amount) from c where c.due_date >= m.s and c.due_date < (m.s + interval '1 month')::date), 0),
    coalesce((select sum(c.total_amount - c.paid_amount) from c), 0),
    coalesce((select sum(c.total_amount - c.paid_amount) from c where c.due_date < private.today() and c.status in ('pending', 'partially_paid')), 0),
    (select count(*)::integer from c where c.due_date < private.today() and c.status in ('pending', 'partially_paid')),
    (select count(*)::integer from public.payments p where p.organization_id = p_organization_id and p.status = 'in_review'),
    coalesce((select sum(p.amount) from public.payments p where p.organization_id = p_organization_id and p.status = 'in_review'), 0)
  from m;
$$;

-- ---------- Privilegios de ejecución ----------
revoke execute on function
  private.generate_charges_for_lease(uuid, date),
  private.generate_all_due_charges()
from public, anon, authenticated;

revoke execute on function
  public.generate_due_charges(uuid),
  public.activate_lease(uuid),
  public.terminate_lease(uuid, date, text),
  public.create_manual_charge(uuid, date, public.charge_concept, text, numeric),
  public.void_charge(uuid, text),
  public.report_payment(uuid, numeric, date, public.payment_method, text, text, uuid[], text),
  public.review_payment(uuid, text, text),
  public.cancel_payment(uuid),
  public.reverse_payment(uuid, text),
  public.apply_rent_adjustment(uuid, date, numeric, text),
  public.get_finance_summary(uuid, date)
from public, anon;

grant execute on function
  public.generate_due_charges(uuid),
  public.activate_lease(uuid),
  public.terminate_lease(uuid, date, text),
  public.create_manual_charge(uuid, date, public.charge_concept, text, numeric),
  public.void_charge(uuid, text),
  public.report_payment(uuid, numeric, date, public.payment_method, text, text, uuid[], text),
  public.review_payment(uuid, text, text),
  public.cancel_payment(uuid),
  public.reverse_payment(uuid, text),
  public.apply_rent_adjustment(uuid, date, numeric, text),
  public.get_finance_summary(uuid, date)
to authenticated;

grant execute on all functions in schema public to service_role;
grant execute on all functions in schema private to service_role;

-- ---------- Tarea programada ----------
-- En Supabase, pg_cron está disponible: genera los cobros cada día a las 05:00 de Colombia (10:00 UTC).
-- Si no está disponible, la app pone los cobros al día al abrir Finanzas (generate_due_charges).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.schedule('generate-due-charges', '0 10 * * *', 'select private.generate_all_due_charges()');
      perform cron.schedule('expire-invitations', '0 * * * *', 'select private.expire_invitations()');
    exception when others then
      raise notice 'pg_cron no disponible: %', sqlerrm;
    end;
  end if;
end;
$$;
