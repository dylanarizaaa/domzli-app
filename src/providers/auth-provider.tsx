import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { isSupabaseConfigured } from '@/lib/env';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { useContextStore } from '@/stores/context-store';
import type { MembershipRole } from '@/types/database';

export type AppContext = { organizationId: string; organizationName: string; role: MembershipRole };

type AuthValue = {
  session: Session | null;
  /** true hasta conocer la sesión y, si la hay, sus contextos. */
  isLoading: boolean;
  contexts: AppContext[];
  activeContext: AppContext | null;
  setActiveContext: (organizationId: string) => void;
  refreshContexts: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthValue | null>(null);

export const contextKeys = { mine: (userId: string) => ['contexts', userId] as const };

async function fetchContexts(): Promise<AppContext[]> {
  const { data, error } = await supabase.rpc('my_contexts');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    role: row.role,
  }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = React.useState(!isSupabaseConfigured);
  const activeOrganizationId = useContextStore((s) => s.activeOrganizationId);
  const setActiveOrganizationId = useContextStore((s) => s.setActiveOrganizationId);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionLoaded(true);
    });
    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  const contextsQuery = useQuery({
    queryKey: contextKeys.mine(userId ?? 'anon'),
    queryFn: fetchContexts,
    enabled: Boolean(userId),
  });

  const contexts = React.useMemo(() => contextsQuery.data ?? [], [contextsQuery.data]);
  const activeContext = React.useMemo(
    () => contexts.find((c) => c.organizationId === activeOrganizationId) ?? contexts[0] ?? null,
    [contexts, activeOrganizationId],
  );

  const value = React.useMemo<AuthValue>(
    () => ({
      session,
      isLoading: !sessionLoaded || (Boolean(userId) && contextsQuery.isPending),
      contexts,
      activeContext,
      setActiveContext: setActiveOrganizationId,
      refreshContexts: async () => {
        await contextsQuery.refetch();
      },
      signOut: async () => {
        await supabase.auth.signOut({ scope: 'local' });
        // La caché contiene datos personales: se borra al cerrar sesión.
        queryClient.clear();
        setActiveOrganizationId(null);
      },
    }),
    [session, sessionLoaded, userId, contextsQuery, contexts, activeContext, setActiveOrganizationId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = React.useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}

/** Organización activa del staff; lanza si la pantalla se usa sin contexto. */
export function useActiveOrganization(): AppContext {
  const { activeContext } = useAuth();
  if (!activeContext) throw new Error('No hay una organización activa');
  return activeContext;
}
