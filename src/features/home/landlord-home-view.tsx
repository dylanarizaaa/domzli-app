import { ScrollView, View } from 'react-native';

import { ActionCard, type ActionItem } from '@/components/ui/action-card';
import { BalanceHeader } from '@/components/ui/balance-header';
import { HighlightCard, HighlightCarousel } from '@/components/ui/highlight-carousel';
import { ModuleGrid, type ModuleItem } from '@/components/ui/module-grid';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';

import type { HomeHighlight, LandlordHome } from './domain';

export type HomeDestination = 'properties' | 'tenants' | 'leases' | 'new-property' | 'new-tenant' | 'new-lease' | 'account' | 'soon';

export type LandlordHomeViewProps = {
  userName: string;
  organizationName: string;
  home: LandlordHome;
  onNavigate: (destination: HomeDestination, label?: string) => void;
};

/** Inicio del arrendador (dirección Billetera). Solo presenta: los datos llegan por props. */
export function LandlordHomeView({ userName, organizationName, home, onNavigate }: LandlordHomeViewProps) {
  // Fase 1: acciones de administración. En la Fase 2 pasan a ser las de pagos (registrar, revisar, cobrar, historial).
  const actions: ActionItem[] = [
    { key: 'property', label: 'Nuevo inmueble', icon: 'building-2', onPress: () => onNavigate('new-property') },
    { key: 'tenant', label: 'Nuevo inquilino', icon: 'user-plus', onPress: () => onNavigate('new-tenant') },
    { key: 'lease', label: 'Nuevo contrato', icon: 'file-pen', onPress: () => onNavigate('new-lease') },
    { key: 'payment', label: 'Registrar pago', icon: 'receipt', onPress: () => onNavigate('soon', 'Registrar pago') },
  ];

  const modules: ModuleItem[] = [
    { key: 'properties', label: 'Inmuebles', icon: 'building-2', tone: 'properties', onPress: () => onNavigate('properties') },
    { key: 'tenants', label: 'Inquilinos', icon: 'users', tone: 'tenants', onPress: () => onNavigate('tenants') },
    { key: 'leases', label: 'Contratos', icon: 'file-text', tone: 'leases', onPress: () => onNavigate('leases') },
    { key: 'charges', label: 'Cobros', icon: 'wallet', tone: 'charges', soon: true, onPress: () => onNavigate('soon', 'Cobros') },
    { key: 'expenses', label: 'Gastos', icon: 'banknote', tone: 'expenses', soon: true, onPress: () => onNavigate('soon', 'Gastos') },
    { key: 'documents', label: 'Documentos', icon: 'folder-open', tone: 'documents', soon: true, onPress: () => onNavigate('soon', 'Documentos') },
    { key: 'reports', label: 'Reportes', icon: 'trending-up', tone: 'reports', soon: true, onPress: () => onNavigate('soon', 'Reportes') },
    { key: 'more', label: 'Más', icon: 'ellipsis', tone: 'more', onPress: () => onNavigate('account') },
  ];

  const openHighlight = (highlight: HomeHighlight) => onNavigate(highlight.target);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 24 }}>
      <BalanceHeader
        label="Canon mensual esperado"
        amountCents={home.expectedMonthlyCents}
        caption={home.occupancyCaption}
        captionIcon="key-round"
        userName={userName}
        organization={organizationName}
        onAccount={() => onNavigate('account')}
        onNotifications={() => onNavigate('soon', 'Notificaciones')}
      />
      <ActionCard items={actions} />

      <View className="gap-3 px-5 pt-6">
        <SectionHeader title="Gestión" />
        <ModuleGrid items={modules} />
      </View>

      <View className="gap-1 pt-5">
        <View className="px-5">
          <SectionHeader title="Requiere tu atención" />
        </View>
        {home.highlights.length > 0 ? (
          <HighlightCarousel label="Requiere tu atención">
            {home.highlights.map((highlight) => (
              <HighlightCard
                key={highlight.key}
                tone={highlight.tone}
                eyebrow={highlight.eyebrow}
                title={highlight.title}
                meta={highlight.meta}
                onPress={() => openHighlight(highlight)}
              />
            ))}
          </HighlightCarousel>
        ) : (
          <View className="mx-5 rounded-3xl bg-success-subtle p-[18px]">
            <Text className="font-sans-semibold text-success-subtle-foreground">Todo al día</Text>
            <Text variant="body-sm" className="text-success-subtle-foreground">No hay contratos por vencer ni inquilinos pendientes.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
