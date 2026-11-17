import * as React from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  /** Una sola acción. */
  action?: React.ReactNode;
};

export function EmptyState({ icon = 'circle-dashed', title, description, action }: EmptyStateProps) {
  return (
    <View className="items-center gap-2 px-6 py-10">
      <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon name={icon} size={32} className="text-muted-foreground" />
      </View>
      <Text variant="h3" className="text-center">{title}</Text>
      {description ? <Text variant="body-sm" className="mb-2 text-center text-muted-foreground">{description}</Text> : null}
      {action}
    </View>
  );
}
