import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Get environment variables from runtime config or build-time env
const getEnvVar = (key: string): string | undefined => {
  // First try runtime config (window.ENV)
  if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV[key]) {
    const value = (window as any).ENV[key];
    // Check if it's not a placeholder
    if (value && !value.startsWith('__') && !value.endsWith('__')) {
      return value;
    }
  }
  // Fallback to build-time env
  return import.meta.env[key];
};

// Export a function to create new client instances
export const createClient = () => {
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing',
      windowENV: typeof window !== 'undefined' ? (window as any).ENV : 'Not available',
      importMetaEnv: import.meta.env
    });
    throw new Error('Supabase URL and anon key are required. Please check your environment variables.');
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// Lazy initialization function for backward compatibility
let _supabase: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// For immediate backward compatibility (might fail at build time, but that's expected)
export const supabase = (() => {
  try {
    return createClient();
  } catch {
    // Return a placeholder that will throw at runtime if used
    return null as any;
  }
})();
