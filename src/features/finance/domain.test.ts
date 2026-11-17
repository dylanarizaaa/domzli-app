import { describe, expect, it } from 'vitest';

import { chargeDisplayStatus, collectionRate, dueCaption, payableCents, previewAllocation, toChargeSummary } from './domain';

const charge = (id: string, dueDate: string, availableCents: number) => ({ id, dueDate, periodStart: dueDate.slice(0, 8) + '01', availableCents });

describe('chargeDisplayStatus', () => {
  it('muestra vencido solo para cobros abiertos', () => {
    expect(chargeDisplayStatus({ status: 'pending', is_overdue: true })).toBe('overdue');
    expect(chargeDisplayStatus({ status: 'partially_paid', is_overdue: true })).toBe('overdue');
    expect(chargeDisplayStatus({ status: 'partially_paid', is_overdue: false })).toBe('partially_paid');
    expect(chargeDisplayStatus({ status: 'paid', is_overdue: true })).toBe('paid');
    expect(chargeDisplayStatus({ status: 'void', is_overdue: true })).toBe('void');
  });
});

describe('toChargeSummary', () => {
  it('descuenta lo que está en revisión de lo que aún se puede pagar', () => {
    const summary = toChargeSummary({
      id: 'c1', organization_id: 'o', lease_id: 'l', property_id: 'p', property_name: 'Apto 301', tenant_name: 'Ana', lease_status: 'active',
      period_start: '2026-11-01', period_end: '2026-11-30', due_date: '2026-11-05', description: 'Canon noviembre 2026',
      source: 'scheduled', status: 'partially_paid', total_amount: 1430000, paid_amount: 400000, balance: 1030000,
      in_review_amount: 1000000, is_overdue: true, days_overdue: 12, voided_at: null, void_reason: null, created_by: null,
      created_at: '2026-10-31T10:00:00Z', updated_at: '2026-10-31T10:00:00Z',
    });
    expect(summary.balanceCents).toBe(103000000);
    expect(summary.availableCents).toBe(3000000);
    expect(summary.displayStatus).toBe('overdue');
  });
});

describe('previewAllocation', () => {
  const open = [charge('dic', '2026-12-05', 150000000), charge('nov', '2026-11-05', 100000000), charge('rep', '2026-11-20', 20000000)];

  it('aplica del vencimiento más antiguo al más reciente', () => {
    expect(previewAllocation(open, 110000000)).toEqual({
      allocations: [{ chargeId: 'nov', cents: 100000000 }, { chargeId: 'rep', cents: 10000000 }],
      remainingCents: 0,
    });
  });

  it('respeta los cobros elegidos', () => {
    expect(previewAllocation(open, 150000000, ['dic']).allocations).toEqual([{ chargeId: 'dic', cents: 150000000 }]);
  });

  it('reporta el excedente: no hay saldo a favor', () => {
    expect(previewAllocation(open, 300000000).remainingCents).toBe(30000000);
    expect(previewAllocation(open, 30000000, ['rep']).remainingCents).toBe(10000000);
  });

  it('ignora cobros sin saldo disponible y montos negativos', () => {
    expect(previewAllocation([charge('a', '2026-11-05', 0)], 1000).allocations).toEqual([]);
    expect(previewAllocation(open, -500)).toEqual({ allocations: [], remainingCents: 0 });
  });
});

describe('payableCents', () => {
  it('suma lo pagable de todos o de los elegidos', () => {
    const open = [charge('a', '2026-11-05', 100), charge('b', '2026-12-05', 250)];
    expect(payableCents(open)).toBe(350);
    expect(payableCents(open, [])).toBe(350);
    expect(payableCents(open, ['b'])).toBe(250);
  });
});

describe('collectionRate', () => {
  it('redondea y no pasa de 100', () => {
    expect(collectionRate({ expectedCents: 0, collectedCents: 0 })).toBe(0);
    expect(collectionRate({ expectedCents: 300, collectedCents: 100 })).toBe(33);
    expect(collectionRate({ expectedCents: 100, collectedCents: 150 })).toBe(100);
  });
});

describe('dueCaption', () => {
  const today = '2026-11-17';
  it('describe el vencimiento en palabras', () => {
    expect(dueCaption({ dueDate: '2026-11-17', displayStatus: 'pending' }, today)).toBe('Vence hoy');
    expect(dueCaption({ dueDate: '2026-11-18', displayStatus: 'pending' }, today)).toBe('Vence mañana');
    expect(dueCaption({ dueDate: '2026-12-05', displayStatus: 'pending' }, today)).toBe('Vence el 5 dic 2026');
    expect(dueCaption({ dueDate: '2026-11-16', displayStatus: 'overdue' }, today)).toBe('Venció hace 1 día');
    expect(dueCaption({ dueDate: '2026-11-05', displayStatus: 'overdue' }, today)).toBe('Venció hace 12 días');
    expect(dueCaption({ dueDate: '2026-11-05', displayStatus: 'paid' }, today)).toBe('Pagado');
    expect(dueCaption({ dueDate: '2026-11-05', displayStatus: 'void' }, today)).toBe('Anulado');
  });
});
