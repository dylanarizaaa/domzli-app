import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { MoneyText } from '@/components/ui/money-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { formatDateShort } from '@/lib/dates';
import { cn } from '@/lib/cn';

import { leaseProgress, leaseTermCaption, type LeaseSummary } from '../domain';

/** Resumen de un contrato: inmueble, inquilino, vigencia con su avance, canon y estado. */
export function LeaseCard({ lease, onPress }: { lease: LeaseSummary; onPress?: () => void }) {
  const progress = leaseProgress(lease.startDate, lease.endDate);
  const warn = lease.displayStatus === 'expiring' || lease.displayStatus === 'extension';
  return (
    <Pressable
      role="button"
      aria-label={`Contrato de ${lease.propertyName}`}
      onPress={onPress}
      className="gap-3 rounded-lg border border-border bg-card p-4 active:bg-muted"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="title" numberOfLines={1}>{lease.propertyName}</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="users" size={16} className="text-muted-foreground" />
            <Text variant="body-sm" numberOfLines={1} className="flex-1 text-muted-foreground">{lease.tenantName ?? 'Sin inquilino'}</Text>
          </View>
        </View>
        <StatusBadge entity="lease" status={lease.displayStatus} size="sm" />
      </View>
      {lease.status !== 'draft' ? (
        <View className="gap-1">
          <View className="flex-row justify-between">
            <Text variant="caption" className="text-muted-foreground">{formatDateShort(lease.startDate)} – {formatDateShort(lease.endDate)}</Text>
            <Text variant="caption" className={warn ? 'text-warning-subtle-foreground' : 'text-muted-foreground'}>{leaseTermCaption(lease)}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progress}>
            <View className={cn('h-2 rounded-full', warn ? 'bg-warning' : 'bg-primary')} style={{ width: `${progress}%` }} />
          </View>
        </View>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text variant="body-sm" className="text-muted-foreground">Canon mensual</Text>
        <MoneyText amountCents={lease.currentRentCents} className="font-sans-semibold text-sm" />
      </View>
    </Pressable>
  );
}
