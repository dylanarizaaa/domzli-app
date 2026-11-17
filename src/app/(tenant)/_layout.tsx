import { Stack } from 'expo-router';

export default function TenantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="portal" />
      <Stack.Screen name="pay" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
