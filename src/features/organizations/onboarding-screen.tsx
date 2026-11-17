import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AuthLayout } from '@/features/auth/screens/auth-layout';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useContextStore } from '@/stores/context-store';

/** Primer ingreso de un arrendador: crea su organización y queda como propietario. */
export function OnboardingScreen() {
  const router = useRouter();
  const { session, refreshContexts, signOut } = useAuth();
  const pendingInviteToken = useContextStore((s) => s.pendingInviteToken);
  const suggested = (session?.user.user_metadata?.full_name as string | undefined) ?? '';
  const [name, setName] = React.useState(suggested);
  const [touched, setTouched] = React.useState(false);
  const invalid = name.trim().length < 2;

  const createOrganization = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_organization', { p_name: name.trim() });
      if (error) throw error;
      await refreshContexts();
    },
  });

  return (
    <AuthLayout title="Crea tu organización" subtitle="Es el espacio donde administras tus inmuebles. Puede llevar tu nombre o el de tu inmobiliaria.">
      {createOrganization.error ? <Alert tone="danger">{toAppError(createOrganization.error).message}</Alert> : null}
      <FormField label="Nombre de la organización" error={touched && invalid ? 'Escribe un nombre de al menos 2 caracteres.' : undefined}>
        <Input value={name} onChangeText={setName} onBlur={() => setTouched(true)} invalid={touched && invalid} placeholder="Inmuebles López" autoCapitalize="words" />
      </FormField>
      <Button size="lg" loading={createOrganization.isPending} onPress={() => { setTouched(true); if (!invalid) createOrganization.mutate(); }}>
        Crear organización
      </Button>
      {pendingInviteToken ? (
        <Button variant="secondary" onPress={() => router.push(`/invite/${pendingInviteToken}`)}>Continuar con mi invitación de inquilino</Button>
      ) : (
        <Alert tone="info">¿Eres inquilino? Abre el enlace de invitación que te compartió tu arrendador.</Alert>
      )}
      <Button variant="ghost" onPress={signOut}>Cerrar sesión</Button>
    </AuthLayout>
  );
}
