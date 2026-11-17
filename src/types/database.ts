/**
 * Tipos del esquema de la base de datos (Fases 1 y 2).
 *
 * PROVISIONAL: escrito a mano a partir de supabase/migrations. En cuanto exista el proyecto de
 * Supabase, reemplazar con la salida de:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 */

export type MembershipRole = 'owner' | 'admin' | 'tenant';
export type MembershipStatus = 'active' | 'suspended' | 'revoked';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';
export type PropertyType =
  | 'apartment' | 'house' | 'studio' | 'room' | 'commercial' | 'office' | 'warehouse' | 'lot' | 'other';
export type PropertyStatus = 'available' | 'leased' | 'maintenance' | 'inactive';
export type IdDocumentType = 'CC' | 'CE' | 'PA' | 'PPT' | 'NIT';
export type LeaseUse = 'residential' | 'commercial';
export type LeaseStatus = 'draft' | 'active' | 'terminated';
export type AdministrationMode = 'none' | 'included' | 'separate';
export type GuaranteeType = 'none' | 'co_signer' | 'insurance_policy';
export type IncreaseType = 'ipc' | 'fixed_percentage' | 'none';
export type LeasePartyRole = 'primary' | 'co_tenant' | 'guarantor';
export type ChargeStatus = 'pending' | 'partially_paid' | 'paid' | 'void';
export type ChargeSource = 'scheduled' | 'manual';
export type ChargeConcept = 'rent' | 'administration' | 'utility' | 'repair' | 'other';
export type PaymentMethod = 'bank_transfer' | 'bre_b' | 'pse' | 'nequi' | 'daviplata' | 'cash' | 'card' | 'other';
export type PaymentStatus = 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'reversed';
export type PaymentSource = 'tenant_report' | 'staff_record' | 'gateway';
export type AdjustmentType = 'ipc' | 'fixed' | 'negotiated';
export type DocumentKind = 'contract' | 'addendum' | 'inventory' | 'id_copy' | 'other';
export type DocumentVisibility = 'staff_only' | 'shared';

type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = Timestamps & {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  data_consent_version: string | null;
  data_consent_at: string | null;
  deleted_at: string | null;
};

export type OrganizationRow = Timestamps & {
  id: string;
  name: string;
  tax_id: string | null;
  currency: string;
  timezone: string;
  created_by: string | null;
};

export type MembershipRow = Timestamps & {
  id: string;
  organization_id: string;
  user_id: string;
  role: MembershipRole;
  status: MembershipStatus;
};

export type PropertyRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  property_type: PropertyType;
  address: string;
  city: string;
  department: string | null;
  neighborhood: string | null;
  stratum: number | null;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  administration_value: number;
  status: PropertyStatus;
  notes: string | null;
  archived_at: string | null;
  created_by: string | null;
};

export type TenantRow = Timestamps & {
  id: string;
  organization_id: string;
  profile_id: string | null;
  full_name: string;
  document_type: IdDocumentType;
  document_number: string;
  email: string | null;
  phone: string | null;
  archived_at: string | null;
  created_by: string | null;
};

export type InvitationRow = {
  id: string;
  organization_id: string;
  tenant_id: string;
  email: string;
  role: MembershipRole;
  token_hash: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
};

export type LeaseRow = Timestamps & {
  id: string;
  organization_id: string;
  property_id: string;
  lease_use: LeaseUse;
  status: LeaseStatus;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  administration_mode: AdministrationMode;
  administration_value: number;
  payment_day: number;
  guarantee_type: GuaranteeType;
  increase_type: IncreaseType;
  annual_increase_percentage: number | null;
  billing_start_date: string | null;
  notes: string | null;
  activated_at: string | null;
  terminated_on: string | null;
  termination_reason: string | null;
  created_by: string | null;
};

export type LeaseTenantRow = {
  lease_id: string;
  tenant_id: string;
  organization_id: string;
  role: LeasePartyRole;
  portal_access: boolean;
  created_at: string;
};

export type LeaseOverviewRow = LeaseRow & {
  current_rent: number;
  property_name: string;
  property_city: string;
  tenant_id: string | null;
  tenant_name: string | null;
  days_to_end: number;
  is_expiring_soon: boolean;
  is_in_extension: boolean;
};

export type PropertyOverviewRow = PropertyRow & {
  active_lease_id: string | null;
  current_rent: number | null;
  lease_end_date: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
};

export type DocumentRow = {
  id: string;
  organization_id: string;
  property_id: string | null;
  lease_id: string | null;
  tenant_id: string | null;
  kind: DocumentKind;
  title: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  visibility: DocumentVisibility;
  uploaded_by: string | null;
  archived_at: string | null;
  created_at: string;
};

export type ChargeRow = Timestamps & {
  id: string;
  organization_id: string;
  lease_id: string;
  source: ChargeSource;
  period_start: string;
  period_end: string;
  due_date: string;
  description: string | null;
  total_amount: number;
  paid_amount: number;
  status: ChargeStatus;
  voided_at: string | null;
  void_reason: string | null;
  created_by: string | null;
};

export type ChargeItemRow = {
  id: string;
  organization_id: string;
  charge_id: string;
  concept: ChargeConcept;
  description: string;
  amount: number;
  created_at: string;
};

export type ChargeBalanceRow = ChargeRow & {
  balance: number;
  in_review_amount: number;
  is_overdue: boolean;
  days_overdue: number;
  lease_status: LeaseStatus;
  property_id: string;
  property_name: string;
  tenant_name: string | null;
};

export type PaymentRow = Timestamps & {
  id: string;
  organization_id: string;
  lease_id: string;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  reference: string | null;
  receipt_path: string | null;
  source: PaymentSource;
  status: PaymentStatus;
  notes: string | null;
  reported_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

export type PaymentOverviewRow = PaymentRow & {
  property_name: string;
  tenant_name: string | null;
  reporter_name: string | null;
  applied_to: string | null;
};

export type RentAdjustmentRow = {
  id: string;
  organization_id: string;
  lease_id: string;
  effective_from: string;
  previous_rent: number;
  new_rent: number;
  adjustment_type: AdjustmentType;
  percentage: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

export type FinanceSummaryRow = {
  month_start: string;
  expected: number;
  collected: number;
  pending: number;
  overdue: number;
  overdue_count: number;
  in_review_count: number;
  in_review_amount: number;
};

type TableDef<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, 'id'>;
      organizations: TableDef<OrganizationRow, 'name'>;
      memberships: TableDef<MembershipRow, 'organization_id' | 'user_id' | 'role'>;
      properties: TableDef<PropertyRow, 'organization_id' | 'name' | 'address' | 'city'>;
      tenants: TableDef<TenantRow, 'organization_id' | 'full_name' | 'document_type' | 'document_number'>;
      invitations: TableDef<InvitationRow>;
      leases: TableDef<LeaseRow, 'organization_id' | 'property_id' | 'start_date' | 'end_date' | 'monthly_rent'>;
      lease_tenants: TableDef<LeaseTenantRow, 'lease_id' | 'tenant_id' | 'organization_id'>;
      documents: TableDef<DocumentRow, 'organization_id' | 'title' | 'storage_path'>;
      charges: TableDef<ChargeRow>;
      charge_items: TableDef<ChargeItemRow>;
      payments: TableDef<PaymentRow>;
      lease_rent_adjustments: TableDef<RentAdjustmentRow>;
      ipc_annual: TableDef<{ year: number; variation: number; source: string; created_at: string }>;
    };
    Views: {
      v_lease_overview: { Row: LeaseOverviewRow; Relationships: [] };
      v_property_overview: { Row: PropertyOverviewRow; Relationships: [] };
      v_charge_balances: { Row: ChargeBalanceRow; Relationships: [] };
      v_payment_overview: { Row: PaymentOverviewRow; Relationships: [] };
    };
    Functions: {
      create_organization: { Args: { p_name: string; p_tax_id?: string | null }; Returns: OrganizationRow };
      my_contexts: {
        Args: Record<string, never>;
        Returns: { organization_id: string; organization_name: string; role: MembershipRole }[];
      };
      create_invitation: {
        Args: { p_tenant_id: string };
        Returns: { invitation_id: string; token: string; email: string; organization_name: string; expires_at: string }[];
      };
      get_invitation_preview: {
        Args: { p_token: string };
        Returns: { organization_name: string; email_masked: string; status: InvitationStatus; expires_at: string }[];
      };
      accept_invitation: { Args: { p_token: string }; Returns: string };
      revoke_invitation: { Args: { p_invitation_id: string }; Returns: undefined };
      activate_lease: { Args: { p_lease_id: string }; Returns: LeaseRow };
      renew_lease: { Args: { p_lease_id: string; p_new_end_date: string }; Returns: LeaseRow };
      terminate_lease: { Args: { p_lease_id: string; p_terminated_on: string; p_reason: string }; Returns: LeaseRow };
      generate_due_charges: { Args: { p_organization_id: string }; Returns: number };
      create_manual_charge: {
        Args: { p_lease_id: string; p_due_date: string; p_concept: ChargeConcept; p_description: string; p_amount: number };
        Returns: ChargeRow;
      };
      void_charge: { Args: { p_charge_id: string; p_reason: string }; Returns: ChargeRow };
      report_payment: {
        Args: {
          p_lease_id: string;
          p_amount: number;
          p_paid_on: string;
          p_method: PaymentMethod;
          p_reference?: string | null;
          p_receipt_path?: string | null;
          p_charge_ids?: string[] | null;
          p_notes?: string | null;
        };
        Returns: PaymentRow;
      };
      review_payment: { Args: { p_payment_id: string; p_decision: 'approve' | 'reject'; p_reason?: string | null }; Returns: PaymentRow };
      cancel_payment: { Args: { p_payment_id: string }; Returns: PaymentRow };
      reverse_payment: { Args: { p_payment_id: string; p_reason: string }; Returns: PaymentRow };
      apply_rent_adjustment: {
        Args: { p_lease_id: string; p_effective_from: string; p_new_rent: number; p_reason?: string | null };
        Returns: RentAdjustmentRow;
      };
      get_finance_summary: { Args: { p_organization_id: string; p_month?: string | null }; Returns: FinanceSummaryRow[] };
    };
    Enums: {
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
      invitation_status: InvitationStatus;
      property_type: PropertyType;
      property_status: PropertyStatus;
      id_document_type: IdDocumentType;
      lease_use: LeaseUse;
      lease_status: LeaseStatus;
      administration_mode: AdministrationMode;
      guarantee_type: GuaranteeType;
      increase_type: IncreaseType;
      lease_party_role: LeasePartyRole;
      charge_status: ChargeStatus;
      charge_source: ChargeSource;
      charge_concept: ChargeConcept;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      payment_source: PaymentSource;
      adjustment_type: AdjustmentType;
      document_kind: DocumentKind;
      document_visibility: DocumentVisibility;
    };
    CompositeTypes: Record<string, never>;
  };
};
