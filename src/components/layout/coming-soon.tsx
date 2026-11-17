import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import type { IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** Pantalla de una sección que aún no está disponible. */
export function ComingSoon({ title, icon, description }: { title: string; icon: IconName; description: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background px-4" style={{ paddingTop: insets.top + 8 }}>
      <Text variant="h1">{title}</Text>
      <View className="flex-1 justify-center">
        <EmptyState icon={icon} title="Próximamente" description={description} />
      </View>
    </View>
  );
}
