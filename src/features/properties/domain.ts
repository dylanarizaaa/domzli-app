import { toCents } from '@/lib/money';
import type { PropertyOverviewRow, PropertyStatus, PropertyType } from '@/types/database';

export type PropertySummary = {
  id: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string | null;
  type: PropertyType;
  status: PropertyStatus;
  currentRentCents: number | null;
  tenantName: string | null;
  leaseEndDate: string | null;
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartamento',
  house: 'Casa',
  studio: 'Apartaestudio',
  room: 'Habitación',
  commercial: 'Local comercial',
  office: 'Oficina',
  warehouse: 'Bodega',
  lot: 'Lote',
  other: 'Otro',
};

export function toPropertySummary(row: PropertyOverviewRow): PropertySummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    neighborhood: row.neighborhood,
    type: row.property_type,
    status: row.status,
    currentRentCents: row.current_rent === null ? null : toCents(row.current_rent),
    tenantName: row.tenant_name,
    leaseEndDate: row.lease_end_date,
  };
}

/** "Laureles, Medellín" o solo la ciudad si no hay barrio. */
export function propertyLocation(property: Pick<PropertySummary, 'neighborhood' | 'city'>): string {
  return property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city;
}
