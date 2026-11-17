import { supabase } from '@/lib/supabase';
import { uploadFile, type PickedFile } from '@/services/storage';
import type { ChargeConcept, ChargeItemRow, PaymentMethod, PaymentStatus } from '@/types/database';

import { toChargeSummary, toFinanceOverview, toPaymentSummary, type ChargeSummary, type FinanceOverview, type PaymentSummary } from './domain';

export async function fetchFinanceOverview(organizationId: string): Promise<FinanceOverview> {
  const { data, error } = await supabase.rpc('get_finance_summary', { p_organization_id: organizationId });
  if (error) throw error;
  return toFinanceOverview(data?.[0]);
}

/** Pone al día los cobros de la organización (idempotente). Respaldo de la tarea programada. */
export async function syncCharges(organizationId: string): Promise<number> {
  const { data, error } = await supabase.rpc('generate_due_charges', { p_organization_id: organizationId });
  if (error) throw error;
  return data ?? 0;
}

export type ChargeFilter = { leaseId?: string; openOnly?: boolean };

export async function fetchCharges(organizationId: string, filter: ChargeFilter = {}): Promise<ChargeSummary[]> {
  let query = supabase.from('v_charge_balances').select('*').eq('organization_id', organizationId);
  if (filter.leaseId) query = query.eq('lease_id', filter.leaseId);
  if (filter.openOnly) query = query.in('status', ['pending', 'partially_paid']);
  const { data, error } = await query.order('due_date', { ascending: !filter.leaseId || filter.openOnly === true }).limit(200);
  if (error) throw error;
  return (data ?? []).map(toChargeSummary);
}

export async function fetchChargeItems(chargeIds: string[]): Promise<ChargeItemRow[]> {
  if (chargeIds.length === 0) return [];
  const { data, error } = await supabase.from('charge_items').select('*').in('charge_id', chargeIds).order('created_at');
  if (error) throw error;
  return data ?? [];
}

export type PaymentFilter = { leaseId?: string; status?: PaymentStatus };

export async function fetchPayments(organizationId: string, filter: PaymentFilter = {}): Promise<PaymentSummary[]> {
  let query = supabase.from('v_payment_overview').select('*').eq('organization_id', organizationId);
  if (filter.leaseId) query = query.eq('lease_id', filter.leaseId);
  if (filter.status) query = query.eq('status', filter.status);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []).map(toPaymentSummary);
}

export async function fetchPayment(paymentId: string): Promise<PaymentSummary> {
  const { data, error } = await supabase.from('v_payment_overview').select('*').eq('id', paymentId).single();
  if (error) throw error;
  return toPaymentSummary(data);
}

export type ReportPaymentInput = {
  organizationId: string;
  leaseId: string;
  amountPesos: number;
  paidOn: string;
  method: PaymentMethod;
  reference: string;
  chargeIds: string[];
  receipt: PickedFile | null;
};

/** Sube el comprobante (si hay) y registra el pago. El inquilino queda en revisión; el staff, aprobado. */
export async function reportPayment(input: ReportPaymentInput): Promise<void> {
  const receiptPath = input.receipt
    ? await uploadFile('payment-receipts', `${input.organizationId}/leases/${input.leaseId}/payments`, input.receipt)
    : null;
  const { error } = await supabase.rpc('report_payment', {
    p_lease_id: input.leaseId,
    p_amount: input.amountPesos,
    p_paid_on: input.paidOn,
    p_method: input.method,
    p_reference: input.reference || null,
    p_receipt_path: receiptPath,
    p_charge_ids: input.chargeIds.length > 0 ? input.chargeIds : null,
  });
  if (error) throw error;
}

export async function reviewPayment(paymentId: string, decision: 'approve' | 'reject', reason?: string): Promise<void> {
  const { error } = await supabase.rpc('review_payment', { p_payment_id: paymentId, p_decision: decision, p_reason: reason ?? null });
  if (error) throw error;
}

export async function cancelPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_payment', { p_payment_id: paymentId });
  if (error) throw error;
}

export async function reversePayment(paymentId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('reverse_payment', { p_payment_id: paymentId, p_reason: reason });
  if (error) throw error;
}

export async function createManualCharge(input: { leaseId: string; dueDate: string; concept: ChargeConcept; description: string; amountPesos: number }): Promise<void> {
  const { error } = await supabase.rpc('create_manual_charge', {
    p_lease_id: input.leaseId, p_due_date: input.dueDate, p_concept: input.concept, p_description: input.description, p_amount: input.amountPesos,
  });
  if (error) throw error;
}

export async function voidCharge(chargeId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('void_charge', { p_charge_id: chargeId, p_reason: reason });
  if (error) throw error;
}
