import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';
import type { PropertyType } from '@/types/database';

import { PROPERTY_TYPE_LABELS } from '../domain';
import { toPropertyFormValues } from '../api';
import { useProperty, useSaveProperty } from '../hooks';
import { propertyFormDefaults, propertyFormSchema, type PropertyFormValues } from '../schemas';

const TYPE_OPTIONS = (Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((value) => ({
  value,
  label: PROPERTY_TYPE_LABELS[value],
}));

export function PropertyFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { organizationId } = useActiveOrganization();
  const existing = useProperty(organizationId, id);
  const createProperty = useSaveProperty(organizationId, id);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: propertyFormDefaults,
    mode: 'onBlur',
  });

  React.useEffect(() => {
    if (existing.data) reset(toPropertyFormValues(existing.data));
  }, [existing.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await createProperty.mutateAsync(values).then(() => router.back()).catch(() => undefined);
  });

  return (
    <Screen
      title={id ? 'Editar inmueble' : 'Registrar inmueble'}
      onBack={() => router.back()}
      footer={<Button size="lg" loading={createProperty.isPending} onPress={() => onSubmit()}>{id ? 'Guardar cambios' : 'Guardar inmueble'}</Button>}
    >
      {id && existing.isPending ? <ActivityIndicator /> : null}
      {createProperty.error ? (
        <Alert tone="danger" title="No pudimos guardar el inmueble">{toAppError(createProperty.error).message}</Alert>
      ) : null}

      <Controller control={control} name="name" render={({ field }) => (
        <FormField label="Nombre del inmueble" description="Así lo verás en tus listas. Ej.: Apto 301 Laureles." error={errors.name?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.name} placeholder="Apto 301" />
        </FormField>
      )} />

      <Controller control={control} name="propertyType" render={({ field }) => (
        <FormField label="Tipo de inmueble">
          <ChoiceChips label="Tipo de inmueble" options={TYPE_OPTIONS} value={field.value} onValueChange={field.onChange} />
        </FormField>
      )} />

      <Controller control={control} name="address" render={({ field }) => (
        <FormField label="Dirección" error={errors.address?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.address}
            placeholder="Carrera 70 # 44-21" autoComplete="street-address" />
        </FormField>
      )} />

      <Controller control={control} name="city" render={({ field }) => (
        <FormField label="Ciudad" error={errors.city?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.city} placeholder="Medellín" />
        </FormField>
      )} />

      <Controller control={control} name="neighborhood" render={({ field }) => (
        <FormField label="Barrio" optional>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} placeholder="Laureles" />
        </FormField>
      )} />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller control={control} name="bedrooms" render={({ field }) => (
            <FormField label="Habitaciones" optional error={errors.bedrooms?.message}>
              <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.bedrooms} keyboardType="number-pad" placeholder="3" />
            </FormField>
          )} />
        </View>
        <View className="flex-1">
          <Controller control={control} name="bathrooms" render={({ field }) => (
            <FormField label="Baños" optional error={errors.bathrooms?.message}>
              <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.bathrooms} keyboardType="number-pad" placeholder="2" />
            </FormField>
          )} />
        </View>
      </View>

      <Controller control={control} name="areaM2" render={({ field }) => (
        <FormField label="Área en m²" optional error={errors.areaM2?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.areaM2} keyboardType="decimal-pad" placeholder="72" />
        </FormField>
      )} />

      <Controller control={control} name="administrationPesos" render={({ field }) => (
        <FormField label="Cuota de administración" optional description="Valor mensual de la administración del edificio o conjunto.">
          <MoneyInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />
        </FormField>
      )} />
    </Screen>
  );
}
