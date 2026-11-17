import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export type TabBarItem = { value: string; label: string; icon: IconName; badge?: number };

export type TabBarProps = {
  /** Cuatro destinos: dos a cada lado del botón central. */
  items: TabBarItem[];
  value: string;
  onValueChange: (value: string) => void;
  centerAction: { label: string; icon?: IconName; onPress: () => void };
};

/** Barra inferior con 4 destinos y botón central elevado (dirección Billetera). */
export function TabBar({ items, value, onValueChange, centerAction }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const half = Math.ceil(items.length / 2);

  const renderTab = (item: TabBarItem) => {
    const active = item.value === value;
    const color = active ? 'text-primary' : 'text-muted-foreground';
    return (
      <Pressable
        key={item.value}
        role="tab"
        aria-selected={active}
        aria-label={item.badge ? `${item.label}, ${item.badge} pendientes` : item.label}
        onPress={() => onValueChange(item.value)}
        className="min-h-11 flex-1 items-center justify-center gap-0.5 active:opacity-70"
      >
        <Icon name={item.icon} size={24} className={color} />
        <Text className={cn('text-xs leading-4', active ? 'font-sans-semibold' : 'font-sans-medium', color)}>{item.label}</Text>
        {item.badge ? (
          <View className="absolute left-1/2 top-0 ml-1.5 h-4 min-w-4 items-center justify-center rounded-full bg-highlight-orange px-1">
            <Text className="font-sans-bold text-[10px] leading-4 text-highlight-orange-foreground">{item.badge}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View
      role="tablist"
      className="flex-row items-center border-t border-border bg-card px-2"
      style={{ height: 76 + insets.bottom, paddingBottom: insets.bottom }}
    >
      {items.slice(0, half).map(renderTab)}
      <View className="flex-1 items-center">
        {/* El anillo del color de la tarjeta simula el recorte de la barra. */}
        <View className="-mt-10 h-[76px] w-[76px] items-center justify-center rounded-full bg-card">
          <Pressable
            role="button"
            aria-label={centerAction.label}
            onPress={centerAction.onPress}
            className="h-[60px] w-[60px] items-center justify-center rounded-full bg-primary active:bg-primary-emphasis"
            style={{ boxShadow: '0 12px 24px rgba(72, 89, 221, 0.35)' }}
          >
            <Icon name={centerAction.icon ?? 'plus'} size={28} className="text-primary-foreground" />
          </Pressable>
        </View>
      </View>
      {items.slice(half).map(renderTab)}
    </View>
  );
}
