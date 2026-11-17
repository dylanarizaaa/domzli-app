import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { BalanceHeader } from '@/components/ui/balance-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { formatDateShort } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { toCents } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import { useActiveOrganization, useAuth } from '@/providers/auth-provider';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="body-sm" className="text-muted-foreground">{label}</Text>
      {children}
    </View>
  );
}

/** Inicio del inquilino (Fase 1): su contrato. Los cobros y pagos llegan en la Fase 2. */
export function TenantHomeScreen() {
  const { session, signOut } = useAuth();
  const { organizationId, organizationName } = useActiveOrganization();
  const lease = useQuery({
    queryKey: ['org', organizationId, 'my-lease'],
    queryFn: async () => {
      // La RLS solo devuelve los contratos del propio inquilino.
      const { data, error } = await supabase
        .from('v_lease_overview')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const name = (session?.user.user_metadata?.full_name as string | undefined) || session?.user.email || 'Usuario';
  const current = lease.data;
  const status = current ? (current.status === 'terminated' ? 'terminated' : current.is_in_extension ? 'extension' : current.is_expiring_soon ? 'expiring' : 'active') : null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 32 }}>
      <BalanceHeader
        label={current ? 'Canon mensual' : 'Tu contrato'}
        amountCents={current ? toCents(current.monthly_rent) : undefined}
        valueText={current ? undefined : 'Sin contrato'}
        caption={current ? `Pagas el día ${current.payment_day} de cada mes` : undefined}
        captionIcon="calendar-days"
        userName={name}
        organization={organizationName}
      />
      <View className="gap-3 px-5 pt-6">
        {lease.isPending ? <ActivityIndicator /> : null}
        {lease.error ? <Alert tone="danger" title="No pudimos cargar tu contrato">{toAppError(lease.error).message}</Alert> : null}
        {current && status ? (
          <>
            <SectionHeader title="Mi contrato" />
            <Card className="gap-3 p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="title" className="flex-1" numberOfLines={1}>{current.property_name}</Text>
                <StatusBadge entity="lease" status={status} size="sm" />
              </View>
              <Row label="Ciudad"><Text variant="body-sm">{current.property_city}</Text></Row>
              <Row label="Inicio"><Text variant="body-sm">{formatDateShort(current.start_date)}</Text></Row>
              <Row label="Fin"><Text variant="body-sm">{formatDateShort(current.end_date)}</Text></Row>
              <Row label="Canon"><MoneyText amountCents={toCents(current.monthly_rent)} className="font-sans-semibold text-sm" /></Row>
              {current.administration_mode === 'separate' ? (
                <Row label="Administración"><MoneyText amountCents={toCents(current.administration_value)} className="text-sm" /></Row>
              ) : null}
            </Card>
          </>
        ) : null}
        {!lease.isPending && !current && !lease.error ? (
          <Alert tone="info" title="Aún no tienes un contrato activo">Tu arrendador debe activar el contrato para que lo veas aquí.</Alert>
        ) : null}
        <Alert tone="info">Pronto podrás ver tus cobros y reportar tus pagos desde aquí.</Alert>
        <Button variant="outline" iconStart="log-out" onPress={signOut}>Cerrar sesión</Button>
      </View>
    </ScrollView>
  );
}
