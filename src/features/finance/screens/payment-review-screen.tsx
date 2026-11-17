import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert as NativeAlert, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { MoneyText } from '@/components/ui/money-text';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { formatDateShort } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { formatCOP } from '@/lib/money';
import { useActiveOrganization } from '@/providers/auth-provider';

import { ReceiptViewer } from '../components/receipt-viewer';
import { PAYMENT_METHOD_LABELS, REJECTION_REASONS } from '../domain';
import { usePayment, usePaymentActions } from '../hooks';

/** Revisión de un pago reportado (Design System §7.7): comprobante, datos y decisión. */
export function PaymentReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizationId, role } = useActiveOrganization();
  const payment = usePayment(organizationId, id);
  const actions = usePaymentActions(organizationId);
  const [mode, setMode] = React.useState<'reject' | 'reverse' | null>(null);
  const [reason, setReason] = React.useState('');
  const [preset, setPreset] = React.useState('');

  const error = actions.approve.error ?? actions.reject.error ?? actions.reverse.error;

  if (payment.isPending) return <Screen title="Pago" onBack={() => router.back()}><ActivityIndicator className="mt-10" /></Screen>;
  if (payment.error || !payment.data) {
    return <Screen title="Pago" onBack={() => router.back()}><Alert tone="danger">{toAppError(payment.error).message}</Alert></Screen>;
  }
  const p = payment.data;
  const finalReason = reason.trim() || preset;

  const approve = () =>
    NativeAlert.alert('¿Aprobar el pago?', `Se aplicarán ${formatCOP(p.amountCents)} al saldo de ${p.tenantName ?? 'el inquilino'}.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprobar', onPress: () => actions.approve.mutate(p.id) },
    ]);

  return (
    <Screen
      title={p.status === 'in_review' ? 'Revisar pago' : 'Pago'}
      onBack={() => router.back()}
      footer={
        p.status === 'in_review' && mode !== 'reject' ? (
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="outline" onPress={() => setMode('reject')}>Rechazar</Button>
            <Button className="flex-1" loading={actions.approve.isPending} onPress={approve}>Aprobar</Button>
          </View>
        ) : undefined
      }
    >
      {error ? <Alert tone="danger">{toAppError(error).message}</Alert> : null}

      {p.receiptPath ? <ReceiptViewer path={p.receiptPath} /> : <Alert tone="info">Este pago no tiene comprobante adjunto.</Alert>}

      <Card className="gap-2 p-4">
        <View className="flex-row items-center justify-between">
          <MoneyText amountCents={p.amountCents} className="font-display-bold text-2xl" />
          <StatusBadge entity="payment" status={p.status} />
        </View>
        <ListRow label="Inquilino">{p.tenantName ?? p.reporterName ?? '—'}</ListRow>
        <ListRow label="Inmueble">{p.propertyName}</ListRow>
        <ListRow label="Fecha de pago">{formatDateShort(p.paidOn)}</ListRow>
        <ListRow label="Medio">{PAYMENT_METHOD_LABELS[p.method]}</ListRow>
        {p.reference ? <ListRow label="Referencia">{p.reference}</ListRow> : null}
        {p.appliedTo ? <ListRow label="Se aplica a">{p.appliedTo}</ListRow> : null}
        <ListRow label="Origen">{p.source === 'staff_record' ? 'Registrado por el arrendador' : 'Reportado por el inquilino'}</ListRow>
        {p.rejectionReason ? <ListRow label="Motivo">{p.rejectionReason}</ListRow> : null}
      </Card>

      {p.status === 'in_review' ? (
        <Alert tone="info">Aprobar no confirma que el dinero llegó a tu cuenta. Verifícalo en tu banco antes de aprobar.</Alert>
      ) : null}

      {mode === 'reject' ? (
        <Card className="gap-3 p-4">
          <Text variant="h3">Rechazar pago</Text>
          <ChoiceChips label="Motivo frecuente" value={preset} onValueChange={(v) => { setPreset(v); setReason(''); }}
            options={REJECTION_REASONS.map((r) => ({ value: r, label: r }))} />
          <FormField label="Motivo" description="El inquilino lo verá para corregir su reporte.">
            <Input value={reason} onChangeText={setReason} placeholder={preset || 'Escribe el motivo'} />
          </FormField>
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="ghost" onPress={() => setMode(null)}>Cancelar</Button>
            <Button className="flex-1" variant="destructive" disabled={!finalReason} loading={actions.reject.isPending}
              onPress={() => actions.reject.mutate({ id: p.id, reason: finalReason }, { onSuccess: () => setMode(null) })}>
              Rechazar pago
            </Button>
          </View>
        </Card>
      ) : null}

      {p.status === 'approved' && role === 'owner' ? (
        mode === 'reverse' ? (
          <Card className="gap-3 p-4">
            <Text variant="h3">Revertir pago</Text>
            <Text variant="body-sm" className="text-muted-foreground">Úsalo si el pago se aprobó o registró por error. El saldo de los cobros se restaura.</Text>
            <FormField label="Motivo"><Input value={reason} onChangeText={setReason} placeholder="Registrado por error" /></FormField>
            <Button variant="destructive" disabled={!reason.trim()} loading={actions.reverse.isPending}
              onPress={() => actions.reverse.mutate({ id: p.id, reason: reason.trim() }, { onSuccess: () => setMode(null) })}>
              Revertir pago
            </Button>
          </Card>
        ) : (
          <Button variant="ghost" iconStart="rotate-ccw" onPress={() => setMode('reverse')}>Revertir pago</Button>
        )
      ) : null}
    </Screen>
  );
}
