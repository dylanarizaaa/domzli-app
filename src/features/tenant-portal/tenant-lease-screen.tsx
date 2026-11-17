import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { MoneyText } from '@/components/ui/money-text';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { ReceiptViewer } from '@/features/finance';
import { ADMINISTRATION_LABELS, leaseTermCaption } from '@/features/leases';
import { formatDateShort } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useActiveOrganization } from '@/providers/auth-provider';

import { useMyLease } from './hooks';

export function TenantLeaseScreen() {
  const { organizationId } = useActiveOrganization();
  const lease = useMyLease(organizationId);
  const documents = useQuery({
    queryKey: ['org', organizationId, 'my-documents', lease.data?.id],
    enabled: Boolean(lease.data?.id),
    queryFn: async () => {
      // La RLS solo devuelve los documentos compartidos de su contrato.
      const { data, error } = await supabase.from('documents').select('*').eq('lease_id', lease.data!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (lease.isPending) return <Screen title="Mi contrato"><ActivityIndicator className="mt-10" /></Screen>;
  if (lease.error) return <Screen title="Mi contrato"><Alert tone="danger">{toAppError(lease.error).message}</Alert></Screen>;
  const l = lease.data;
  if (!l) {
    return (
      <Screen title="Mi contrato">
        <Alert tone="info" title="Aún no tienes un contrato activo">Tu arrendador debe activar el contrato para que lo veas aquí.</Alert>
      </Screen>
    );
  }

  return (
    <Screen title="Mi contrato" subtitle={l.propertyName}>
      <Card className="gap-2 p-4">
        <View className="flex-row items-center justify-between">
          <StatusBadge entity="lease" status={l.displayStatus} />
          <Text variant="caption" className="text-muted-foreground">{leaseTermCaption(l)}</Text>
        </View>
        <ListRow label="Inmueble">{l.propertyName}</ListRow>
        <ListRow label="Ciudad">{l.propertyCity}</ListRow>
        <ListRow label="Canon mensual"><MoneyText amountCents={l.currentRentCents} className="font-sans-semibold text-sm" /></ListRow>
        <ListRow label="Administración">
          {l.administrationMode === 'separate' ? <MoneyText amountCents={l.administrationCents} className="text-sm" /> : ADMINISTRATION_LABELS[l.administrationMode]}
        </ListRow>
        <ListRow label="Día de pago">{`Día ${l.paymentDay} de cada mes`}</ListRow>
        <ListRow label="Inicio">{formatDateShort(l.startDate)}</ListRow>
        <ListRow label="Fin">{formatDateShort(l.endDate)}</ListRow>
      </Card>
      {l.displayStatus === 'extension' ? (
        <Alert tone="info">Tu contrato venció y sigue vigente en prórroga hasta que tú o tu arrendador lo renueven o terminen.</Alert>
      ) : null}

      <SectionHeader title="Documentos" />
      {documents.isPending ? <ActivityIndicator /> : null}
      {!documents.isPending && (documents.data ?? []).length === 0 ? (
        <Text variant="body-sm" className="text-muted-foreground">Tu arrendador aún no ha compartido documentos.</Text>
      ) : null}
      {(documents.data ?? []).map((doc) => (
        <Card key={doc.id} className="gap-2 p-3">
          <Text variant="title">{doc.title}</Text>
          <ReceiptViewer path={doc.storage_path} bucket="lease-documents" />
        </Card>
      ))}
    </Screen>
  );
}
