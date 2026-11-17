import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

/** Título de sección del inicio, con enlace opcional a la vista completa. */
export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="min-h-11 flex-row items-center justify-between gap-3">
      <Text variant="section">{title}</Text>
      {actionLabel ? (
        <Pressable role="link" onPress={onAction} className="min-h-11 justify-center active:opacity-70">
          <Text className="font-sans-semibold text-sm text-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
