/** Variables públicas de entorno. Las claves privilegiadas nunca llegan al cliente. */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  enableCatalog: __DEV__ || process.env.EXPO_PUBLIC_ENABLE_CATALOG === '1',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey);
