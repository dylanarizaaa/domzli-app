import { Pressable, View } from 'react-native';

import { MoneyText } from '@/components/ui/money-text';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

/** Indicador: etiqueta, monto y una línea de contexto. */
export function StatTile({ label, amountCents, caption, tone = 'default', onPress }: {
  label: string; amountCents: number; caption?: string; tone?: 'default' | 'danger' | 'warning'; onPress?: () => void;
}) {
  const content = (
    <>
      <Text variant="body-sm" className="text-muted-foreground">{label}</Text>
      <MoneyText amountCents={amountCents} className={cn('font-display-bold text-xl', tone === 'danger' && 'text-danger-subtle-foreground')}
        adjustsFontSizeToFit numberOfLines={1} />
      {caption ? (
        <Text variant="caption" className={cn('text-muted-foreground', tone === 'warning' && 'text-warning-subtle-foreground', tone === 'danger' && 'text-danger-subtle-foreground')}>
          {caption}
        </Text>
      ) : null}
    </>
  );
  const className = 'min-w-0 flex-1 gap-1 rounded-lg border border-border bg-card p-4';
  return onPress ? (
    <Pressable role="button" onPress={onPress} className={cn(className, 'active:bg-muted')}>{content}</Pressable>
  ) : <View className={className}>{content}</View>;
}
