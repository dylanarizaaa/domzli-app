import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { PaymentFormScreen } from '@/features/finance';
import { useMyLease } from '@/features/tenant-portal';
import { useActiveOrganization } from '@/providers/auth-provider';

export default function TenantPayRoute() {
  const { organizationId } = useActiveOrganization();
  const lease = useMyLease(organizationId);
  if (lease.isPending) return <View className="flex-1 items-center justify-center bg-background"><ActivityIndicator /></View>;
  if (!lease.data || lease.data.status !== 'active') {
    return <Screen title="Reportar pago"><Alert tone="info">Necesitas un contrato vigente para reportar pagos.</Alert></Screen>;
  }
  return <PaymentFormScreen mode="tenant" leaseId={lease.data.id} />;
}
