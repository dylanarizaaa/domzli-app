import { describe, expect, it } from 'vitest';

import type { ChargeSummary } from '@/features/finance/domain';

import { tenantBalance } from './domain';

const charge = (id: string, dueDate: string, availableCents: number, inReviewCents: number, displayStatus: ChargeSummary['displayStatus']): ChargeSummary => ({
  id, leaseId: 'l', propertyName: 'Apto 301', tenantName: 'Ana', description: id, source: 'scheduled', periodStart: dueDate, dueDate,
  totalCents: availableCents + inReviewCents, paidCents: 0, balanceCents: availableCents + inReviewCents, inReviewCents, availableCents,
  displayStatus, daysOverdue: 0, voidReason: null,
});

describe('tenantBalance', () => {
  it('separa lo pendiente, lo vencido y lo que está en revisión', () => {
    const balance = tenantBalance([
      charge('dic', '2026-12-05', 150000000, 0, 'pending'),
      charge('nov', '2026-11-05', 50000000, 50000000, 'overdue'),
    ]);
    expect(balance.pendingCents).toBe(200000000);
    expect(balance.overdueCents).toBe(50000000);
    expect(balance.inReviewCents).toBe(50000000);
    expect(balance.nextDue?.id).toBe('nov');
  });

  it('el próximo vencimiento salta cobros cubiertos por pagos en revisión', () => {
    const balance = tenantBalance([charge('nov', '2026-11-05', 0, 100000000, 'overdue'), charge('dic', '2026-12-05', 150000000, 0, 'pending')]);
    expect(balance.nextDue?.id).toBe('dic');
    expect(balance.overdueCents).toBe(0);
  });

  it('al día: nada pendiente', () => {
    expect(tenantBalance([])).toEqual({ pendingCents: 0, inReviewCents: 0, overdueCents: 0, nextDue: null });
  });
});
