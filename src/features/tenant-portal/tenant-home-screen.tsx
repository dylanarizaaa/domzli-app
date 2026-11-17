import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { ActionCard } from '@/components/ui/action-card';
import { Alert } from '@/components/ui/alert';
import { BalanceHeader } from '@/components/ui/balance-header';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { ChargeCard, dueCaption, PaymentCard, useChargeItems, useCharges, usePayments } from '@/features/finance';
import { toAppError } from '@/lib/errors';
import { formatCOP } from '@/lib/money';
import { useActiveOrganization, useAuth } from '@/providers/auth-provider';

import { tenantBalance } from './domain';
import { useMyLease } from './hooks';

/** Inicio del inquilino (dirección Billetera): total pendiente, cobros y último pago. */
export function TenantHomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { organizationId, organizationName } = useActiveOrganization();
  const lease = useMyLease(organizationId);
  const charges = useCharges(organizationId, { openOnly: true });
  const payments = usePayments(organizationId);
  const open = charges.data ?? [];
  const items = useChargeItems(organizationId, open.map((c) => c.id));
  const balance = tenantBalance(open);
  const name = (session?.user.user_metadata?.full_name as string | undefined) || session?.user.email || 'Usuario';
  const inReview = (payments.data ?? []).filter((p) => p.status === 'in_review').length;
  const lastPayment = (payments.data ?? [])[0];

  const caption = balance.nextDue
    ? dueCaption(balance.nextDue)
    : balance.inReviewCents > 0 ? `${formatCOP(balance.inReviewCents)} en revisión` : 'Estás al día';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 24 }}>
      <BalanceHeader
        label={lease.data ? lease.data.propertyName : 'Tu contrato'}
        amountCents={balance.pendingCents}
        caption={caption}
        captionIcon={balance.nextDue ? 'calendar-days' : 'circle-check'}
        tone={balance.overdueCents > 0 ? 'night' : 'indigo'}
        userName={name}
        organization={organizationName}
        onAccount={() => router.push('/portal/account')}
      />
      <ActionCard items={[
        { key: 'pay', label: 'Reportar pago', icon: 'receipt', onPress: () => router.push('/pay'), disabled: balance.pendingCents === 0 },
        { key: 'lease', label: 'Mi contrato', icon: 'file-text', onPress: () => router.push('/portal/lease') },
        { key: 'payments', label: 'Mis pagos', icon: 'wallet', badge: inReview || undefined, onPress: () => router.push('/portal/payments') },
        { key: 'docs', label: 'Documentos', icon: 'folder-open', onPress: () => router.push('/portal/lease') },
      ]} />

      <View className="gap-3 px-5 pt-6">
        {charges.error ? <Alert tone="danger">{toAppError(charges.error).message}</Alert> : null}
        {balance.overdueCents > 0 ? (
          <Alert tone="danger" title="Tienes saldo vencido">{`${formatCOP(balance.overdueCents)} ya pasaron su fecha de pago.`}</Alert>
        ) : null}
        {lastPayment?.status === 'rejected' ? (
          <Alert tone="warning" title="Tu último pago fue rechazado">{lastPayment.rejectionReason ?? 'Revisa el motivo en Mis pagos.'}</Alert>
        ) : null}

        <SectionHeader title="Cobros pendientes" />
        {charges.isPending ? <ActivityIndicator /> : null}
        {!charges.isPending && open.length === 0 ? (
          <View className="rounded-3xl bg-success-subtle p-[18px]">
            <Text className="font-sans-semibold text-success-subtle-foreground">Estás al día</Text>
            <Text variant="body-sm" className="text-success-subtle-foreground">No tienes cobros pendientes.</Text>
          </View>
        ) : null}
        {open.map((c) => (
          <ChargeCard key={c.id} charge={c} items={(items.data ?? []).filter((i) => i.charge_id === c.id)} />
        ))}

        {lastPayment ? (
          <>
            <SectionHeader title="Último pago" actionLabel="Ver todos" onAction={() => router.push('/portal/payments')} />
            <PaymentCard payment={lastPayment} />
          </>
        ) : null}
        {!lease.isPending && !lease.data ? (
          <Alert tone="info" title="Aún no tienes un contrato activo">Tu arrendador debe activar el contrato para que lo veas aquí.</Alert>
        ) : null}
      </View>
    </ScrollView>
  );
}
