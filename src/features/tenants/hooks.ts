import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createInvitation, createTenant, fetchTenants } from './api';
import type { TenantFormValues } from './schemas';

export const tenantKeys = {
  all: (orgId: string) => ['org', orgId, 'tenants'] as const,
  list: (orgId: string) => [...tenantKeys.all(orgId), 'list'] as const,
};

export function useTenants(organizationId: string) {
  return useQuery({ queryKey: tenantKeys.list(organizationId), queryFn: () => fetchTenants(organizationId) });
}

export function useCreateTenant(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: TenantFormValues) => createTenant(organizationId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', organizationId] }),
  });
}

export function useCreateInvitation(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tenantId: string) => createInvitation(tenantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantKeys.all(organizationId) }),
  });
}
