import type { ChargeSummary } from '@/features/finance';

export type TenantBalance = {
  /** Lo que falta por pagar, sin contar lo que ya está en revisión. */
  pendingCents: number;
  inReviewCents: number;
  overdueCents: number;
  nextDue: ChargeSummary | null;
};

/** Estado de cuenta del inquilino a partir de sus cobros abiertos. Función pura. */
export function tenantBalance(openCharges: ChargeSummary[]): TenantBalance {
  const sorted = [...openCharges].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return {
    pendingCents: sorted.reduce((s, c) => s + c.availableCents, 0),
    inReviewCents: sorted.reduce((s, c) => s + c.inReviewCents, 0),
    overdueCents: sorted.filter((c) => c.displayStatus === 'overdue').reduce((s, c) => s + c.availableCents, 0),
    nextDue: sorted.find((c) => c.availableCents > 0) ?? null,
  };
}
