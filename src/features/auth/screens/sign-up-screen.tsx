import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { DATA_CONSENT_VERSION, signUpSchema, type SignUpValues } from '../schemas';
import { AuthLayout } from './auth-layout';

export function SignUpScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors } } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '', consent: false },
  });
  const signUp = useMutation({
    mutationFn: async (values: SignUpValues) => {
      const { data, error } = await supabase.auth.signUp({
        email: values.email.toLowerCase(),
        password: values.password,
        options: {
          data: { full_name: values.fullName, data_consent_version: DATA_CONSENT_VERSION },
          emailRedirectTo: Linking.createURL('/'),
        },
      });
      if (error) throw error;
      // Con confirmación de correo activa no hay sesión hasta que el usuario confirma.
      return { needsConfirmation: !data.session, email: values.email.toLowerCase() };
    },
  });

  if (signUp.data?.needsConfirmation) {
    return (
      <AuthLayout title="Confirma tu correo" subtitle={`Te enviamos un enlace a ${signUp.data.email}. Ábrelo para activar tu cuenta.`}>
        <Alert tone="info">Si no lo ves en unos minutos, revisa la carpeta de correo no deseado.</Alert>
        <Button variant="outline" onPress={() => router.replace('/sign-in')}>Volver a iniciar sesión</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Empieza a administrar tus arriendos. Si te invitaron como inquilino, usa el mismo correo de la invitación.">
      {signUp.error ? <Alert tone="danger">{toAppError(signUp.error).message}</Alert> : null}
      <Controller control={control} name="fullName" render={({ field }) => (
        <FormField label="Nombre completo" error={errors.fullName?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.fullName}
            placeholder="Ana López" autoComplete="name" autoCapitalize="words" />
        </FormField>
      )} />
      <Controller control={control} name="email" render={({ field }) => (
        <FormField label="Correo" error={errors.email?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.email}
            placeholder="ana@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
        </FormField>
      )} />
      <Controller control={control} name="password" render={({ field }) => (
        <FormField label="Contraseña" description="Mínimo 8 caracteres." error={errors.password?.message}>
          <PasswordInput value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.password} autoComplete="new-password" />
        </FormField>
      )} />
      <Controller control={control} name="consent" render={({ field }) => (
        <FormField label="Tratamiento de datos" error={errors.consent?.message}>
          <Checkbox checked={field.value} onCheckedChange={field.onChange} invalid={!!errors.consent}
            label="Autorizo el tratamiento de mis datos personales según la política de Domzli." />
        </FormField>
      )} />
      <Button size="lg" loading={signUp.isPending} onPress={() => handleSubmit((values) => signUp.mutate(values))()}>Crear cuenta</Button>
      <Button variant="ghost" onPress={() => router.replace('/sign-in')}>Ya tengo cuenta</Button>
    </AuthLayout>
  );
}
