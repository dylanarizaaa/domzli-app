import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { isSupabaseConfigured } from '@/lib/env';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

import { signInSchema, type SignInValues } from '../schemas';
import { AuthLayout } from './auth-layout';

export function SignInScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors } } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const signIn = useMutation({
    mutationFn: async (values: SignInValues) => {
      const { error } = await supabase.auth.signInWithPassword({ email: values.email.toLowerCase(), password: values.password });
      if (error) throw error;
    },
  });

  return (
    <AuthLayout title="Inicia sesión" subtitle="Administra tus inmuebles, contratos y pagos en un solo lugar.">
      {!isSupabaseConfigured ? (
        <Alert tone="warning" title="Falta conectar el servidor">Crea el archivo .env con los datos de tu proyecto de Supabase (mira .env.example).</Alert>
      ) : null}
      {signIn.error ? <Alert tone="danger">{toAppError(signIn.error).message}</Alert> : null}
      <Controller control={control} name="email" render={({ field }) => (
        <FormField label="Correo" error={errors.email?.message}>
          <Input value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.email}
            placeholder="ana@correo.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" />
        </FormField>
      )} />
      <Controller control={control} name="password" render={({ field }) => (
        <FormField label="Contraseña" error={errors.password?.message}>
          <PasswordInput value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} invalid={!!errors.password} autoComplete="current-password" />
        </FormField>
      )} />
      <Button size="lg" loading={signIn.isPending} onPress={() => handleSubmit((values) => signIn.mutate(values))()}>Iniciar sesión</Button>
      <Button variant="ghost" onPress={() => router.push('/sign-up')}>Crear una cuenta</Button>
    </AuthLayout>
  );
}
