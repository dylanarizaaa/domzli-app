import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/features/auth/screens/auth-layout';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { useContextStore } from '@/stores/context-store';

/** Aceptación de una invitación (enlace domzli://invite/{token}). */
export function InvitationScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session, refreshContexts, setActiveContext } = useAuth();
  const setPendingInviteToken = useContextStore((s) => s.setPendingInviteToken);

  const preview = useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invitation_preview', { p_token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: Boolean(token),
  });

  const accept = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
      if (error) throw error;
      setPendingInviteToken(null);
      await refreshContexts();
      setActiveContext(data);
      router.replace('/');
    },
  });

  // Si aún no ha iniciado sesión, la invitación se retoma después de autenticarse.
  const continueWith = (path: '/sign-in' | '/sign-up') => {
    setPendingInviteToken(token);
    router.push(path);
  };

  if (preview.isPending) {
    return <AuthLayout title="Invitación" subtitle="Estamos buscando tu invitación."><ActivityIndicator /></AuthLayout>;
  }
  if (preview.error || !preview.data) {
    return (
      <AuthLayout title="Invitación no encontrada" subtitle="El enlace es incorrecto o está incompleto.">
        <Alert tone="danger">{preview.error ? toAppError(preview.error).message : 'Pide a tu arrendador que te comparta la invitación de nuevo.'}</Alert>
        <Button variant="outline" onPress={() => router.replace('/')}>Ir al inicio</Button>
      </AuthLayout>
    );
  }

  const invitation = preview.data;
  if (invitation.status !== 'pending') {
    const message = invitation.status === 'accepted' ? 'Esta invitación ya fue aceptada. Inicia sesión para ver tu contrato.'
      : invitation.status === 'expired' ? 'La invitación venció. Pide una nueva a tu arrendador.'
      : 'La invitación fue cancelada. Pide una nueva a tu arrendador.';
    return (
      <AuthLayout title="Invitación no disponible" subtitle={invitation.organization_name}>
        <Alert tone="warning">{message}</Alert>
        <Button variant="outline" onPress={() => router.replace('/')}>Ir al inicio</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`${invitation.organization_name} te invita`}
      subtitle={`Acepta para consultar tu contrato en Domzli. La invitación es para ${invitation.email_masked}.`}
    >
      {accept.error ? <Alert tone="danger">{toAppError(accept.error).message}</Alert> : null}
      {session ? (
        <Button size="lg" loading={accept.isPending} onPress={() => accept.mutate()}>Aceptar invitación</Button>
      ) : (
        <>
          <Alert tone="info">Crea tu cuenta o inicia sesión con el correo invitado. Después vuelve a abrir este enlace o continúa desde la app.</Alert>
          <Button size="lg" onPress={() => continueWith('/sign-up')}>Crear cuenta</Button>
          <Button variant="outline" onPress={() => continueWith('/sign-in')}>Ya tengo cuenta</Button>
        </>
      )}
    </AuthLayout>
  );
}
