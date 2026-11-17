import '../theme/global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { env } from '@/lib/env';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading, contexts, activeContext } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Sora_600SemiBold, Sora_700Bold,
  });
  const ready = (fontsLoaded || Boolean(fontError)) && !isLoading;

  React.useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = Boolean(session);
  const isStaff = signedIn && (activeContext?.role === 'owner' || activeContext?.role === 'admin');
  const isTenant = signedIn && activeContext?.role === 'tenant';

  // La interfaz decide la navegación por rol; la autorización real está en la base de datos (RLS).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="invite/[token]" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && contexts.length === 0}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={isStaff}>
        <Stack.Screen name="(landlord)" />
      </Stack.Protected>
      <Stack.Protected guard={isTenant}>
        <Stack.Screen name="(tenant)" />
      </Stack.Protected>
      <Stack.Protected guard={env.enableCatalog}>
        <Stack.Screen name="catalog" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
