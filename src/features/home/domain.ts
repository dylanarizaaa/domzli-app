import type { HighlightTone } from '@/components/ui/highlight-carousel';
import { toCents } from '@/lib/money';
import type { LeaseOverviewRow } from '@/types/database';

import type { PropertySummary } from '@/features/properties';
import type { TenantSummary } from '@/features/tenants';

export type HomeHighlight = {
  key: string;
  tone: HighlightTone;
  eyebrow: string;
  title: string;
  meta?: string;
  target: 'properties' | 'tenants' | 'leases';
};

export type LandlordHome = {
  /** Suma mensual de canon (y administración cobrada aparte) de los contratos vigentes, en centavos. */
  expectedMonthlyCents: number;
  totalProperties: number;
  leasedProperties: number;
  occupancyCaption: string;
  highlights: HomeHighlight[];
};

type ActiveLease = Pick<
  LeaseOverviewRow,
  'id' | 'monthly_rent' | 'administration_mode' | 'administration_value' | 'property_name' | 'tenant_name' | 'days_to_end' | 'is_expiring_soon' | 'is_in_extension'
>;

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Resumen del inicio del arrendador (Fase 1): lo que se espera recibir cada mes, la ocupación
 * y lo que requiere atención, ordenado por urgencia. Función pura: no consulta nada.
 */
export function buildLandlordHome(properties: PropertySummary[], activeLeases: ActiveLease[], tenants: TenantSummary[]): LandlordHome {
  const expectedMonthlyCents = activeLeases.reduce(
    (sum, lease) =>
      sum + toCents(lease.monthly_rent) + (lease.administration_mode === 'separate' ? toCents(lease.administration_value) : 0),
    0,
  );
  const totalProperties = properties.length;
  const leasedProperties = properties.filter((p) => p.status === 'leased').length;
  const highlights: HomeHighlight[] = [];

  if (totalProperties === 0) {
    highlights.push({
      key: 'first-property',
      tone: 'night',
      eyebrow: 'Primeros pasos',
      title: 'Registra tu primer inmueble',
      meta: 'Después podrás agregar al inquilino y crear el contrato.',
      target: 'properties',
    });
  }

  for (const lease of activeLeases.filter((l) => l.is_in_extension)) {
    highlights.push({
      key: `extension-${lease.id}`,
      tone: 'orange',
      eyebrow: 'Contrato en prórroga',
      title: `${lease.property_name} venció hace ${Math.abs(lease.days_to_end)} ${plural(Math.abs(lease.days_to_end), 'día', 'días')}`,
      meta: `${lease.tenant_name ?? 'Sin inquilino'} · renovar o terminar`,
      target: 'leases',
    });
  }

  for (const lease of activeLeases.filter((l) => l.is_expiring_soon).sort((a, b) => a.days_to_end - b.days_to_end)) {
    highlights.push({
      key: `expiring-${lease.id}`,
      tone: 'aqua',
      eyebrow: 'Contrato por vencer',
      title: lease.days_to_end === 0 ? `${lease.property_name} vence hoy` : `${lease.property_name} vence en ${lease.days_to_end} ${plural(lease.days_to_end, 'día', 'días')}`,
      meta: `${lease.tenant_name ?? 'Sin inquilino'} · renovar o terminar`,
      target: 'leases',
    });
  }

  const withoutAccess = tenants.filter((t) => t.access !== 'linked');
  if (withoutAccess.length > 0) {
    highlights.push({
      key: 'tenants-without-access',
      tone: 'night',
      eyebrow: 'Inquilinos sin acceso',
      title: withoutAccess.length === 1 ? `Invita a ${withoutAccess[0].name}` : `${withoutAccess.length} inquilinos sin invitar`,
      meta: 'Con la app podrán ver su contrato y sus pagos.',
      target: 'tenants',
    });
  }

  const available = properties.filter((p) => p.status === 'available').length;
  if (totalProperties > 0 && available > 0 && highlights.length < 3) {
    highlights.push({
      key: 'available-properties',
      tone: 'night',
      eyebrow: 'Inmuebles disponibles',
      title: `${available} ${plural(available, 'inmueble sin contrato', 'inmuebles sin contrato')}`,
      meta: 'Crea el contrato cuando tengas inquilino.',
      target: 'properties',
    });
  }

  return {
    expectedMonthlyCents,
    totalProperties,
    leasedProperties,
    occupancyCaption:
      totalProperties === 0
        ? 'Aún no tienes inmuebles'
        : `${leasedProperties} de ${totalProperties} ${plural(totalProperties, 'inmueble arrendado', 'inmuebles arrendados')}`,
    highlights,
  };
}
