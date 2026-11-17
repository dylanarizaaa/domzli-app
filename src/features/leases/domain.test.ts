import { describe, expect, it } from 'vitest';

import { leaseDisplayStatus, leaseProgress, leaseTermCaption, suggestedBillingStart, suggestedEndDate } from './domain';

describe('leaseDisplayStatus', () => {
  it('la prórroga tiene prioridad sobre "por vencer"', () => {
    expect(leaseDisplayStatus({ status: 'active', is_expiring_soon: true, is_in_extension: true })).toBe('extension');
    expect(leaseDisplayStatus({ status: 'active', is_expiring_soon: true, is_in_extension: false })).toBe('expiring');
    expect(leaseDisplayStatus({ status: 'active', is_expiring_soon: false, is_in_extension: false })).toBe('active');
    expect(leaseDisplayStatus({ status: 'draft', is_expiring_soon: false, is_in_extension: false })).toBe('draft');
    expect(leaseDisplayStatus({ status: 'terminated', is_expiring_soon: true, is_in_extension: true })).toBe('terminated');
  });
});

describe('suggestedEndDate', () => {
  it('un año menos un día', () => {
    expect(suggestedEndDate('2026-11-17')).toBe('2027-11-16');
    expect(suggestedEndDate('2027-01-01')).toBe('2027-12-31');
    expect(suggestedEndDate('2028-03-01')).toBe('2029-02-28');
  });
});

describe('suggestedBillingStart', () => {
  it('no cobra meses viejos de un contrato que ya venía corriendo', () => {
    expect(suggestedBillingStart('2025-06-01', '2026-11-17')).toBe('2026-11-01');
    expect(suggestedBillingStart('2026-11-10', '2026-11-17')).toBeNull();
    expect(suggestedBillingStart('2026-12-01', '2026-11-17')).toBeNull();
  });
});

describe('leaseProgress', () => {
  it('va de 0 a 100 sin salirse del rango', () => {
    expect(leaseProgress('2026-01-01', '2026-12-31', '2025-12-01')).toBe(0);
    expect(leaseProgress('2026-01-01', '2026-12-31', '2026-07-02')).toBe(50);
    expect(leaseProgress('2026-01-01', '2026-12-31', '2027-03-01')).toBe(100);
  });
});

describe('leaseTermCaption', () => {
  it('describe la vigencia en palabras', () => {
    expect(leaseTermCaption({ displayStatus: 'extension', daysToEnd: -12 })).toBe('En prórroga desde hace 12 días');
    expect(leaseTermCaption({ displayStatus: 'expiring', daysToEnd: 0 })).toBe('Vence hoy');
    expect(leaseTermCaption({ displayStatus: 'expiring', daysToEnd: 1 })).toBe('Vence en 1 día');
    expect(leaseTermCaption({ displayStatus: 'active', daysToEnd: 200 })).toBe('200 días de vigencia');
  });
});
