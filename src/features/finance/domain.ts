import type { IconName } from '@/components/ui/icon';
import { daysBetween, formatDateShort, todayISO, type ISODate } from '@/lib/dates';
import { toCents } from '@/lib/money';
import type {
  ChargeBalanceRow, ChargeConcept, ChargeSource, FinanceSummaryRow, PaymentMethod, PaymentOverviewRow, PaymentSource, PaymentStatus,
} from '@/types/database';

export type ChargeDisplayStatus = 'pending' | 'overdue' | 'partially_paid' | 'paid' | 'void';

export type ChargeSummary = {
  id: string;
  leaseId: string;
  propertyName: string;
  tenantName: string | null;
  description: string;
  source: ChargeSource;
  periodStart: ISODate;
  dueDate: ISODate;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  inReviewCents: number;
  /** Lo que aún se puede pagar: saldo menos lo comprometido por pagos en revisión. */
  availableCents: number;
  displayStatus: ChargeDisplayStatus;
  daysOverdue: number;
  voidReason: string | null;
};

export type PaymentSummary = {
  id: string;
  leaseId: string;
  amountCents: number;
  paidOn: ISODate;
  method: PaymentMethod;
  reference: string | null;
  receiptPath: string | null;
  source: PaymentSource;
  status: PaymentStatus;
  propertyName: string;
  tenantName: string | null;
  reporterName: string | null;
  appliedTo: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
};

export type FinanceOverview = {
  monthStart: ISODate;
  expectedCents: number;
  collectedCents: number;
  pendingCents: number;
  overdueCents: number;
  overdueCount: number;
  inReviewCount: number;
  inReviewCents: number;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Transferencia',
  bre_b: 'Bre-B',
  pse: 'PSE',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  cash: 'Efectivo',
  card: 'Tarjeta',
  other: 'Otro',
};

// Icono genérico + nombre: los logos de terceros solo con autorización de la marca.
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, IconName> = {
  bank_transfer: 'landmark',
  bre_b: 'zap',
  pse: 'landmark',
  nequi: 'smartphone',
  daviplata: 'smartphone',
  cash: 'banknote',
  card: 'credit-card',
  other: 'circle-dollar-sign',
};

export const CHARGE_CONCEPT_LABELS: Record<ChargeConcept, string> = {
  rent: 'Canon',
  administration: 'Administración',
  utility: 'Servicio público',
  repair: 'Reparación',
  other: 'Otro',
};

export function chargeDisplayStatus(row: Pick<ChargeBalanceRow, 'status' | 'is_overdue'>): ChargeDisplayStatus {
  if (row.status === 'void' || row.status === 'paid') return row.status;
  return row.is_overdue ? 'overdue' : row.status;
}

export function toChargeSummary(row: ChargeBalanceRow): ChargeSummary {
  const balanceCents = toCents(row.balance);
  const inReviewCents = toCents(row.in_review_amount);
  return {
    id: row.id,
    leaseId: row.lease_id,
    propertyName: row.property_name,
    tenantName: row.tenant_name,
    description: row.description ?? 'Cobro',
    source: row.source,
    periodStart: row.period_start,
    dueDate: row.due_date,
    totalCents: toCents(row.total_amount),
    paidCents: toCents(row.paid_amount),
    balanceCents,
    inReviewCents,
    availableCents: Math.max(0, balanceCents - inReviewCents),
    displayStatus: chargeDisplayStatus(row),
    daysOverdue: row.days_overdue,
    voidReason: row.void_reason,
  };
}

export function toPaymentSummary(row: PaymentOverviewRow): PaymentSummary {
  return {
    id: row.id,
    leaseId: row.lease_id,
    amountCents: toCents(row.amount),
    paidOn: row.paid_on,
    method: row.method,
    reference: row.reference,
    receiptPath: row.receipt_path,
    source: row.source,
    status: row.status,
    propertyName: row.property_name,
    tenantName: row.tenant_name,
    reporterName: row.reporter_name,
    appliedTo: row.applied_to,
    rejectionReason: row.rejection_reason,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function toFinanceOverview(row: FinanceSummaryRow | undefined): FinanceOverview {
  return {
    monthStart: row?.month_start ?? `${todayISO().slice(0, 7)}-01`,
    expectedCents: toCents(row?.expected),
    collectedCents: toCents(row?.collected),
    pendingCents: toCents(row?.pending),
    overdueCents: toCents(row?.overdue),
    overdueCount: row?.overdue_count ?? 0,
    inReviewCount: row?.in_review_count ?? 0,
    inReviewCents: toCents(row?.in_review_amount),
  };
}

/** Porcentaje recaudado de lo que vence en el mes (0–100). */
export function collectionRate(overview: Pick<FinanceOverview, 'expectedCents' | 'collectedCents'>): number {
  if (overview.expectedCents <= 0) return 0;
  return Math.min(100, Math.round((overview.collectedCents / overview.expectedCents) * 100));
}

/** "Vence el 5 nov 2026", "Vence hoy", "Vence mañana", "Venció hace 3 días". */
export function dueCaption(charge: Pick<ChargeSummary, 'dueDate' | 'displayStatus'>, today: ISODate = todayISO()): string {
  if (charge.displayStatus === 'paid') return 'Pagado';
  if (charge.displayStatus === 'void') return 'Anulado';
  const days = daysBetween(today, charge.dueDate);
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  if (days < 0) return `Venció hace ${-days} ${days === -1 ? 'día' : 'días'}`;
  return `Vence el ${formatDateShort(charge.dueDate)}`;
}

export type AllocationPreview = { allocations: { chargeId: string; cents: number }[]; remainingCents: number };

/**
 * Vista previa de cómo se aplicará un pago, con la misma regla que la base de datos:
 * a los cobros elegidos (o a todos), del vencimiento más antiguo al más reciente.
 * Es solo informativa: la base de datos decide y valida.
 */
export function previewAllocation(
  charges: Pick<ChargeSummary, 'id' | 'dueDate' | 'periodStart' | 'availableCents'>[],
  amountCents: number,
  selectedIds?: string[],
): AllocationPreview {
  const pool = charges
    .filter((c) => c.availableCents > 0 && (!selectedIds || selectedIds.length === 0 || selectedIds.includes(c.id)))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.periodStart.localeCompare(b.periodStart) || a.id.localeCompare(b.id));
  let remaining = Math.max(0, Math.round(amountCents));
  const allocations: AllocationPreview['allocations'] = [];
  for (const charge of pool) {
    if (remaining <= 0) break;
    const cents = Math.min(charge.availableCents, remaining);
    allocations.push({ chargeId: charge.id, cents });
    remaining -= cents;
  }
  return { allocations, remainingCents: remaining };
}

/** Total que se puede pagar entre los cobros elegidos (o todos). */
export function payableCents(charges: Pick<ChargeSummary, 'id' | 'availableCents'>[], selectedIds?: string[]): number {
  return charges
    .filter((c) => !selectedIds || selectedIds.length === 0 || selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.availableCents, 0);
}

export const REJECTION_REASONS = [
  'El comprobante no es legible',
  'El monto no coincide',
  'No encontramos la transferencia',
  'El comprobante no corresponde a este contrato',
];
