import { Pressable, View } from 'react-native';

import { MoneyText } from '@/components/ui/money-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { ChargeItemRow } from '@/types/database';
import { toCents } from '@/lib/money';

import { dueCaption, type ChargeSummary } from '../domain';

export type ChargeCardProps = {
  charge: ChargeSummary;
  /** Muestra inmueble e inquilino (vista del arrendador). */
  showLease?: boolean;
  items?: ChargeItemRow[];
  onPress?: () => void;
};

/** Cobro con su estado, vencimiento y saldo. Con `items` muestra el desglose. */
export function ChargeCard({ charge, showLease, items, onPress }: ChargeCardProps) {
  const overdue = charge.displayStatus === 'overdue';
  const content = (
    <>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="title" numberOfLines={1}>{charge.description}</Text>
          {showLease ? (
            <Text variant="body-sm" numberOfLines={1} className="text-muted-foreground">
              {charge.propertyName}{charge.tenantName ? ` · ${charge.tenantName}` : ''}
            </Text>
          ) : null}
          <Text variant="caption" className={cn(overdue ? 'text-danger-subtle-foreground' : 'text-muted-foreground')}>{dueCaption(charge)}</Text>
        </View>
        <StatusBadge entity="charge" status={charge.displayStatus} size="sm" />
      </View>

      {items && items.length > 0 ? (
        <View className="gap-1">
          {items.map((item) => (
            <View key={item.id} className="flex-row justify-between gap-3">
              <Text variant="body-sm" className="flex-1 text-muted-foreground">{item.description}</Text>
              <MoneyText amountCents={toCents(item.amount)} variant="body-sm" voided={charge.displayStatus === 'void'} />
            </View>
          ))}
          {charge.paidCents > 0 ? (
            <View className="flex-row justify-between gap-3">
              <Text variant="body-sm" className="text-muted-foreground">Pagado</Text>
              <MoneyText amountCents={-charge.paidCents} variant="body-sm" />
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row items-end justify-between gap-3 border-t border-border pt-2">
        <Text variant="label" className="font-sans-semibold">{charge.displayStatus === 'paid' ? 'Total pagado' : 'Saldo'}</Text>
        <MoneyText
          amountCents={charge.displayStatus === 'paid' ? charge.totalCents : charge.balanceCents}
          voided={charge.displayStatus === 'void'}
          className="font-display-bold text-xl"
        />
      </View>
      {charge.inReviewCents > 0 ? (
        <Text variant="caption" className="text-warning-subtle-foreground">
          Hay un pago en revisión por este cobro.
        </Text>
      ) : null}
      {charge.voidReason ? <Text variant="caption" className="text-muted-foreground">Anulado: {charge.voidReason}</Text> : null}
    </>
  );
  const className = 'gap-3 rounded-lg border border-border bg-card p-4';
  return onPress ? (
    <Pressable role="button" onPress={onPress} className={cn(className, 'active:bg-muted')}>{content}</Pressable>
  ) : (
    <View className={className}>{content}</View>
  );
}
