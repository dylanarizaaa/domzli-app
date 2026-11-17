import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/** Fila etiqueta–valor para detalles (canon, fechas, método…). */
export function ListRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="min-h-6 flex-row items-center justify-between gap-3">
      <Text variant="body-sm" className="text-muted-foreground">{label}</Text>
      <View className="shrink items-end">{typeof children === 'string' ? <Text variant="body-sm" className="text-right">{children}</Text> : children}</View>
    </View>
  );
}
