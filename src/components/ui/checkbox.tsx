import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

/** Casilla con etiqueta; la etiqueta forma parte del objetivo táctil. */
export function Checkbox({ checked, onCheckedChange, label, invalid }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: React.ReactNode; invalid?: boolean }) {
  return (
    <Pressable role="checkbox" aria-checked={checked} onPress={() => onCheckedChange(!checked)} className="min-h-11 flex-row items-center gap-3 active:opacity-70">
      <View className={cn('h-5 w-5 items-center justify-center rounded-xs border', checked ? 'border-primary bg-primary' : invalid ? 'border-destructive bg-card' : 'border-input bg-card')}>
        {checked ? <View className="h-2 w-2 rounded-[2px] bg-primary-foreground" /> : null}
      </View>
      <Text variant="body-sm" className="flex-1">{label}</Text>
    </Pressable>
  );
}
