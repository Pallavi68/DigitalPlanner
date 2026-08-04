import { BackendError } from './errors';

export interface SupabaseBrowserConfig {
  url: string;
  publishableKey: string;
}

function readEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getSupabaseConfig(): SupabaseBrowserConfig | null {
  const url = readEnv('VITE_SUPABASE_URL');
  const publishableKey = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || readEnv('VITE_SUPABASE_ANON_KEY');
  if (!url && !publishableKey) return null;
  if (!url || !publishableKey) {
    throw new BackendError(
      'not_configured',
      'Supabase is only partially configured. Set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return { url, publishableKey };
}

export function requireSupabaseConfig(): SupabaseBrowserConfig {
  const config = getSupabaseConfig();
  if (!config) {
    throw new BackendError(
      'not_configured',
      'Cloud sync is not configured. Add the public Supabase URL and publishable key to the frontend environment.',
    );
  }
  return config;
}
