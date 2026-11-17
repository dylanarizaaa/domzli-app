import { Tabs, useRouter } from 'expo-router';

import { TabBar, type TabBarItem } from '@/components/ui/tab-bar';

const ITEMS: TabBarItem[] = [
  { value: 'index', label: 'Inicio', icon: 'house' },
  { value: 'payments', label: 'Pagos', icon: 'wallet' },
  { value: 'lease', label: 'Mi contrato', icon: 'file-text' },
  { value: 'account', label: 'Cuenta', icon: 'circle-user' },
];

/** Navegación del inquilino: Inicio · Pagos · [Reportar pago] · Mi contrato · Cuenta. */
export default function TenantTabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <TabBar
          items={ITEMS}
          value={state.routes[state.index]?.name ?? 'index'}
          onValueChange={(name) => {
            const route = state.routes.find((r) => r.name === name);
            if (route) navigateToTab(route.key);
          }}
          centerAction={{ label: 'Reportar pago', icon: 'receipt', onPress: () => router.push('/pay') }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="payments" />
      <Tabs.Screen name="lease" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
