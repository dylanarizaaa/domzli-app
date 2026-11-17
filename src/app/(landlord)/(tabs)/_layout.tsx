import { Tabs, useRouter } from 'expo-router';

import { TabBar, type TabBarItem } from '@/components/ui/tab-bar';

const ITEMS: TabBarItem[] = [
  { value: 'home', label: 'Inicio', icon: 'house' },
  { value: 'finance', label: 'Finanzas', icon: 'wallet' },
  { value: 'leases', label: 'Contratos', icon: 'file-text' },
  { value: 'account', label: 'Cuenta', icon: 'circle-user' },
];

/** Navegación principal del arrendador: 4 destinos y botón central "Crear" (ADR-0015). */
export default function LandlordTabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <TabBar
          items={ITEMS}
          value={state.routes[state.index]?.name ?? 'home'}
          onValueChange={(name) => {
            const route = state.routes.find((r) => r.name === name);
            if (route) navigateToTab(route.key);
          }}
          centerAction={{ label: 'Crear', onPress: () => router.push('/create') }}
        />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="leases" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
