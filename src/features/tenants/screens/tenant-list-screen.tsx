import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Share, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';

import { TenantCard } from '../components/tenant-card';
import { invitationMessage } from '../domain';
import { useCreateInvitation, useTenants } from '../hooks';

export function TenantListScreen() {
  const router = useRouter();
  const { organizationId } = useActiveOrganization();
  const { data, isPending, error, refetch } = useTenants(organizationId);
  const createInvitation = useCreateInvitation(organizationId);
  const [invitingId, setInvitingId] = React.useState<string | null>(null);

  // Mientras no haya proveedor de correo (P-10), el arrendador comparte el enlace él mismo.
  const invite = async (tenantId: string) => {
    setInvitingId(tenantId);
    try {
      const invitation = await createInvitation.mutateAsync(tenantId);
      await Share.share({ message: invitationMessage(invitation.organizationName, invitation.token) });
    } catch {
      // El error queda en createInvitation.error y se muestra arriba.
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <Screen
      title="Inquilinos"
      onBack={() => router.back()}
      headerAction={<Button size="icon" iconStart="plus" aria-label="Registrar inquilino" onPress={() => router.push('/tenants/new')} />}
    >
      {createInvitation.error ? (
        <Alert tone="danger" title="No pudimos crear la invitación">{toAppError(createInvitation.error).message}</Alert>
      ) : null}
      {isPending ? (
        <ActivityIndicator className="mt-10" />
      ) : error ? (
        <View className="gap-3">
          <Alert tone="danger" title="No pudimos cargar tus inquilinos">{toAppError(error).message}</Alert>
          <Button variant="outline" onPress={() => refetch()}>Reintentar</Button>
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          icon="users"
          title="Registra tu primer inquilino"
          description="Guarda sus datos de contacto. Después podrás invitarlo a la app y crear su contrato."
          action={<Button iconStart="plus" onPress={() => router.push('/tenants/new')}>Registrar inquilino</Button>}
        />
      ) : (
        <View className="gap-3">
          {data.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} inviting={invitingId === tenant.id} onInvite={() => invite(tenant.id)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
