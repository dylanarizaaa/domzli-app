import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateInput } from '@/components/ui/date-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { OptionCard } from '@/components/ui/option-card';
import { todayISO } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useActiveOrganization } from '@/providers/auth-provider';
import type { ChargeConcept } from '@/types/database';

import { CHARGE_CONCEPT_LABELS } from '../domain';
import { useChargeActions } from '../hooks';

const CONCEPTS: ChargeConcept[] = ['repair', 'utility', 'administration', 'other'];

/** Cobro extraordinario: una reparación a cargo del inquilino, un servicio, etc. */
export function ManualChargeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ leaseId?: string }>();
  const { organizationId } = useActiveOrganization();
  const actions = useChargeActions(organizationId);
  const [leaseId, setLeaseId] = React.useState(params.leaseId ?? '');
  const [concept, setConcept] = React.useState<ChargeConcept>('repair');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [dueDate, setDueDate] = React.useState(todayISO());
  const [submitted, setSubmitted] = React.useState(false);

  const leases = useQuery({
    queryKey: ['org', organizationId, 'leases', 'picker'],
    enabled: !params.leaseId,
    queryFn: async () => {
      const { data, error } = await supabase.from('v_lease_overview').select('id, property_name, tenant_name, status')
        .eq('organization_id', organizationId).eq('status', 'active').order('property_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const errors = {
    lease: !leaseId ? 'Elige el contrato.' : undefined,
    description: !description.trim() ? 'Describe el cobro.' : undefined,
    amount: !(Number(amount) > 0) ? 'Escribe el monto.' : undefined,
    dueDate: !dueDate ? 'Escribe la fecha de vencimiento.' : undefined,
  };

  const submit = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    actions.create.mutate(
      { leaseId, concept, description: description.trim(), amountPesos: Number(amount), dueDate },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen title="Nuevo cobro" subtitle="Para cobros que no son el canon mensual." onBack={() => router.back()}
      footer={<Button size="lg" loading={actions.create.isPending} onPress={submit}>Crear cobro</Button>}>
      {actions.create.error ? <Alert tone="danger">{toAppError(actions.create.error).message}</Alert> : null}
      {!params.leaseId ? (
        <FormField label="Contrato" error={submitted ? errors.lease : undefined}>
          <View className="gap-2">
            {leases.isPending ? <ActivityIndicator /> : null}
            {(leases.data ?? []).map((l) => (
              <OptionCard key={l.id} title={l.property_name} subtitle={l.tenant_name ?? undefined} selected={leaseId === l.id} onPress={() => setLeaseId(l.id)} />
            ))}
          </View>
        </FormField>
      ) : null}
      <FormField label="Concepto">
        <ChoiceChips label="Concepto" value={concept} onValueChange={setConcept}
          options={CONCEPTS.map((c) => ({ value: c, label: CHARGE_CONCEPT_LABELS[c] }))} />
      </FormField>
      <FormField label="Descripción" error={submitted ? errors.description : undefined}>
        <Input value={description} onChangeText={setDescription} placeholder="Reparación de la ducha" invalid={submitted && !!errors.description} />
      </FormField>
      <FormField label="Monto" error={submitted ? errors.amount : undefined}>
        <MoneyInput value={amount} onValueChange={setAmount} invalid={submitted && !!errors.amount} />
      </FormField>
      <FormField label="Vence el" error={submitted ? errors.dueDate : undefined}>
        <DateInput value={dueDate} onValueChange={setDueDate} invalid={submitted && !!errors.dueDate} />
      </FormField>
    </Screen>
  );
}
