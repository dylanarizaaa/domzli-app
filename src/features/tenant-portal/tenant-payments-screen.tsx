import { ActivityIndicator, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PaymentCard, usePaymentActions, usePayments } from '@/features/finance';
import { toAppError } from '@/lib/errors';
import { useActiveOrganization } from '@/providers/auth-provider';

export function TenantPaymentsScreen() {
  const { organizationId } = useActiveOrganization();
  const payments = usePayments(organizationId);
  const actions = usePaymentActions(organizationId);

  return (
    <Screen title="Mis pagos">
      {actions.cancel.error ? <Alert tone="danger">{toAppError(actions.cancel.error).message}</Alert> : null}
      {payments.isPending ? <ActivityIndicator className="mt-6" /> : null}
      {payments.error ? <Alert tone="danger">{toAppError(payments.error).message}</Alert> : null}
      {!payments.isPending && (payments.data ?? []).length === 0 ? (
        <EmptyState icon="receipt" title="Aún no has reportado pagos" description="Cuando pagues, repórtalo con el comprobante desde el botón central." />
      ) : null}
      <View className="gap-3">
        {(payments.data ?? []).map((p) => (
          <PaymentCard
            key={p.id}
            payment={p}
            footer={p.status === 'in_review' && p.source === 'tenant_report' ? (
              <Button size="sm" variant="ghost" iconStart="undo-2" loading={actions.cancel.isPending && actions.cancel.variables === p.id}
                onPress={() => actions.cancel.mutate(p.id)}>
                Retirar reporte
              </Button>
            ) : undefined}
          />
        ))}
      </View>
    </Screen>
  );
}
