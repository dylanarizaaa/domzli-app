import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';

import { PropertyCard } from '../components/property-card';
import { useProperties } from '../hooks';

export function PropertyListScreen() {
  const router = useRouter();
  const { organizationId } = useActiveOrganization();
  const { data, isPending, error, refetch } = useProperties(organizationId);

  return (
    <Screen
      title="Inmuebles"
      onBack={() => router.back()}
      headerAction={<Button size="icon" iconStart="plus" aria-label="Registrar inmueble" onPress={() => router.push('/properties/new')} />}
    >
      {isPending ? (
        <ActivityIndicator className="mt-10" />
      ) : error ? (
        <View className="gap-3">
          <Alert tone="danger" title="No pudimos cargar tus inmuebles">{toAppError(error).message}</Alert>
          <Button variant="outline" onPress={() => refetch()}>Reintentar</Button>
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          icon="building-2"
          title="Registra tu primer inmueble"
          description="Agrega la dirección y las características. Después podrás crear su contrato."
          action={<Button iconStart="plus" onPress={() => router.push('/properties/new')}>Registrar inmueble</Button>}
        />
      ) : (
        <View className="gap-3">
          {data.map((property) => <PropertyCard key={property.id} property={property} onPress={() => router.push(`/properties/${property.id}`)} />)}
        </View>
      )}
    </Screen>
  );
}
