import { supabase } from '@/lib/supabase';

import { toTenantSummary, type TenantSummary } from './domain';
import type { TenantFormValues } from './schemas';

export async function fetchTenants(organizationId: string): Promise<TenantSummary[]> {
  const [tenants, invitations] = await Promise.all([
    supabase.from('tenants').select('*').eq('organization_id', organizationId).is('archived_at', null).order('full_name'),
    supabase.from('invitations').select('tenant_id, status, expires_at').eq('organization_id', organizationId).eq('status', 'pending'),
  ]);
  if (tenants.error) throw tenants.error;
  if (invitations.error) throw invitations.error;
  return (tenants.data ?? []).map((row) => toTenantSummary(row, invitations.data ?? []));
}

export async function createTenant(organizationId: string, values: TenantFormValues): Promise<void> {
  const { error } = await supabase.from('tenants').insert({
    organization_id: organizationId,
    full_name: values.fullName,
    document_type: values.documentType,
    document_number: values.documentNumber.replace(/[.\s]/g, ''),
    email: values.email ? values.email.toLowerCase() : null,
    phone: values.phone || null,
  });
  if (error) throw error;
}

export type CreatedInvitation = { token: string; email: string; organizationName: string; expiresAt: string };

export async function createInvitation(tenantId: string): Promise<CreatedInvitation> {
  const { data, error } = await supabase.rpc('create_invitation', { p_tenant_id: tenantId });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('INVITATION_NOT_FOUND');
  return { token: row.token, email: row.email, organizationName: row.organization_name, expiresAt: row.expires_at };
}
