import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import type { ChargeConcept } from '@/types/database';

import * as api from './api';

export const financeKeys = {
  all: (orgId: string) => ['org', orgId, 'finance'] as const,
  overview: (orgId: string) => [...financeKeys.all(orgId), 'overview'] as const,
  charges: (orgId: string, filter: api.ChargeFilter) => [...financeKeys.all(orgId), 'charges', filter] as const,
  items: (orgId: string, ids: string[]) => [...financeKeys.all(orgId), 'items', ids] as const,
  payments: (orgId: string, filter: api.PaymentFilter) => [...financeKeys.all(orgId), 'payments', filter] as const,
  payment: (orgId: string, id: string) => [...financeKeys.all(orgId), 'payment', id] as const,
};

function useInvalidateOrg(organizationId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['org', organizationId] });
}

/**
 * Pone al día los cobros al abrir las pantallas financieras del staff. Es idempotente y sirve de
 * respaldo si la tarea programada (pg_cron) no corre en el proyecto.
 */
export function useSyncCharges(organizationId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  React.useEffect(() => {
    if (!enabled) return;
    api.syncCharges(organizationId)
      .then((created) => {
        if (created > 0) queryClient.invalidateQueries({ queryKey: ['org', organizationId] });
      })
      .catch(() => undefined);
  }, [organizationId, enabled, queryClient]);
}

export function useFinanceOverview(organizationId: string) {
  return useQuery({ queryKey: financeKeys.overview(organizationId), queryFn: () => api.fetchFinanceOverview(organizationId) });
}

export function useCharges(organizationId: string, filter: api.ChargeFilter = {}) {
  return useQuery({ queryKey: financeKeys.charges(organizationId, filter), queryFn: () => api.fetchCharges(organizationId, filter) });
}

export function useChargeItems(organizationId: string, chargeIds: string[]) {
  return useQuery({
    queryKey: financeKeys.items(organizationId, chargeIds),
    queryFn: () => api.fetchChargeItems(chargeIds),
    enabled: chargeIds.length > 0,
  });
}

export function usePayments(organizationId: string, filter: api.PaymentFilter = {}) {
  return useQuery({ queryKey: financeKeys.payments(organizationId, filter), queryFn: () => api.fetchPayments(organizationId, filter) });
}

export function usePayment(organizationId: string, paymentId: string) {
  return useQuery({ queryKey: financeKeys.payment(organizationId, paymentId), queryFn: () => api.fetchPayment(paymentId) });
}

export function useReportPayment(organizationId: string) {
  const invalidate = useInvalidateOrg(organizationId);
  return useMutation({ mutationFn: api.reportPayment, onSuccess: invalidate });
}

export function usePaymentActions(organizationId: string) {
  const invalidate = useInvalidateOrg(organizationId);
  return {
    approve: useMutation({ mutationFn: (id: string) => api.reviewPayment(id, 'approve'), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.reviewPayment(id, 'reject', reason), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (id: string) => api.cancelPayment(id), onSuccess: invalidate }),
    reverse: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.reversePayment(id, reason), onSuccess: invalidate }),
  };
}

export function useChargeActions(organizationId: string) {
  const invalidate = useInvalidateOrg(organizationId);
  return {
    create: useMutation({
      mutationFn: (input: { leaseId: string; dueDate: string; concept: ChargeConcept; description: string; amountPesos: number }) => api.createManualCharge(input),
      onSuccess: invalidate,
    }),
    void: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => api.voidCharge(id, reason), onSuccess: invalidate }),
  };
}
