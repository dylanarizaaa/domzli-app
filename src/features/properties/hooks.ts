import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createProperty, fetchProperties } from './api';
import type { PropertyFormValues } from './schemas';

export const propertyKeys = {
  all: (orgId: string) => ['org', orgId, 'properties'] as const,
  list: (orgId: string) => [...propertyKeys.all(orgId), 'list'] as const,
};

export function useProperties(organizationId: string) {
  return useQuery({ queryKey: propertyKeys.list(organizationId), queryFn: () => fetchProperties(organizationId) });
}

export function useCreateProperty(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: PropertyFormValues) => createProperty(organizationId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', organizationId] }),
  });
}
