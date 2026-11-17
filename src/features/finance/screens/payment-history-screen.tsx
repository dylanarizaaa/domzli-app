import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';
import type { PaymentStatus } from '@/types/database';

import { PaymentCard } from '../components/payment-card';
import { usePayments } from '../hooks';

type Filter = 'all' | PaymentStatus;

export function PaymentHistoryScreen() {
  const router = useRouter();
  const { organizationId } = useActiveOrganization();
  const [filter, setFilter] = React.useState<Filter>('all');
  const payments = usePayments(organizationId, filter === 'all' ? {} : { status: filter });

  return (
    <Screen title="Historial de pagos" onBack={() => router.back()}>
      <ChoiceChips label="Estado" value={filter} onValueChange={setFilter} options={[
        { value: 'all', label: 'Todos' },
        { value: 'in_review', label: 'En revisión' },
        { value: 'approved', label: 'Aprobados' },
        { value: 'rejected', label: 'Rechazados' },
      ]} />
      {payments.isPending ? <ActivityIndicator className="mt-6" /> : null}
      {payments.error ? <Alert tone="danger">{toAppError(payments.error).message}</Alert> : null}
      {!payments.isPending && (payments.data ?? []).length === 0 ? (
        <EmptyState icon="receipt" title="Aún no hay pagos" description="Aquí verás los pagos que registres y los que reporten tus inquilinos." />
      ) : null}
      <View className="gap-3">
        {(payments.data ?? []).map((p) => <PaymentCard key={p.id} payment={p} showLease onPress={() => router.push(`/payments/${p.id}`)} />)}
      </View>
    </Screen>
  );
}
