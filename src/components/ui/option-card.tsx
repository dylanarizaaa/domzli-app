import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

/** Opción seleccionable en forma de tarjeta (listas de elección dentro de asistentes). */
export function OptionCard({
  title, subtitle, selected, onPress, trailing, disabled,
}: { title: string; subtitle?: string; selected: boolean; onPress: () => void; trailing?: React.ReactNode; disabled?: boolean }) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'min-h-14 flex-row items-center gap-3 rounded-lg border bg-card p-3',
        selected ? 'border-primary' : 'border-border active:bg-muted',
        disabled && 'opacity-50',
      )}
    >
      <View className="flex-1 gap-0.5">
        <Text variant="title" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="body-sm" numberOfLines={2} className="text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {trailing}
      <Icon name={selected ? 'circle-check' : 'circle-dashed'} size={24} className={selected ? 'text-primary' : 'text-muted-foreground'} />
    </Pressable>
  );
}
