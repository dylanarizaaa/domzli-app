import * as React from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export type FormFieldProps = {
  label: string;
  description?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
};

/** Une etiqueta, control, descripción y error. La etiqueta siempre está visible. */
export function FormField({ label, description, error, optional, children }: FormFieldProps) {
  return (
    <View className="gap-1.5">
      <Text variant="label">
        {label}
        {optional ? <Text variant="label" className="font-sans text-muted-foreground"> (opcional)</Text> : null}
      </Text>
      {children}
      {error ? (
        <View className="flex-row items-center gap-1" role="alert" aria-live="polite">
          <Icon name="circle-alert" size={16} className="text-destructive" />
          <Text variant="caption" className="flex-1 text-destructive">{error}</Text>
        </View>
      ) : description ? (
        <Text variant="caption" className="text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}
