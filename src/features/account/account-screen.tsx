import { View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/providers/auth-provider';

const ROLE_LABELS = { owner: 'Propietario', admin: 'Administrador', tenant: 'Inquilino' } as const;

export function AccountScreen() {
  const { session, activeContext, signOut } = useAuth();
  const name = (session?.user.user_metadata?.full_name as string | undefined) || 'Usuario';
  return (
    <Screen title="Cuenta">
      <Card className="flex-row items-center gap-3 p-4">
        <Avatar name={name} size={56} />
        <View className="flex-1">
          <Text variant="title">{name}</Text>
          <Text variant="body-sm" className="text-muted-foreground">{session?.user.email}</Text>
        </View>
      </Card>
      {activeContext ? (
        <Card className="gap-2 p-4">
          <Text variant="caption" className="text-muted-foreground">Organización</Text>
          <Text variant="title">{activeContext.organizationName}</Text>
          <Badge tone="info">{ROLE_LABELS[activeContext.role]}</Badge>
        </Card>
      ) : null}
      <Button variant="outline" iconStart="log-out" onPress={signOut}>Cerrar sesión</Button>
    </Screen>
  );
}
