import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, requireSupabaseConfig } from './config';

let singleton: SupabaseClient | undefined;

export function isSupabaseConfigured(): boolean {
  try {
    return getSupabaseConfig() !== null;
  } catch {
    return false;
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (singleton) return singleton;
  const { url, publishableKey } = requireSupabaseConfig();
  singleton = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'digital-planner:supabase-auth',
    },
  });
  return singleton;
}
