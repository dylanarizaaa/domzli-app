import { useQuery } from '@tanstack/react-query';

import { toLeaseSummary } from '@/features/leases';
import { supabase } from '@/lib/supabase';

/** Contrato del inquilino en la organización activa (la RLS solo devuelve los suyos). */
export function useMyLease(organizationId: string) {
  return useQuery({
    queryKey: ['org', organizationId, 'my-lease'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_lease_overview')
        .select('*')
        .eq('organization_id', organizationId)
        .order('status', { ascending: true })
        .order('start_date', { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const current = rows.find((r) => r.status === 'active') ?? rows[0];
      return current ? toLeaseSummary(current) : null;
    },
  });
}
