import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from '@/lib/env';
import { sessionStorageAdapter } from '@/lib/session-storage';
import type { Database } from '@/types/database';

// Sin configuración, el cliente apunta a una URL local para no fallar al importar;
// la app muestra la pantalla de configuración en ese caso (ver isSupabaseConfigured).
export const supabase = createClient<Database>(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseKey || 'sin-configurar',
  {
    auth: {
      storage: sessionStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  },
);

// En nativo, la renovación del token se pausa mientras la app está en segundo plano.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
