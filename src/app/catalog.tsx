import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { TabBar } from '@/components/ui/tab-bar';
import { Text } from '@/components/ui/text';
import { buildLandlordHome, LandlordHomeView } from '@/features/home';
import { PropertyCard, type PropertySummary } from '@/features/properties';
import { TenantCard, type TenantSummary } from '@/features/tenants';

// Datos de ejemplo: solo para el muestrario de desarrollo.
const PROPERTIES: PropertySummary[] = [
  { id: '1', name: 'Apto 301 Laureles', address: 'Cra 70 # 44-21', city: 'Medellín', neighborhood: 'Laureles', type: 'apartment', status: 'leased', currentRentCents: 125000000, tenantName: 'Juan Pérez', leaseEndDate: '2027-01-31' },
  { id: '2', name: 'Apto 802 Cedritos', address: 'Calle 147 # 11-20', city: 'Bogotá', neighborhood: 'Cedritos', type: 'apartment', status: 'leased', currentRentCents: 210000000, tenantName: 'María Gómez', leaseEndDate: '2026-12-14' },
  { id: '3', name: 'Casa 12 La Calera', address: 'Calle 37 Sur # 27-15', city: 'Envigado', neighborhood: null, type: 'house', status: 'available', currentRentCents: null, tenantName: null, leaseEndDate: null },
];
const TENANTS: TenantSummary[] = [
  { id: '1', name: 'Juan Pérez', documentType: 'CC', documentMasked: 'CC •••• 4050', email: 'juan@correo.com', phone: '+57 300 123 4567', access: 'linked' },
  { id: '2', name: 'María Gómez', documentType: 'PPT', documentMasked: 'PPT •••• 8812', email: 'maria@correo.com', phone: '+57 315 987 6543', access: 'none' },
];
const HOME = buildLandlordHome(
  PROPERTIES,
  [
    { id: 'l1', monthly_rent: 1250000, administration_mode: 'separate', administration_value: 180000, property_name: 'Apto 301 Laureles', tenant_name: 'Juan Pérez', days_to_end: 75, is_expiring_soon: false, is_in_extension: false },
    { id: 'l2', monthly_rent: 2100000, administration_mode: 'included', administration_value: 0, property_name: 'Apto 802 Cedritos', tenant_name: 'María Gómez', days_to_end: 28, is_expiring_soon: true, is_in_extension: false },
  ],
  TENANTS,
  {
    overview: {
      monthStart: '2026-11-01', expectedCents: 353000000, collectedCents: 143000000, pendingCents: 210000000,
      overdueCents: 210000000, overdueCount: 1, inReviewCount: 1, inReviewCents: 210000000,
    },
    inReview: [{ amountCents: 210000000, tenantName: 'María Gómez', reporterName: 'María Gómez' }],
    overdue: [],
  },
);

type CatalogView = 'home' | 'components';

/** Muestrario de desarrollo: la pantalla de inicio y los componentes con datos de ejemplo. */
export default function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = React.useState<CatalogView>('home');
  const [tab, setTab] = React.useState('home');
  const [type, setType] = React.useState<'apartment' | 'house' | 'commercial'>('apartment');
  const [rent, setRent] = React.useState('1250000');

  if (view === 'home') {
    return (
      <View className="flex-1 bg-background">
        <LandlordHomeView
          userName="Ana López"
          organizationName="Inmuebles López"
          home={HOME}
          onNavigate={(destination) => { if (destination === 'account') setView('components'); }}
        />
        <TabBar
          value={tab}
          onValueChange={(value) => { setTab(value); if (value === 'account') setView('components'); }}
          centerAction={{ label: 'Crear', onPress: () => setView('components') }}
          items={[
            { value: 'home', label: 'Inicio', icon: 'house' },
            { value: 'finance', label: 'Finanzas', icon: 'wallet' },
            { value: 'leases', label: 'Contratos', icon: 'file-text' },
            { value: 'account', label: 'Cuenta', icon: 'circle-user' },
          ]}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 16, gap: 24 }}>
      <View className="flex-row items-center justify-between">
        <Text variant="h1">Componentes</Text>
        <Button variant="outline" size="sm" onPress={() => setView('home')}>Ver inicio</Button>
      </View>

      <View className="gap-3">
        <Text variant="section">Botones</Text>
        <View className="flex-row flex-wrap gap-2">
          <Button iconStart="plus">Registrar pago</Button>
          <Button variant="secondary">Ver contrato</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="destructive">Anular cobro</Button>
          <Button loading>Guardando</Button>
        </View>
      </View>

      <View className="gap-3">
        <Text variant="section">Estados</Text>
        <View className="flex-row flex-wrap gap-2">
          <StatusBadge entity="property" status="available" />
          <StatusBadge entity="property" status="leased" />
          <StatusBadge entity="property" status="maintenance" />
          <StatusBadge entity="lease" status="active" />
          <StatusBadge entity="lease" status="expiring" />
          <StatusBadge entity="lease" status="extension" />
          <StatusBadge entity="access" status="invited" />
          <Badge tone="outline">72 m²</Badge>
        </View>
      </View>

      <View className="gap-3">
        <Text variant="section">Formulario</Text>
        <FormField label="Nombre del inmueble" description="Así lo verás en tus listas.">
          <Input placeholder="Apto 301" />
        </FormField>
        <FormField label="Correo del inquilino" error="Escribe un correo válido, por ejemplo juan@correo.com.">
          <Input defaultValue="juan@correo" invalid />
        </FormField>
        <FormField label="Canon mensual">
          <MoneyInput value={rent} onValueChange={setRent} />
        </FormField>
        <FormField label="Tipo de inmueble">
          <ChoiceChips label="Tipo de inmueble" value={type} onValueChange={setType}
            options={[{ value: 'apartment', label: 'Apartamento' }, { value: 'house', label: 'Casa' }, { value: 'commercial', label: 'Local comercial' }]} />
        </FormField>
      </View>

      <View className="gap-3">
        <Text variant="section">Inmuebles</Text>
        {PROPERTIES.map((property) => <PropertyCard key={property.id} property={property} />)}
      </View>

      <View className="gap-3">
        <Text variant="section">Inquilinos</Text>
        {TENANTS.map((tenant) => <TenantCard key={tenant.id} tenant={tenant} />)}
      </View>

      <View className="gap-3">
        <Text variant="section">Mensajes</Text>
        <Alert tone="info">Aprobar no confirma que el dinero llegó a tu cuenta.</Alert>
        <Alert tone="danger" title="No pudimos guardar los cambios">Revisa tu conexión e inténtalo de nuevo.</Alert>
        <EmptyState icon="building-2" title="Registra tu primer inmueble" description="Agrega la dirección y las características."
          action={<Button iconStart="plus">Registrar inmueble</Button>} />
      </View>
    </ScrollView>
  );
}
