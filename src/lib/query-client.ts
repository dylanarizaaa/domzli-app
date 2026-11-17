import { QueryClient } from '@tanstack/react-query';

import { toAppError } from '@/lib/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => toAppError(error).kind === 'network' && failureCount < 2,
    },
    mutations: {
      // Las operaciones no se confirman sin respuesta del servidor (ADR-0010).
      networkMode: 'online',
      retry: false,
    },
  },
});
