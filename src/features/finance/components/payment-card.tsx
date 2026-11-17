import type * as React from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { MoneyText } from '@/components/ui/money-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { formatDateShort } from '@/lib/dates';
import { cn } from '@/lib/cn';

import { PAYMENT_METHOD_ICONS, PAYMENT_METHOD_LABELS, type PaymentSummary } from '../domain';

/** Pago reportado o registrado: monto, fecha, método, a qué se aplicó y estado. */
export function PaymentCard({ payment, showLease, onPress, footer }: {
  payment: PaymentSummary; showLease?: boolean; onPress?: () => void; footer?: React.ReactNode;
}) {
  const content = (
    <>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <MoneyText amountCents={payment.amountCents} className="font-display-bold text-xl" />
          <Text variant="body-sm" numberOfLines={1} className="text-muted-foreground">
            {showLease ? `${payment.tenantName ?? payment.reporterName ?? 'Inquilino'} · ${payment.propertyName}` : formatDateShort(payment.paidOn)}
          </Text>
        </View>
        <StatusBadge entity="payment" status={payment.status} size="sm" />
      </View>
      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Icon name={PAYMENT_METHOD_ICONS[payment.method]} size={16} className="text-muted-foreground" />
          <Text variant="body-sm">{PAYMENT_METHOD_LABELS[payment.method]}</Text>
        </View>
        {showLease ? <Text variant="body-sm" className="text-muted-foreground">{formatDateShort(payment.paidOn)}</Text> : null}
        {payment.receiptPath ? (
          <View className="flex-row items-center gap-1">
            <Icon name="paperclip" size={14} className="text-muted-foreground" />
            <Text variant="caption" className="text-muted-foreground">Comprobante</Text>
          </View>
        ) : null}
      </View>
      {payment.appliedTo ? <Text variant="caption" className="text-muted-foreground">Aplica a: {payment.appliedTo}</Text> : null}
      {payment.rejectionReason && (payment.status === 'rejected' || payment.status === 'reversed') ? (
        <View className="rounded-md bg-danger-subtle px-3 py-2">
          <Text variant="body-sm" className="text-danger-subtle-foreground">Motivo: {payment.rejectionReason}</Text>
        </View>
      ) : null}
      {footer}
    </>
  );
  const className = 'gap-2 rounded-lg border border-border bg-card p-4';
  return onPress ? (
    <Pressable role="button" onPress={onPress} className={cn(className, 'active:bg-muted')}>{content}</Pressable>
  ) : (
    <View className={className}>{content}</View>
  );
}
