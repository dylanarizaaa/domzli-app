import { describe, expect, it } from 'vitest';

import type { FinanceOverview } from '@/features/finance/domain';
import type { PropertySummary } from '@/features/properties/domain';
import type { TenantSummary } from '@/features/tenants/domain';

import { buildLandlordHome } from './domain';

const property = (id: string, status: PropertySummary['status']): PropertySummary => ({
  id, name: `Inmueble ${id}`, address: 'x', city: 'Medellín', neighborhood: null, type: 'apartment', status,
  currentRentCents: null, tenantName: null, leaseEndDate: null,
});
const tenant = (id: string, access: TenantSummary['access']): TenantSummary => ({
  id, name: `Inquilino ${id}`, documentType: 'CC', documentMasked: 'CC •••• 0000', email: null, phone: null, access,
});
const lease = (id: string, over: Partial<Parameters<typeof buildLandlordHome>[1][number]> = {}) => ({
  id, monthly_rent: 1000000, administration_mode: 'none' as const, administration_value: 0, property_name: `Inmueble ${id}`,
  tenant_name: 'Juan Pérez', days_to_end: 200, is_expiring_soon: false, is_in_extension: false, ...over,
});

describe('buildLandlordHome', () => {
  it('invita a registrar el primer inmueble cuando no hay ninguno', () => {
    const home = buildLandlordHome([], [], []);
    expect(home.expectedMonthlyCents).toBe(0);
    expect(home.occupancyCaption).toBe('Aún no tienes inmuebles');
    expect(home.highlights.map((h) => h.key)).toEqual(['first-property']);
  });

  it('suma el canon y solo la administración que se cobra aparte', () => {
    const home = buildLandlordHome(
      [property('1', 'leased'), property('2', 'leased')],
      [
        lease('1', { monthly_rent: 1250000, administration_mode: 'separate', administration_value: 180000 }),
        lease('2', { monthly_rent: 2100000, administration_mode: 'included', administration_value: 300000 }),
      ],
      [],
    );
    expect(home.expectedMonthlyCents).toBe(353000000);
    expect(home.occupancyCaption).toBe('2 de 2 inmuebles arrendados');
  });

  it('ordena lo urgente primero: prórroga, por vencer, inquilinos sin acceso', () => {
    const home = buildLandlordHome(
      [property('1', 'leased'), property('2', 'leased'), property('3', 'available')],
      [
        lease('1', { days_to_end: 28, is_expiring_soon: true }),
        lease('2', { days_to_end: -12, is_in_extension: true }),
      ],
      [tenant('a', 'linked'), tenant('b', 'none')],
    );
    expect(home.highlights.map((h) => h.key)).toEqual(['extension-2', 'expiring-1', 'tenants-without-access']);
    expect(home.highlights[0]).toMatchObject({ tone: 'orange', title: 'Inmueble 2 venció hace 12 días' });
    expect(home.highlights[1]).toMatchObject({ tone: 'aqua', title: 'Inmueble 1 vence en 28 días' });
    expect(home.highlights[2].title).toBe('Invita a Inquilino b');
  });

  it('sin cobros del mes, la cifra protagonista es el canon esperado', () => {
    const home = buildLandlordHome([property('1', 'leased')], [lease('1')], []);
    expect(home.header).toMatchObject({ label: 'Canon mensual esperado', amountCents: 100000000, caption: '1 de 1 inmueble arrendado' });
    expect(home.inReviewCount).toBe(0);
  });

  it('con cobros: muestra lo recaudado y pone primero los pagos por revisar y los vencidos', () => {
    const overview: FinanceOverview = {
      monthStart: '2026-11-01', expectedCents: 400000000, collectedCents: 100000000, pendingCents: 300000000,
      overdueCents: 150000000, overdueCount: 2, inReviewCount: 1, inReviewCents: 50000000,
    };
    const home = buildLandlordHome(
      [property('1', 'leased'), property('2', 'leased')],
      [lease('1', { days_to_end: 20, is_expiring_soon: true })],
      [],
      {
        overview,
        inReview: [{ amountCents: 50000000, tenantName: 'Ana Gómez', reporterName: 'Ana Gómez' }],
        overdue: [
          { id: 'x', balanceCents: 50000000, availableCents: 50000000, tenantName: 'Luis', propertyName: 'Casa', daysOverdue: 3 },
          { id: 'y', balanceCents: 100000000, availableCents: 100000000, tenantName: 'Marta', propertyName: 'Apto', daysOverdue: 12 },
          { id: 'z', balanceCents: 50000000, availableCents: 0, tenantName: 'Pedro', propertyName: 'Local', daysOverdue: 30 },
        ],
      },
    );
    expect(home.header).toMatchObject({ label: 'Recaudado en noviembre', amountCents: 100000000, caption: '25 % de $ 4.000.000 esperados' });
    expect(home.inReviewCount).toBe(1);
    expect(home.highlights.map((h) => h.key)).toEqual(['payments-in-review', 'overdue-y', 'overdue-x', 'expiring-1']);
    expect(home.highlights[0]).toMatchObject({ title: '1 pago espera tu aprobación', meta: '$ 500.000 · Ana Gómez', target: 'finance' });
    expect(home.highlights[1]).toMatchObject({ title: 'Marta debe $ 1.000.000', meta: 'Apto · hace 12 días' });
  });

  it('no muestra nada cuando todo está al día', () => {
    const home = buildLandlordHome([property('1', 'leased')], [lease('1')], [tenant('a', 'linked')]);
    expect(home.highlights).toEqual([]);
    expect(home.occupancyCaption).toBe('1 de 1 inmueble arrendado');
  });
});
