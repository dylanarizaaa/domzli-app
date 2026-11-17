import { ScrollView, View } from 'react-native';

import { ActionCard, type ActionItem } from '@/components/ui/action-card';
import { BalanceHeader } from '@/components/ui/balance-header';
import { HighlightCard, HighlightCarousel } from '@/components/ui/highlight-carousel';
import { ModuleGrid, type ModuleItem } from '@/components/ui/module-grid';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';

import type { HomeHighlight, LandlordHome } from './domain';

export type HomeDestination =
  | 'properties' | 'tenants' | 'leases' | 'finance' | 'payments'
  | 'new-property' | 'new-tenant' | 'new-lease' | 'new-payment' | 'new-charge' | 'account' | 'soon';

export type LandlordHomeViewProps = {
  userName: string;
  organizationName: string;
  home: LandlordHome;
  onNavigate: (destination: HomeDestination, label?: string) => void;
};

/** Inicio del arrendador (dirección Billetera). Solo presenta: los datos llegan por props. */
export function LandlordHomeView({ userName, organizationName, home, onNavigate }: LandlordHomeViewProps) {
  const actions: ActionItem[] = [
    { key: 'payment', label: 'Registrar pago', icon: 'receipt', onPress: () => onNavigate('new-payment') },
    { key: 'review', label: 'Revisar pagos', icon: 'circle-check', badge: home.inReviewCount || undefined, onPress: () => onNavigate('finance') },
    { key: 'charge', label: 'Nuevo cobro', icon: 'circle-dollar-sign', onPress: () => onNavigate('new-charge') },
    { key: 'history', label: 'Historial', icon: 'rotate-ccw', onPress: () => onNavigate('payments') },
  ];

  const modules: ModuleItem[] = [
    { key: 'properties', label: 'Inmuebles', icon: 'building-2', tone: 'properties', onPress: () => onNavigate('properties') },
    { key: 'tenants', label: 'Inquilinos', icon: 'users', tone: 'tenants', onPress: () => onNavigate('tenants') },
    { key: 'leases', label: 'Contratos', icon: 'file-text', tone: 'leases', onPress: () => onNavigate('leases') },
    { key: 'charges', label: 'Cobros', icon: 'wallet', tone: 'charges', onPress: () => onNavigate('finance') },
    { key: 'expenses', label: 'Gastos', icon: 'banknote', tone: 'expenses', soon: true, onPress: () => onNavigate('soon', 'Gastos') },
    { key: 'documents', label: 'Documentos', icon: 'folder-open', tone: 'documents', soon: true, onPress: () => onNavigate('soon', 'Documentos') },
    { key: 'reports', label: 'Reportes', icon: 'trending-up', tone: 'reports', soon: true, onPress: () => onNavigate('soon', 'Reportes') },
    { key: 'more', label: 'Más', icon: 'ellipsis', tone: 'more', onPress: () => onNavigate('account') },
  ];

  const openHighlight = (highlight: HomeHighlight) => onNavigate(highlight.target);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 24 }}>
      <BalanceHeader
        label={home.header.label}
        amountCents={home.header.amountCents}
        caption={home.header.caption}
        captionIcon={home.header.icon}
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
            <Text variant="body-sm" className="text-success-subtle-foreground">No hay pagos por revisar, cobros vencidos ni contratos por vencer.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
