import { parseISODate, toISODate, todayISO, type ISODate } from '@/lib/dates';
import { toCents } from '@/lib/money';
import type {
  AdministrationMode, GuaranteeType, IncreaseType, LeaseOverviewRow, LeaseStatus, LeaseUse,
} from '@/types/database';

export type LeaseDisplayStatus = 'draft' | 'active' | 'expiring' | 'extension' | 'terminated';

export const LEASE_USE_LABELS: Record<LeaseUse, string> = { residential: 'Vivienda', commercial: 'Comercial' };
export const ADMINISTRATION_LABELS: Record<AdministrationMode, string> = {
  separate: 'Se cobra aparte',
  included: 'Incluida en el canon',
  none: 'No aplica',
};
// P-12: sin depósitos en dinero.
export const GUARANTEE_LABELS: Record<GuaranteeType, string> = {
  none: 'Sin garantía',
  co_signer: 'Codeudor',
  insurance_policy: 'Póliza de arrendamiento',
};
export const INCREASE_LABELS: Record<IncreaseType, string> = {
  ipc: 'IPC anual',
  fixed_percentage: 'Porcentaje fijo',
  none: 'Sin reajuste',
};

export type LeaseSummary = {
  id: string;
  status: LeaseStatus;
  displayStatus: LeaseDisplayStatus;
  propertyId: string;
  propertyName: string;
  propertyCity: string;
  tenantId: string | null;
  tenantName: string | null;
  startDate: ISODate;
  endDate: ISODate;
  billingStartDate: ISODate | null;
  currentRentCents: number;
  administrationMode: AdministrationMode;
  administrationCents: number;
  paymentDay: number;
  leaseUse: LeaseUse;
  guaranteeType: GuaranteeType;
  increaseType: IncreaseType;
  annualIncreasePercentage: number | null;
  daysToEnd: number;
  terminatedOn: ISODate | null;
  terminationReason: string | null;
};

export function leaseDisplayStatus(row: Pick<LeaseOverviewRow, 'status' | 'is_expiring_soon' | 'is_in_extension'>): LeaseDisplayStatus {
  if (row.status !== 'active') return row.status;
  if (row.is_in_extension) return 'extension';
  if (row.is_expiring_soon) return 'expiring';
  return 'active';
}

export function toLeaseSummary(row: LeaseOverviewRow): LeaseSummary {
  return {
    id: row.id,
    status: row.status,
    displayStatus: leaseDisplayStatus(row),
    propertyId: row.property_id,
    propertyName: row.property_name,
    propertyCity: row.property_city,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    startDate: row.start_date,
    endDate: row.end_date,
    billingStartDate: row.billing_start_date,
    currentRentCents: toCents(row.current_rent ?? row.monthly_rent),
    administrationMode: row.administration_mode,
    administrationCents: toCents(row.administration_value),
    paymentDay: row.payment_day,
    leaseUse: row.lease_use,
    guaranteeType: row.guarantee_type,
    increaseType: row.increase_type,
    annualIncreasePercentage: row.annual_increase_percentage,
    daysToEnd: row.days_to_end,
    terminatedOn: row.terminated_on,
    terminationReason: row.termination_reason,
  };
}

/** Avance de la vigencia del contrato, de 0 a 100. */
export function leaseProgress(startDate: ISODate, endDate: ISODate, today: ISODate = todayISO()): number {
  const start = parseISODate(startDate).getTime();
  const end = parseISODate(endDate).getTime();
  const now = parseISODate(today).getTime();
  if (end <= start) return 100;
  return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
}

/** Fecha final sugerida: un año menos un día desde el inicio. */
export function suggestedEndDate(startDate: ISODate): ISODate {
  const date = parseISODate(startDate);
  return toISODate(new Date(date.getFullYear() + 1, date.getMonth(), date.getDate() - 1));
}

/**
 * Inicio de cobro sugerido: si el contrato empezó antes del mes actual (un contrato que ya venía
 * corriendo), se cobra en Domzli desde el primer día del mes actual. Si no, desde el inicio.
 */
export function suggestedBillingStart(startDate: ISODate, today: ISODate = todayISO()): ISODate | null {
  const monthStart = `${today.slice(0, 7)}-01`;
  return startDate < monthStart ? monthStart : null;
}

/** Vigencia en palabras: "Vence en 28 días", "En prórroga desde hace 12 días". */
export function leaseTermCaption(lease: Pick<LeaseSummary, 'displayStatus' | 'daysToEnd'>): string {
  const days = Math.abs(lease.daysToEnd);
  const unit = days === 1 ? 'día' : 'días';
  switch (lease.displayStatus) {
    case 'extension':
      return `En prórroga desde hace ${days} ${unit}`;
    case 'expiring':
      return lease.daysToEnd === 0 ? 'Vence hoy' : `Vence en ${days} ${unit}`;
    case 'active':
      return `${days} ${unit} de vigencia`;
    case 'draft':
      return 'Sin activar';
    case 'terminated':
      return 'Finalizado';
  }
}
