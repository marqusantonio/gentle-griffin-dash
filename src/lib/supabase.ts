import { createClient } from '@supabase/supabase-js';

// Read from environment variables if present, or from localStorage for quick testing
const getEnvOrLocal = (key: string, localKey: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem(localKey) || '';
  }
  return '';
};

export const SUPABASE_URL = getEnvOrLocal('VITE_SUPABASE_URL', 'wevids_supabase_url');
export const SUPABASE_ANON_KEY = getEnvOrLocal('VITE_SUPABASE_ANON_KEY', 'wevids_supabase_anon_key');

export const isSupabaseConfigured = (): boolean => {
  const url = getEnvOrLocal('VITE_SUPABASE_URL', 'wevids_supabase_url');
  const key = getEnvOrLocal('VITE_SUPABASE_ANON_KEY', 'wevids_supabase_anon_key');
  return Boolean(url && key && url.startsWith('https://') && key.length > 20);
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
      }
    });

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wevids_supabase_url', url.trim());
    localStorage.setItem('wevids_supabase_anon_key', anonKey.trim());
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wevids_supabase_url');
    localStorage.removeItem('wevids_supabase_anon<dyad-write path="src/lib/supabase.ts" description="Supabase client initialization and connection helper">
import { createClient } from '@supabase/supabase-js';

// Read from environment variables if present, or from localStorage for quick testing
const getEnvOrLocal = (key: string, localKey: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem(localKey) || '';
  }
  return '';
};

export const SUPABASE_URL = getEnvOrLocal('VITE_SUPABASE_URL', 'wevids_supabase_url');
export const SUPABASE_ANON_KEY = getEnvOrLocal('VITE_SUPABASE_ANON_KEY', 'wevids_supabase_anon_key');

export const isSupabaseConfigured = (): boolean => {
  const url = getEnvOrLocal('VITE_SUPABASE_URL', 'wevids_supabase_url');
  const key = getEnvOrLocal('VITE_SUPABASE_ANON_KEY', 'wevids_supabase_anon_key');
  return Boolean(url && key && url.startsWith('https://') && key.length > 20);
};

export const getSupabaseClient = () => {
  const url = getEnvOrLocal('VITE_SUPABASE_URL', 'wevids_supabase_url');
  const key = getEnvOrLocal('VITE_SUPABASE_ANON_KEY', 'wevids_supabase_anon_key');

  if (url && key && url.startsWith('https://') && key.length > 20) {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return null;
};

export const supabase = getSupabaseClient() || createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
  auth: {
    persistSession: false,
  }
});

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wevids_supabase_url', url.trim());
    localStorage.setItem('wevids_supabase_anon_key', anonKey.trim());
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wevids_supabase_url');
    localStorage.removeItem('wevids_supabase_anon_key');
  }
};