// Centralized environment variable access
// Supports both runtime (window.ENV) and build-time (import.meta.env) variables

export function getEnv(key: string): string | undefined {
  // First try runtime config (window.ENV)
  if (typeof window !== 'undefined' && (window as any).ENV) {
    const value = (window as any).ENV[key];
    if (value && !value.startsWith('__') && !value.endsWith('__')) {
      return value;
    }
  }
  
  // Then try Vite env
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Handle legacy Next.js env vars by mapping them
  const mapping: Record<string, string> = {
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY': 'VITE_VAPID_PUBLIC_KEY',
    'NEXT_PUBLIC_APP_URL': 'VITE_APP_URL',
    'NEXT_PUBLIC_WS_URL': 'VITE_WS_URL',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'VITE_STRIPE_PUBLISHABLE_KEY',
    'REACT_APP_SUPABASE_URL': 'VITE_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY': 'VITE_SUPABASE_ANON_KEY'
  };
  
  if (mapping[key]) {
    return getEnv(mapping[key]);
  }
  
  return undefined;
}

// Development check
export const isDevelopment = () => {
  return import.meta.env.MODE === 'development' || 
         (typeof window !== 'undefined' && window.location.hostname === 'localhost');
}

// Common environment variables
export const env = {
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL') || '',
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY') || '',
  API_URL: getEnv('VITE_API_URL') || '',
  APP_URL: getEnv('VITE_APP_URL') || 'http://localhost:3000',
  WS_URL: getEnv('VITE_WS_URL') || '',
  VAPID_PUBLIC_KEY: getEnv('VITE_VAPID_PUBLIC_KEY') || 'BDY9PUZxO1S3O9bJ7-nekjUIFcmQj2ViMYy6Gk30Kytfr4p3l5ii4g55YNqvyqqvvDS938raycn57HzhVinmcJc',
  STRIPE_PUBLISHABLE_KEY: getEnv('VITE_STRIPE_PUBLISHABLE_KEY') || '',
  OPENBB_API_KEY: getEnv('VITE_OPENBB_API_KEY') || ''
};