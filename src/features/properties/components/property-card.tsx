import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { MoneyText } from '@/components/ui/money-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';

import { PROPERTY_TYPE_LABELS, propertyLocation, type PropertySummary } from '../domain';

/** Resumen de un inmueble para listas: nombre, ubicación, estado, canon vigente e inquilino. */
export function PropertyCard({ property, onPress }: { property: PropertySummary; onPress?: () => void }) {
  return (
    <Pressable
      role="button"
      aria-label={`${property.name}, ${propertyLocation(property)}`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3 active:bg-muted"
    >
      <View className="h-[54px] w-[72px] items-center justify-center rounded-md bg-module-properties">
        <Icon name="building-2" size={24} className="text-module-properties-foreground" />
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text variant="title" numberOfLines={1} className="flex-1">{property.name}</Text>
          <StatusBadge entity="property" status={property.status} size="sm" />
        </View>
        <Text variant="body-sm" numberOfLines={1} className="text-muted-foreground">
          {PROPERTY_TYPE_LABELS[property.type]} · {propertyLocation(property)}
        </Text>
        <View className="flex-row items-center justify-between gap-2">
          {property.tenantName ? (
            <View className="flex-1 flex-row items-center gap-1.5">
              <Avatar name={property.tenantName} size={24} />
              <Text variant="body-sm" numberOfLines={1} className="flex-1">{property.tenantName}</Text>
            </View>
          ) : (
            <Text variant="body-sm" className="flex-1 text-muted-foreground">Sin inquilino</Text>
          )}
          {property.currentRentCents !== null ? (
            <MoneyText amountCents={property.currentRentCents} className="font-sans-semibold text-sm" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
