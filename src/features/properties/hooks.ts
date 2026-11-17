import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createProperty, fetchProperties, fetchProperty, updateProperty } from './api';
import type { PropertyFormValues } from './schemas';

export const propertyKeys = {
  all: (orgId: string) => ['org', orgId, 'properties'] as const,
  list: (orgId: string) => [...propertyKeys.all(orgId), 'list'] as const,
  detail: (orgId: string, id: string) => [...propertyKeys.all(orgId), 'detail', id] as const,
};

export function useProperties(organizationId: string) {
  return useQuery({ queryKey: propertyKeys.list(organizationId), queryFn: () => fetchProperties(organizationId) });
}

export function useProperty(organizationId: string, propertyId: string | undefined) {
  return useQuery({
    queryKey: propertyKeys.detail(organizationId, propertyId ?? ''),
    queryFn: () => fetchProperty(propertyId!),
    enabled: Boolean(propertyId),
  });
}

export function useSaveProperty(organizationId: string, propertyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: PropertyFormValues): Promise<void> => {
      if (propertyId) await updateProperty(propertyId, values);
      else await createProperty(organizationId, values);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', organizationId] }),
  });
}

/** @deprecated usa useSaveProperty */
export const useCreateProperty = (organizationId: string) => useSaveProperty(organizationId);
