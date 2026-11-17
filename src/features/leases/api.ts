import { supabase } from '@/lib/supabase';
import { uploadFile, type PickedFile } from '@/services/storage';
import type { DocumentRow, RentAdjustmentRow } from '@/types/database';

import { toLeaseSummary, type LeaseSummary } from './domain';
import type { LeaseWizardValues } from './schemas';

export async function fetchLeases(organizationId: string): Promise<LeaseSummary[]> {
  const { data, error } = await supabase
    .from('v_lease_overview')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toLeaseSummary);
}

export async function fetchLease(leaseId: string): Promise<LeaseSummary> {
  const { data, error } = await supabase.from('v_lease_overview').select('*').eq('id', leaseId).single();
  if (error) throw error;
  return toLeaseSummary(data);
}

/** Crea el borrador con su inquilino y, si se pide, lo activa. Devuelve el id del contrato. */
export async function createLease(organizationId: string, values: LeaseWizardValues, activate: boolean): Promise<string> {
  const { data: lease, error } = await supabase
    .from('leases')
    .insert({
      organization_id: organizationId,
      property_id: values.propertyId,
      lease_use: values.leaseUse,
      start_date: values.startDate,
      end_date: values.endDate,
      billing_start_date: values.billingStartDate || null,
      monthly_rent: Number(values.rentPesos),
      administration_mode: values.administrationMode,
      administration_value: values.administrationMode === 'separate' ? Number(values.administrationPesos) : 0,
      payment_day: Number(values.paymentDay),
      guarantee_type: values.guaranteeType,
      increase_type: values.increaseType,
      annual_increase_percentage: values.increaseType === 'fixed_percentage' ? Number(values.increasePercentage.replace(',', '.')) : null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: tenantError } = await supabase
    .from('lease_tenants')
    .insert({ lease_id: lease.id, tenant_id: values.tenantId, organization_id: organizationId, role: 'primary' });
  if (tenantError) throw tenantError;

  if (activate) await activateLease(lease.id);
  return lease.id;
}

export async function activateLease(leaseId: string): Promise<void> {
  const { error } = await supabase.rpc('activate_lease', { p_lease_id: leaseId });
  if (error) throw error;
}

export async function deleteDraft(leaseId: string): Promise<void> {
  const { error } = await supabase.from('leases').delete().eq('id', leaseId).eq('status', 'draft');
  if (error) throw error;
}

export async function renewLease(leaseId: string, newEndDate: string): Promise<void> {
  const { error } = await supabase.rpc('renew_lease', { p_lease_id: leaseId, p_new_end_date: newEndDate });
  if (error) throw error;
}

export async function terminateLease(leaseId: string, terminatedOn: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('terminate_lease', { p_lease_id: leaseId, p_terminated_on: terminatedOn, p_reason: reason });
  if (error) throw error;
}

export async function applyRentAdjustment(leaseId: string, effectiveFrom: string, newRentPesos: number, reason: string): Promise<void> {
  const { error } = await supabase.rpc('apply_rent_adjustment', {
    p_lease_id: leaseId, p_effective_from: effectiveFrom, p_new_rent: newRentPesos, p_reason: reason || null,
  });
  if (error) throw error;
}

export async function fetchRentAdjustments(leaseId: string): Promise<RentAdjustmentRow[]> {
  const { data, error } = await supabase
    .from('lease_rent_adjustments')
    .select('*')
    .eq('lease_id', leaseId)
    .order('effective_from', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLeaseDocuments(leaseId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('lease_id', leaseId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** P-5: los documentos se guardan en Supabase Storage, en un bucket privado. */
export async function uploadLeaseDocument(
  lease: Pick<LeaseSummary, 'id' | 'propertyId'>,
  organizationId: string,
  file: PickedFile,
  title: string,
  shared: boolean,
): Promise<void> {
  const path = await uploadFile('lease-documents', `${organizationId}/leases/${lease.id}`, file);
  const { error } = await supabase.from('documents').insert({
    organization_id: organizationId,
    lease_id: lease.id,
    property_id: lease.propertyId,
    kind: 'contract',
    title,
    storage_path: path,
    mime_type: file.mimeType,
    size_bytes: file.size ?? null,
    visibility: shared ? 'shared' : 'staff_only',
  });
  if (error) throw error;
}
