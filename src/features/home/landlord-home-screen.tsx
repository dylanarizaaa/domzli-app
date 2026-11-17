import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert as NativeAlert, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useProperties } from '@/features/properties';
import { useTenants } from '@/features/tenants';
import { toAppError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useActiveOrganization, useAuth } from '@/providers/auth-provider';

import { buildLandlordHome } from './domain';
import { LandlordHomeView, type HomeDestination } from './landlord-home-view';

function useActiveLeases(organizationId: string) {
  return useQuery({
    queryKey: ['org', organizationId, 'leases', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_lease_overview')
        .select('id, monthly_rent, administration_mode, administration_value, property_name, tenant_name, days_to_end, is_expiring_soon, is_in_extension')
        .eq('organization_id', organizationId)
        .eq('status', 'active');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function LandlordHomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { organizationId, organizationName } = useActiveOrganization();
  const properties = useProperties(organizationId);
  const tenants = useTenants(organizationId);
  const leases = useActiveLeases(organizationId);

  const home = React.useMemo(
    () => buildLandlordHome(properties.data ?? [], leases.data ?? [], tenants.data ?? []),
    [properties.data, leases.data, tenants.data],
  );

  const error = properties.error ?? tenants.error ?? leases.error;
  if (properties.isPending || tenants.isPending || leases.isPending) {
    return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator /></View>;
  }
  if (error) {
    return (
      <View className="flex-1 justify-center gap-3 bg-background px-4">
        <Alert tone="danger" title="No pudimos cargar tu inicio">{toAppError(error).message}</Alert>
        <Button variant="outline" onPress={() => { properties.refetch(); tenants.refetch(); leases.refetch(); }}>Reintentar</Button>
      </View>
    );
  }

  const navigate = (destination: HomeDestination, label?: string) => {
    switch (destination) {
      case 'properties': return router.push('/properties');
      case 'new-property': return router.push('/properties/new');
      case 'tenants': return router.push('/tenants');
      case 'new-tenant': return router.push('/tenants/new');
      case 'leases': return router.push('/leases');
      case 'new-lease': return router.push('/leases');
      case 'account': return router.push('/account');
      case 'soon': return NativeAlert.alert(label ?? 'Próximamente', 'Esta sección llega en una próxima versión de Domzli.');
    }
  };

  const fullName = (session?.user.user_metadata?.full_name as string | undefined) || session?.user.email || 'Usuario';
  return <LandlordHomeView userName={fullName} organizationName={organizationName} home={home} onNavigate={navigate} />;
}
