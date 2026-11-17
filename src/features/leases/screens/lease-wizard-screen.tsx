import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DateInput } from '@/components/ui/date-input';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { MoneyInput } from '@/components/ui/money-input';
import { MoneyText } from '@/components/ui/money-text';
import { OptionCard } from '@/components/ui/option-card';
import { Text } from '@/components/ui/text';
import { useProperties } from '@/features/properties';
import { useTenants } from '@/features/tenants';
import { formatDateShort, todayISO } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';

import {
  ADMINISTRATION_LABELS, GUARANTEE_LABELS, INCREASE_LABELS, LEASE_USE_LABELS, suggestedBillingStart, suggestedEndDate,
} from '../domain';
import { useCreateLease } from '../hooks';
import { leaseWizardSchema, WIZARD_STEPS, type LeaseWizardValues } from '../schemas';

/** Asistente de contrato: Inmueble → Inquilino → Condiciones → Fechas → Confirmar (Design System §7.6). */
export function LeaseWizardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ propertyId?: string; tenantId?: string }>();
  const { organizationId } = useActiveOrganization();
  const properties = useProperties(organizationId);
  const tenants = useTenants(organizationId);
  const createLease = useCreateLease(organizationId);
  const [step, setStep] = React.useState(0);

  const today = todayISO();
  const { control, trigger, handleSubmit, setValue, formState: { errors } } = useForm<LeaseWizardValues>({
    resolver: zodResolver(leaseWizardSchema),
    defaultValues: {
      propertyId: params.propertyId ?? '',
      tenantId: params.tenantId ?? '',
      leaseUse: 'residential',
      rentPesos: '',
      administrationMode: 'separate',
      administrationPesos: '',
      paymentDay: '5',
      guaranteeType: 'none',
      increaseType: 'ipc',
      increasePercentage: '',
      startDate: today,
      endDate: suggestedEndDate(today),
      billingStartDate: '',
    },
    mode: 'onBlur',
  });
  const values = useWatch({ control }) as LeaseWizardValues;

  const available = (properties.data ?? []).filter((p) => p.status === 'available');
  const property = (properties.data ?? []).find((p) => p.id === values.propertyId);
  const tenant = (tenants.data ?? []).find((t) => t.id === values.tenantId);
  const current = WIZARD_STEPS[step];

  const next = async () => {
    const ok = await trigger([...current.fields] as (keyof LeaseWizardValues)[]);
    if (ok) setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };
  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  const submit = (activate: boolean) =>
    handleSubmit(async (v) => {
      try {
        const id = await createLease.mutateAsync({ values: v, activate });
        router.replace(`/leases/${id}`);
      } catch {
        // El error se muestra arriba.
      }
    })();

  const loading = properties.isPending || tenants.isPending;

  return (
    <Screen
      title="Nuevo contrato"
      subtitle={`Paso ${step + 1} de ${WIZARD_STEPS.length} · ${current.title}`}
      onBack={back}
      footer={
        current.key === 'confirm' ? (
          <View className="gap-2">
            <Button size="lg" loading={createLease.isPending} onPress={() => submit(true)}>Activar contrato</Button>
            <Button variant="ghost" disabled={createLease.isPending} onPress={() => submit(false)}>Guardar como borrador</Button>
          </View>
        ) : (
          <Button size="lg" iconEnd="chevron-right" onPress={next}>Continuar</Button>
        )
      }
    >
      {createLease.error ? <Alert tone="danger" title="No pudimos crear el contrato">{toAppError(createLease.error).message}</Alert> : null}
      {loading ? <ActivityIndicator className="mt-10" /> : null}

      {!loading && current.key === 'property' ? (
        <View className="gap-3">
          <Text className="text-muted-foreground">Elige un inmueble disponible.</Text>
          {available.length === 0 ? (
            <Alert tone="info" title="No tienes inmuebles disponibles">Registra un inmueble o termina el contrato de uno arrendado.</Alert>
          ) : null}
          {available.map((p) => (
            <OptionCard key={p.id} title={p.name} subtitle={`${p.address} · ${p.city}`} selected={values.propertyId === p.id}
              onPress={() => setValue('propertyId', p.id, { shouldValidate: true })} />
          ))}
          {errors.propertyId ? <Text variant="caption" className="text-destructive">{errors.propertyId.message}</Text> : null}
          <Button variant="outline" iconStart="plus" onPress={() => router.push('/properties/new')}>Registrar inmueble</Button>
        </View>
      ) : null}

      {!loading && current.key === 'tenant' ? (
        <View className="gap-3">
          <Text className="text-muted-foreground">Elige al inquilino titular. El contrato tiene un solo inquilino.</Text>
          {(tenants.data ?? []).map((t) => (
            <OptionCard key={t.id} title={t.name} subtitle={t.documentMasked} selected={values.tenantId === t.id}
              onPress={() => setValue('tenantId', t.id, { shouldValidate: true })} />
          ))}
          {errors.tenantId ? <Text variant="caption" className="text-destructive">{errors.tenantId.message}</Text> : null}
          <Button variant="outline" iconStart="user-plus" onPress={() => router.push('/tenants/new')}>Registrar inquilino</Button>
        </View>
      ) : null}

      {current.key === 'terms' ? (
        <View className="gap-4">
          <Controller control={control} name="leaseUse" render={({ field }) => (
            <FormField label="Uso del inmueble" description={field.value === 'residential' ? 'Vivienda urbana: aplica la Ley 820 de 2003.' : undefined}>
              <ChoiceChips label="Uso" value={field.value} onValueChange={field.onChange}
                options={[{ value: 'residential', label: 'Vivienda' }, { value: 'commercial', label: 'Comercial' }]} />
            </FormField>
          )} />
          <Controller control={control} name="rentPesos" render={({ field }) => (
            <FormField label="Canon mensual" error={errors.rentPesos?.message}>
              <MoneyInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.rentPesos} />
            </FormField>
          )} />
          <Controller control={control} name="administrationMode" render={({ field }) => (
            <FormField label="Administración">
              <ChoiceChips label="Administración" value={field.value} onValueChange={field.onChange}
                options={[{ value: 'separate', label: 'Aparte' }, { value: 'included', label: 'Incluida' }, { value: 'none', label: 'No aplica' }]} />
            </FormField>
          )} />
          {values.administrationMode === 'separate' ? (
            <Controller control={control} name="administrationPesos" render={({ field }) => (
              <FormField label="Valor de la administración" description="Se suma a cada cobro mensual." error={errors.administrationPesos?.message}>
                <MoneyInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.administrationPesos} />
              </FormField>
            )} />
          ) : null}
          <Controller control={control} name="paymentDay" render={({ field }) => (
            <FormField label="Día de pago" description="Día del mes en que vence el canon." error={errors.paymentDay?.message}>
              <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="number-pad" maxLength={2} invalid={!!errors.paymentDay} />
            </FormField>
          )} />
          <Controller control={control} name="guaranteeType" render={({ field }) => (
            <FormField label="Garantía" description="No se admiten depósitos en dinero.">
              <ChoiceChips label="Garantía" value={field.value} onValueChange={field.onChange}
                options={[{ value: 'none', label: 'Sin garantía' }, { value: 'co_signer', label: 'Codeudor' }, { value: 'insurance_policy', label: 'Póliza' }]} />
            </FormField>
          )} />
          <Controller control={control} name="increaseType" render={({ field }) => (
            <FormField label="Reajuste anual" description={values.leaseUse === 'residential' ? 'En vivienda, el reajuste no puede superar el IPC del año anterior.' : undefined}>
              <ChoiceChips label="Reajuste" value={field.value} onValueChange={field.onChange}
                options={[{ value: 'ipc', label: 'IPC' }, { value: 'fixed_percentage', label: 'Porcentaje fijo' }, { value: 'none', label: 'Sin reajuste' }]} />
            </FormField>
          )} />
          {values.increaseType === 'fixed_percentage' ? (
            <Controller control={control} name="increasePercentage" render={({ field }) => (
              <FormField label="Porcentaje de reajuste" error={errors.increasePercentage?.message}>
                <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} keyboardType="decimal-pad" placeholder="5" invalid={!!errors.increasePercentage} />
              </FormField>
            )} />
          ) : null}
        </View>
      ) : null}

      {current.key === 'dates' ? (
        <View className="gap-4">
          <Controller control={control} name="startDate" render={({ field }) => (
            <FormField label="Fecha de inicio" error={errors.startDate?.message}>
              <DateInput value={field.value} invalid={!!errors.startDate} onBlur={field.onBlur} onValueChange={(iso) => {
                field.onChange(iso);
                if (iso) {
                  setValue('endDate', suggestedEndDate(iso));
                  setValue('billingStartDate', suggestedBillingStart(iso) ?? '');
                }
              }} />
            </FormField>
          )} />
          <Controller control={control} name="endDate" render={({ field }) => (
            <FormField label="Fecha de finalización" description="Al vencer sin terminarlo, el contrato sigue en prórroga." error={errors.endDate?.message}>
              <DateInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.endDate} />
            </FormField>
          )} />
          {values.billingStartDate !== '' || (values.startDate && suggestedBillingStart(values.startDate)) ? (
            <Controller control={control} name="billingStartDate" render={({ field }) => (
              <FormField label="Cobrar en Domzli desde" description="El contrato ya venía corriendo: los meses anteriores no se cobran en la app." error={errors.billingStartDate?.message}>
                <DateInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.billingStartDate} />
              </FormField>
            )} />
          ) : null}
        </View>
      ) : null}

      {current.key === 'confirm' ? (
        <View className="gap-3">
          <Card className="gap-2 p-4">
            <Text variant="title">{property?.name ?? 'Inmueble'}</Text>
            <ListRow label="Inquilino">{tenant?.name ?? '—'}</ListRow>
            <ListRow label="Uso">{LEASE_USE_LABELS[values.leaseUse]}</ListRow>
            <ListRow label="Canon"><MoneyText amountCents={Number(values.rentPesos || 0) * 100} className="font-sans-semibold text-sm" /></ListRow>
            <ListRow label="Administración">
              {values.administrationMode === 'separate'
                ? <MoneyText amountCents={Number(values.administrationPesos || 0) * 100} className="text-sm" />
                : ADMINISTRATION_LABELS[values.administrationMode]}
            </ListRow>
            <ListRow label="Día de pago">{`Día ${values.paymentDay}`}</ListRow>
            <ListRow label="Garantía">{GUARANTEE_LABELS[values.guaranteeType]}</ListRow>
            <ListRow label="Reajuste">{values.increaseType === 'fixed_percentage' ? `${values.increasePercentage} % anual` : INCREASE_LABELS[values.increaseType]}</ListRow>
            <ListRow label="Vigencia">{values.startDate && values.endDate ? `${formatDateShort(values.startDate)} – ${formatDateShort(values.endDate)}` : '—'}</ListRow>
            {values.billingStartDate ? <ListRow label="Se cobra desde">{formatDateShort(values.billingStartDate)}</ListRow> : null}
          </Card>
          <Alert tone="info">
            {`Al activarlo, ${property?.name ?? 'el inmueble'} pasará a Arrendado y se generarán los cobros mensuales. Podrás adjuntar el contrato firmado desde su detalle.`}
          </Alert>
        </View>
      ) : null}
    </Screen>
  );
}
