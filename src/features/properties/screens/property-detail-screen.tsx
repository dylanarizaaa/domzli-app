import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { MoneyText } from '@/components/ui/money-text';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { LeaseCard, useLeases } from '@/features/leases';
import { toAppError } from '@/lib/errors';
import { toCents } from '@/lib/money';
import { useActiveOrganization } from '@/providers/auth-provider';

import { PROPERTY_TYPE_LABELS } from '../domain';
import { useProperty } from '../hooks';

export function PropertyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizationId } = useActiveOrganization();
  const property = useProperty(organizationId, id);
  const leases = useLeases(organizationId);

  if (property.isPending) return <Screen title="Inmueble" onBack={() => router.back()}><ActivityIndicator className="mt-10" /></Screen>;
  if (property.error || !property.data) {
    return <Screen title="Inmueble" onBack={() => router.back()}><Alert tone="danger">{toAppError(property.error).message}</Alert></Screen>;
  }
  const p = property.data;
  const history = (leases.data ?? []).filter((l) => l.propertyId === p.id);
  const active = history.find((l) => l.status === 'active');
  const features = [
    p.bedrooms !== null ? `${p.bedrooms} hab.` : null,
    p.bathrooms !== null ? `${p.bathrooms} baños` : null,
    p.area_m2 !== null ? `${String(p.area_m2).replace('.', ',')} m²` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Screen
      title={p.name}
      subtitle={`${p.address} · ${p.neighborhood ? `${p.neighborhood}, ` : ''}${p.city}`}
      onBack={() => router.back()}
      headerAction={<Button size="icon" variant="outline" iconStart="pencil" aria-label="Editar inmueble" onPress={() => router.push(`/properties/edit/${p.id}`)} />}
    >
      <Card className="gap-2 p-4">
        <View className="flex-row items-center justify-between">
          <StatusBadge entity="property" status={p.status} />
        </View>
        <ListRow label="Tipo">{PROPERTY_TYPE_LABELS[p.property_type]}</ListRow>
        {features ? <ListRow label="Características">{features}</ListRow> : null}
        {Number(p.administration_value) > 0 ? (
          <ListRow label="Administración"><MoneyText amountCents={toCents(p.administration_value)} className="text-sm" /></ListRow>
        ) : null}
      </Card>

      {p.status === 'available' ? (
        <Button iconStart="file-pen" onPress={() => router.push(`/leases/new?propertyId=${p.id}`)}>Crear contrato</Button>
      ) : null}

      {active ? (
        <View className="gap-2">
          <SectionHeader title="Contrato vigente" />
          <LeaseCard lease={active} onPress={() => router.push(`/leases/${active.id}`)} />
        </View>
      ) : null}

      {history.filter((l) => l.status !== 'active').length > 0 ? (
        <View className="gap-2">
          <SectionHeader title="Historial de contratos" />
          {history.filter((l) => l.status !== 'active').map((l) => (
            <LeaseCard key={l.id} lease={l} onPress={() => router.push(`/leases/${l.id}`)} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
