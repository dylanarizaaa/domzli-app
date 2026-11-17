import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export type ActionItem = { key: string; label: string; icon: IconName; badge?: number; onPress?: () => void; disabled?: boolean };

/** Tarjeta blanca flotante con 3 o 4 acciones frecuentes, montada sobre BalanceHeader. */
export function ActionCard({ items, overlap = true, className }: { items: ActionItem[]; overlap?: boolean; className?: string }) {
  return (
    <View
      aria-label="Acciones rápidas"
      className={cn('mx-5 flex-row rounded-2xl bg-card px-1.5 py-3.5', overlap && '-mt-[52px]', className)}
      style={{ boxShadow: '0 10px 28px rgba(34, 43, 120, 0.16)' }}
    >
      {items.map((item) => (
        <Pressable
          key={item.key}
          role="button"
          aria-label={item.badge ? `${item.label}, ${item.badge} pendientes` : item.label}
          aria-disabled={item.disabled}
          disabled={item.disabled}
          onPress={item.onPress}
          className={cn('min-h-16 flex-1 items-center gap-1.5 rounded-md px-0.5 py-1 active:bg-muted', item.disabled && 'opacity-40')}
        >
          <Icon name={item.icon} size={26} className="text-primary" />
          <Text className="text-center font-sans-medium text-xs leading-4 text-card-foreground">{item.label}</Text>
          {item.badge ? (
            <View className="absolute left-1/2 top-0 ml-2 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-highlight-orange px-[5px]">
              <Text className="font-sans-bold text-[11px] leading-[18px] text-highlight-orange-foreground">{item.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
