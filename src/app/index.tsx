import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/auth-provider';

/** Punto de entrada: lleva a cada usuario a su inicio según su sesión y su rol. */
export default function Index() {
  const { session, contexts, activeContext } = useAuth();
  if (!session) return <Redirect href="/sign-in" />;
  if (contexts.length === 0) return <Redirect href="/onboarding" />;
  if (activeContext?.role === 'tenant') return <Redirect href="/portal" />;
  return <Redirect href="/home" />;
}
