import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

// Export a function to create new client instances
export const createClient = () => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Environment variables:', {
      supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
      supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Missing',
      windowENV: typeof window !== 'undefined' ? (window as any).ENV : 'Not available',
      importMetaEnv: import.meta.env,
      env: env
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

// Lazy getter that creates client on first access
let _directSupabase: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    if (!_directSupabase) {
      _directSupabase = createClient();
    }
    return Reflect.get(_directSupabase, prop, receiver);
  },
  set(target, prop, value, receiver) {
    if (!_directSupabase) {
      _directSupabase = createClient();
    }
    return Reflect.set(_directSupabase, prop, value, receiver);
  }
});
