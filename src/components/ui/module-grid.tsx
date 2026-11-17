import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

export type ModuleTone = 'properties' | 'tenants' | 'leases' | 'charges' | 'expenses' | 'documents' | 'reports' | 'more';

// Colores de identidad de cada módulo (nunca de estado).
const TILE: Record<ModuleTone, string> = {
  properties: 'bg-module-properties',
  tenants: 'bg-module-tenants',
  leases: 'bg-module-leases',
  charges: 'bg-module-charges',
  expenses: 'bg-module-expenses',
  documents: 'bg-module-documents',
  reports: 'bg-module-reports',
  more: 'bg-module-more',
};
const ICON: Record<ModuleTone, string> = {
  properties: 'text-module-properties-foreground',
  tenants: 'text-module-tenants-foreground',
  leases: 'text-module-leases-foreground',
  charges: 'text-module-charges-foreground',
  expenses: 'text-module-expenses-foreground',
  documents: 'text-module-documents-foreground',
  reports: 'text-module-reports-foreground',
  more: 'text-module-more-foreground',
};

export type ModuleItem = { key: string; label: string; icon: IconName; tone: ModuleTone; onPress?: () => void; soon?: boolean };

/** Cuadrícula de módulos ("Gestión"): 4 columnas, máximo 8. */
export function ModuleGrid({ items }: { items: ModuleItem[] }) {
  return (
    <View className="flex-row flex-wrap gap-y-4">
      {items.map((item) => (
        <Pressable
          key={item.key}
          role="button"
          aria-label={item.soon ? `${item.label}, próximamente` : item.label}
          onPress={item.onPress}
          className="w-1/4 items-center gap-1.5 active:opacity-70"
        >
          <View className={cn('h-14 w-14 items-center justify-center rounded-2xl', TILE[item.tone], item.soon && 'opacity-50')}>
            <Icon name={item.icon} size={24} className={ICON[item.tone]} />
          </View>
          <Text className={cn('text-center font-sans-medium text-xs leading-4', item.soon && 'text-muted-foreground')}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
