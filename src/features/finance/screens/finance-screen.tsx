import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Text } from '@/components/ui/text';
import { formatCOP } from '@/lib/money';
import { formatPeriod } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';

import { ChargeCard } from '../components/charge-card';
import { PaymentCard } from '../components/payment-card';
import { collectionRate } from '../domain';
import { useCharges, useFinanceOverview, usePayments, useSyncCharges } from '../hooks';

/** Finanzas del arrendador: recaudo del mes, pagos por revisar y cobros pendientes. */
export function FinanceScreen() {
  const router = useRouter();
  const { organizationId } = useActiveOrganization();
  useSyncCharges(organizationId, true);
  const overview = useFinanceOverview(organizationId);
  const inReview = usePayments(organizationId, { status: 'in_review' });
  const open = useCharges(organizationId, { openOnly: true });

  const o = overview.data;
  const charges = [...(open.data ?? [])].sort((a, b) =>
    Number(b.displayStatus === 'overdue') - Number(a.displayStatus === 'overdue') || a.dueDate.localeCompare(b.dueDate),
  );

  return (
    <Screen title="Finanzas" subtitle={o ? formatPeriod(o.monthStart) : undefined}>
      {overview.error ? <Alert tone="danger" title="No pudimos cargar el resumen">{toAppError(overview.error).message}</Alert> : null}
      {o ? (
        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatTile label="Recaudado" amountCents={o.collectedCents}
              caption={o.expectedCents > 0 ? `${collectionRate(o)} % de ${formatCOP(o.expectedCents)}` : 'Sin cobros este mes'} />
            <StatTile label="Por cobrar" amountCents={o.pendingCents} caption="Saldo de todos los cobros" />
          </View>
          <View className="flex-row gap-3">
            <StatTile label="Vencido" amountCents={o.overdueCents} tone={o.overdueCount > 0 ? 'danger' : 'default'}
              caption={o.overdueCount === 1 ? '1 cobro vencido' : `${o.overdueCount} cobros vencidos`} />
            <StatTile label="En revisión" amountCents={o.inReviewCents} tone={o.inReviewCount > 0 ? 'warning' : 'default'}
              caption={o.inReviewCount === 1 ? '1 pago por revisar' : `${o.inReviewCount} pagos por revisar`} />
          </View>
        </View>
      ) : overview.isPending ? <ActivityIndicator /> : null}

      <View className="flex-row gap-2">
        <Button className="flex-1" iconStart="receipt" onPress={() => router.push('/payments/new')}>Registrar pago</Button>
        <Button className="flex-1" variant="secondary" iconStart="plus" onPress={() => router.push('/charges/new')}>Nuevo cobro</Button>
      </View>
      <Button variant="ghost" iconStart="rotate-ccw" onPress={() => router.push('/payments')}>Historial de pagos</Button>

      <View className="gap-2">
        <SectionHeader title="Pagos por revisar" />
        {inReview.isPending ? <ActivityIndicator /> : null}
        {(inReview.data ?? []).length === 0 && !inReview.isPending ? (
          <Text variant="body-sm" className="text-muted-foreground">No hay pagos pendientes de revisión.</Text>
        ) : null}
        {(inReview.data ?? []).map((p) => <PaymentCard key={p.id} payment={p} showLease onPress={() => router.push(`/payments/${p.id}`)} />)}
      </View>

      <View className="gap-2">
        <SectionHeader title="Cobros pendientes" />
        {open.isPending ? <ActivityIndicator /> : null}
        {charges.length === 0 && !open.isPending ? (
          <EmptyState icon="circle-check" title="Todo al día" description="No hay cobros pendientes. Los cobros se generan cada mes a partir de tus contratos vigentes." />
        ) : null}
        {charges.map((c) => <ChargeCard key={c.id} charge={c} showLease onPress={() => router.push(`/leases/${c.leaseId}`)} />)}
      </View>
    </Screen>
  );
}
