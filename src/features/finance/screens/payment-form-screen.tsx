import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateInput } from '@/components/ui/date-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { MoneyInput } from '@/components/ui/money-input';
import { MoneyText } from '@/components/ui/money-text';
import { OptionCard } from '@/components/ui/option-card';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { todayISO } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { formatCOP } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { useActiveOrganization } from '@/providers/auth-provider';
import type { PickedFile } from '@/services/storage';
import type { PaymentMethod } from '@/types/database';

import { FilePickerField } from '../components/file-picker-field';
import { dueCaption, PAYMENT_METHOD_LABELS, payableCents, previewAllocation } from '../domain';
import { useCharges, useReportPayment } from '../hooks';

const METHODS: PaymentMethod[] = ['bank_transfer', 'bre_b', 'nequi', 'daviplata', 'pse', 'cash', 'card', 'other'];

function useActiveLeasesForPicker(organizationId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['org', organizationId, 'leases', 'picker'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_lease_overview')
        .select('id, property_name, tenant_name, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('property_name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Registrar (arrendador) o reportar (inquilino) un pago. El arrendador lo registra aprobado;
 * el inquilino lo reporta con comprobante y queda en revisión (flujo 10.6 del plan).
 */
export function PaymentFormScreen({ mode, leaseId: fixedLeaseId }: { mode: 'staff' | 'tenant'; leaseId?: string }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ leaseId?: string }>();
  const { organizationId } = useActiveOrganization();
  const [leaseId, setLeaseId] = React.useState(fixedLeaseId ?? params.leaseId ?? '');
  const leases = useActiveLeasesForPicker(organizationId, mode === 'staff' && !fixedLeaseId && !params.leaseId);
  const charges = useCharges(organizationId, { leaseId: leaseId || undefined, openOnly: true });
  const report = useReportPayment(organizationId);

  const [selected, setSelected] = React.useState<string[]>([]);
  /** null = sin editar a mano: se sugiere lo pendiente de los cobros elegidos. */
  const [amountInput, setAmountInput] = React.useState<string | null>(null);
  const [paidOn, setPaidOn] = React.useState(todayISO());
  const [method, setMethod] = React.useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = React.useState('');
  const [receipt, setReceipt] = React.useState<PickedFile | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const open = leaseId ? charges.data ?? [] : [];
  const payable = payableCents(open, selected);

  const amount = amountInput ?? (payable > 0 ? String(Math.round(payable / 100)) : '');

  const amountCents = Number(amount || 0) * 100;
  const preview = previewAllocation(open, amountCents, selected);
  const errors = {
    lease: !leaseId ? 'Elige el contrato.' : undefined,
    amount: amountCents <= 0 ? 'Escribe el monto pagado.' : preview.remainingCents > 0 ? `El monto supera lo pendiente (${formatCOP(payable)}).` : undefined,
    date: !paidOn ? 'Escribe la fecha del pago.' : paidOn > todayISO() ? 'La fecha no puede ser futura.' : undefined,
    receipt: mode === 'tenant' && !receipt ? 'Adjunta el comprobante del pago.' : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = async () => {
    setSubmitted(true);
    if (!valid) return;
    try {
      await report.mutateAsync({
        organizationId, leaseId, amountPesos: Number(amount), paidOn, method, reference: reference.trim(), chargeIds: selected, receipt,
      });
      if (mode === 'tenant') setDone(true);
      else router.back();
    } catch {
      // El error se muestra arriba.
    }
  };

  if (done) {
    return (
      <Screen title="Pago reportado" onBack={() => router.back()}>
        <Alert tone="success" title="Tu pago está en revisión">Te avisaremos cuando el arrendador lo apruebe. Puedes seguir su estado en Pagos.</Alert>
        <Button onPress={() => router.replace('/portal/payments')}>Ver mis pagos</Button>
      </Screen>
    );
  }

  return (
    <Screen
      title={mode === 'tenant' ? 'Reportar pago' : 'Registrar pago'}
      subtitle={mode === 'staff' ? 'Para pagos que ya recibiste: quedan aprobados y se aplican de inmediato.' : undefined}
      onBack={() => router.back()}
      footer={<Button size="lg" loading={report.isPending} onPress={submit}>{mode === 'tenant' ? 'Enviar a revisión' : 'Registrar pago'}</Button>}
    >
      {report.error ? <Alert tone="danger" title="No pudimos guardar el pago">{toAppError(report.error).message}</Alert> : null}

      {mode === 'staff' && !fixedLeaseId && !params.leaseId ? (
        <FormField label="Contrato" error={submitted ? errors.lease : undefined}>
          <View className="gap-2">
            {leases.isPending ? <ActivityIndicator /> : null}
            {(leases.data ?? []).map((l) => (
              <OptionCard key={l.id} title={l.property_name} subtitle={l.tenant_name ?? undefined} selected={leaseId === l.id}
                onPress={() => { setLeaseId(l.id); setSelected([]); setAmountInput(null); }} />
            ))}
            {!leases.isPending && (leases.data ?? []).length === 0 ? <Alert tone="info">No tienes contratos vigentes.</Alert> : null}
          </View>
        </FormField>
      ) : null}

      {leaseId ? (
        <FormField label="¿Qué estás pagando?" description="Si no eliges, se aplica primero al cobro más antiguo.">
          <View className="gap-1">
            {charges.isPending ? <ActivityIndicator /> : null}
            {!charges.isPending && open.length === 0 ? <Alert tone="success">No hay cobros pendientes en este contrato.</Alert> : null}
            {open.map((c) => (
              <Checkbox
                key={c.id}
                checked={selected.includes(c.id)}
                onCheckedChange={(checked) => setSelected((s) => (checked ? [...s, c.id] : s.filter((id) => id !== c.id)))}
                label={`${c.description} · ${formatCOP(c.availableCents)} · ${dueCaption(c)}`}
              />
            ))}
          </View>
        </FormField>
      ) : null}

      <FormField label="Monto pagado" error={submitted ? errors.amount : undefined}>
        <MoneyInput value={amount} onValueChange={setAmountInput} invalid={submitted && !!errors.amount} />
      </FormField>
      <FormField label="Fecha del pago" error={submitted ? errors.date : undefined}>
        <DateInput value={paidOn} onValueChange={setPaidOn} invalid={submitted && !!errors.date} />
      </FormField>
      <FormField label="Medio de pago">
        <ChoiceChips label="Medio de pago" value={method} onValueChange={setMethod}
          options={METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))} />
      </FormField>
      <FormField label="Referencia o número de transacción" optional>
        <Input value={reference} onChangeText={setReference} placeholder="84731205" autoCapitalize="none" />
      </FormField>
      <FormField label="Comprobante" optional={mode === 'staff'} error={submitted ? errors.receipt : undefined}>
        <FilePickerField value={receipt} onChange={setReceipt} invalid={submitted && !!errors.receipt} />
      </FormField>

      {preview.allocations.length > 0 ? (
        <Card className="gap-2 p-4">
          <Text variant="label" className="font-sans-semibold">Se aplicará a</Text>
          {preview.allocations.map((a) => {
            const charge = open.find((c) => c.id === a.chargeId);
            return (
              <ListRow key={a.chargeId} label={charge?.description ?? 'Cobro'}>
                <MoneyText amountCents={a.cents} variant="body-sm" />
              </ListRow>
            );
          })}
        </Card>
      ) : null}
      {mode === 'tenant' ? (
        <Alert tone="info">El arrendador revisará tu comprobante. El pago se refleja en tu saldo cuando lo apruebe.</Alert>
      ) : null}
    </Screen>
  );
}
