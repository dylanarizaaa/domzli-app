import { View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';

import type { TenantSummary } from '../domain';

export type TenantCardProps = {
  tenant: TenantSummary;
  onEdit?: () => void;
  inviting?: boolean;
  onInvite?: () => void;
};

/** Ficha resumida de un inquilino con su estado de acceso y la acción de invitar. */
export function TenantCard({ tenant, inviting, onInvite, onEdit }: TenantCardProps) {
  const canInvite = tenant.access !== 'linked';
  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-center gap-3">
        <Avatar name={tenant.name} size={40} />
        <View className="flex-1">
          <Text variant="title" numberOfLines={1}>{tenant.name}</Text>
          <Text variant="body-sm" className="text-muted-foreground">{tenant.documentMasked}</Text>
        </View>
        <StatusBadge entity="access" status={tenant.access} size="sm" />
      </View>
      {onEdit ? (
        <Button variant="ghost" size="sm" iconStart="pencil" className="self-start px-0" onPress={onEdit}>Editar datos</Button>
      ) : null}
      {tenant.phone ? (
        <View className="flex-row items-center gap-1.5">
          <Icon name="phone" size={16} className="text-muted-foreground" />
          <Text variant="body-sm" className="text-muted-foreground">{tenant.phone}</Text>
        </View>
      ) : null}
      {canInvite ? (
        tenant.email ? (
          <Button variant="secondary" iconStart="share-2" loading={inviting} onPress={onInvite}>
            {tenant.access === 'none' ? 'Invitar a la app' : 'Compartir invitación de nuevo'}
          </Button>
        ) : (
          <Text variant="caption" className="text-muted-foreground">Agrega su correo para poder invitarlo a la app.</Text>
        )
      ) : null}
    </Card>
  );
}
