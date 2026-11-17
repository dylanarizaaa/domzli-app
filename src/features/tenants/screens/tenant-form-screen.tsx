import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';
import type { IdDocumentType } from '@/types/database';

import { toTenantFormValues } from '../api';
import { useCreateTenant, useTenant } from '../hooks';
import { tenantFormDefaults, tenantFormSchema, type TenantFormValues } from '../schemas';

const DOCUMENT_OPTIONS: { value: IdDocumentType; label: string }[] = [
  { value: 'CC', label: 'CC' },
  { value: 'CE', label: 'CE' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'PPT', label: 'PPT' },
  { value: 'NIT', label: 'NIT' },
];

export function TenantFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { organizationId } = useActiveOrganization();
  const existing = useTenant(organizationId, id);
  const createTenant = useCreateTenant(organizationId, id);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: tenantFormDefaults,
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (existing.data) reset(toTenantFormValues(existing.data));
  }, [existing.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await createTenant.mutateAsync(values).then(() => router.back()).catch(() => undefined);
  });

  const appError = createTenant.error ? toAppError(createTenant.error) : null;

  return (
    <Screen
      title={id ? 'Editar inquilino' : 'Registrar inquilino'}
      onBack={() => router.back()}
      footer={<Button size="lg" loading={createTenant.isPending} onPress={() => onSubmit()}>{id ? 'Guardar cambios' : 'Guardar inquilino'}</Button>}
    >
      {appError ? (
        <Alert tone="danger" title="No pudimos guardar el inquilino">
          {appError.kind === 'conflict' ? 'Ya tienes un inquilino con ese documento.' : appError.message}
        </Alert>
      ) : null}

      <Controller control={control} name="fullName" render={({ field }) => (
        <FormField label="Nombre completo" error={errors.fullName?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.fullName}
            placeholder="Juan Pérez" autoComplete="name" autoCapitalize="words" />
        </FormField>
      )} />

      <Controller control={control} name="documentType" render={({ field }) => (
        <FormField label="Tipo de documento">
          <ChoiceChips label="Tipo de documento" options={DOCUMENT_OPTIONS} value={field.value} onValueChange={field.onChange} />
        </FormField>
      )} />

      <Controller control={control} name="documentNumber" render={({ field }) => (
        <FormField label="Número de documento" error={errors.documentNumber?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.documentNumber}
            placeholder="1020304050" keyboardType="number-pad" />
        </FormField>
      )} />

      <Controller control={control} name="email" render={({ field }) => (
        <FormField label="Correo" optional description="Lo necesitas para invitarlo a la app." error={errors.email?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.email}
            placeholder="juan@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        </FormField>
      )} />

      <Controller control={control} name="phone" render={({ field }) => (
        <FormField label="Celular" optional error={errors.phone?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.phone}
            prefix="+57" placeholder="300 123 4567" keyboardType="phone-pad" />
        </FormField>
      )} />
    </Screen>
  );
}
