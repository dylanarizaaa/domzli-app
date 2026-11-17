import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PickedFile } from '@/services/storage';

import * as api from './api';
import type { LeaseSummary } from './domain';
import type { LeaseWizardValues } from './schemas';

export const leaseKeys = {
  all: (orgId: string) => ['org', orgId, 'leases'] as const,
  list: (orgId: string) => [...leaseKeys.all(orgId), 'list'] as const,
  detail: (orgId: string, id: string) => [...leaseKeys.all(orgId), 'detail', id] as const,
  documents: (orgId: string, id: string) => [...leaseKeys.all(orgId), 'documents', id] as const,
  adjustments: (orgId: string, id: string) => [...leaseKeys.all(orgId), 'adjustments', id] as const,
};

/** Un cambio de contrato afecta inmuebles, inicio y finanzas: se invalida toda la organización. */
function useInvalidateOrg(organizationId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['org', organizationId] });
}

export function useLeases(organizationId: string) {
  return useQuery({ queryKey: leaseKeys.list(organizationId), queryFn: () => api.fetchLeases(organizationId) });
}

export function useLease(organizationId: string, leaseId: string) {
  return useQuery({ queryKey: leaseKeys.detail(organizationId, leaseId), queryFn: () => api.fetchLease(leaseId) });
}

export function useLeaseDocuments(organizationId: string, leaseId: string) {
  return useQuery({ queryKey: leaseKeys.documents(organizationId, leaseId), queryFn: () => api.fetchLeaseDocuments(leaseId) });
}

export function useRentAdjustments(organizationId: string, leaseId: string) {
  return useQuery({ queryKey: leaseKeys.adjustments(organizationId, leaseId), queryFn: () => api.fetchRentAdjustments(leaseId) });
}

export function useCreateLease(organizationId: string) {
  const invalidate = useInvalidateOrg(organizationId);
  return useMutation({
    mutationFn: ({ values, activate }: { values: LeaseWizardValues; activate: boolean }) => api.createLease(organizationId, values, activate),
    onSettled: invalidate,
  });
}

export function useLeaseActions(organizationId: string, leaseId: string) {
  const invalidate = useInvalidateOrg(organizationId);
  const options = { onSuccess: invalidate };
  return {
    activate: useMutation({ mutationFn: () => api.activateLease(leaseId), ...options }),
    deleteDraft: useMutation({ mutationFn: () => api.deleteDraft(leaseId), ...options }),
    renew: useMutation({ mutationFn: (endDate: string) => api.renewLease(leaseId, endDate), ...options }),
    terminate: useMutation({
      mutationFn: ({ date, reason }: { date: string; reason: string }) => api.terminateLease(leaseId, date, reason),
      ...options,
    }),
    adjust: useMutation({
      mutationFn: ({ effectiveFrom, rentPesos, reason }: { effectiveFrom: string; rentPesos: number; reason: string }) =>
        api.applyRentAdjustment(leaseId, effectiveFrom, rentPesos, reason),
      ...options,
    }),
  };
}

export function useUploadLeaseDocument(organizationId: string, lease: Pick<LeaseSummary, 'id' | 'propertyId'> | undefined) {
  const invalidate = useInvalidateOrg(organizationId);
  return useMutation({
    mutationFn: ({ file, title, shared }: { file: PickedFile; title: string; shared: boolean }) => {
      if (!lease) throw new Error('LEASE_NOT_FOUND');
      return api.uploadLeaseDocument(lease, organizationId, file, title, shared);
    },
    onSuccess: invalidate,
  });
}
