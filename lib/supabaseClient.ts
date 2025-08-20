import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Export a function to create new client instances
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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
