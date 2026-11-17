import type { IdDocumentType, InvitationRow, TenantRow } from '@/types/database';

export type TenantAccess = 'linked' | 'invited' | 'expired' | 'none';

export type TenantSummary = {
  id: string;
  name: string;
  documentType: IdDocumentType;
  documentMasked: string;
  email: string | null;
  phone: string | null;
  access: TenantAccess;
};

export const DOCUMENT_TYPE_LABELS: Record<IdDocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PA: 'Pasaporte',
  PPT: 'Permiso por protección temporal',
  NIT: 'NIT',
};

/** "CC •••• 4050": en listas el documento siempre va enmascarado. */
export function maskDocument(type: IdDocumentType, number: string): string {
  const clean = number.replace(/\s/g, '');
  return `${type} •••• ${clean.slice(-4)}`;
}

type PendingInvitation = Pick<InvitationRow, 'tenant_id' | 'status' | 'expires_at'>;

export function tenantAccess(tenant: Pick<TenantRow, 'id' | 'profile_id'>, invitations: PendingInvitation[], now: Date = new Date()): TenantAccess {
  if (tenant.profile_id) return 'linked';
  const pending = invitations.find((i) => i.tenant_id === tenant.id && i.status === 'pending');
  if (!pending) return 'none';
  return new Date(pending.expires_at).getTime() < now.getTime() ? 'expired' : 'invited';
}

export function toTenantSummary(row: TenantRow, invitations: PendingInvitation[], now?: Date): TenantSummary {
  return {
    id: row.id,
    name: row.full_name,
    documentType: row.document_type,
    documentMasked: maskDocument(row.document_type, row.document_number),
    email: row.email,
    phone: row.phone,
    access: tenantAccess(row, invitations, now),
  };
}

/** Enlace que el arrendador comparte con el inquilino mientras no haya proveedor de correo (P-10). */
export function invitationLink(token: string): string {
  return `domzli://invite/${token}`;
}

export function invitationMessage(organizationName: string, token: string): string {
  return `${organizationName} te invita a Domzli para consultar tu contrato y tus pagos. Abre este enlace desde tu celular con la app instalada: ${invitationLink(token)}\nEl enlace vence en 7 días.`;
}
