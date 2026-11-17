import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';

import { LeaseCard } from '../components/lease-card';
import { useLeases } from '../hooks';

type Filter = 'active' | 'draft' | 'terminated';

export function LeaseListScreen() {
  const router = useRouter();
  const { organizationId } = useActiveOrganization();
  const { data, isPending, error, refetch } = useLeases(organizationId);
  const [filter, setFilter] = React.useState<Filter>('active');

  const leases = (data ?? []).filter((lease) => lease.status === filter);
  const counts = (status: Filter) => (data ?? []).filter((l) => l.status === status).length;

  return (
    <Screen
      title="Contratos"
      headerAction={<Button size="icon" iconStart="plus" aria-label="Crear contrato" onPress={() => router.push('/leases/new')} />}
    >
      <ChoiceChips
        label="Estado del contrato"
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: 'active', label: `Vigentes (${counts('active')})` },
          { value: 'draft', label: `Borradores (${counts('draft')})` },
          { value: 'terminated', label: `Finalizados (${counts('terminated')})` },
        ]}
      />
      {isPending ? (
        <ActivityIndicator className="mt-10" />
      ) : error ? (
        <View className="gap-3">
          <Alert tone="danger" title="No pudimos cargar tus contratos">{toAppError(error).message}</Alert>
          <Button variant="outline" onPress={() => refetch()}>Reintentar</Button>
        </View>
      ) : leases.length === 0 ? (
        <EmptyState
          icon="file-text"
          title={filter === 'active' ? 'No tienes contratos vigentes' : filter === 'draft' ? 'No tienes borradores' : 'Aún no hay contratos finalizados'}
          description={filter === 'active' ? 'Une un inmueble disponible con su inquilino para empezar a generar cobros.' : undefined}
          action={filter === 'active' ? <Button iconStart="plus" onPress={() => router.push('/leases/new')}>Crear contrato</Button> : undefined}
        />
      ) : (
        <View className="gap-3">
          {leases.map((lease) => (
            <LeaseCard key={lease.id} lease={lease} onPress={() => router.push(`/leases/${lease.id}`)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
