import { supabase } from '../integrations/supabase/client';

export { supabase };

export const sanitizeBaseUrl = (url: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
};

export const isSupabaseConfigured = (): boolean => {
  return true;
};

export const getSupabaseConfig = () => ({
  url: "https://dmoxkwtifnwymcalzbie.supabase.co",
  anonKey: "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8"
});

export const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('wevids_supabase_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveStoredSession = (session: any) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem('wevids_supabase_session');
  } else {
    localStorage.setItem('wevids_supabase_session', JSON.stringify(session));
  }
};

export const saveSupabaseCredentials = (_url: string, _anonKey: string) => {};
export const clearSupabaseCredentials = () => {};

export const checkContentModeration = (text: string): { flagged: boolean; reason?: string } => {
  if (!text) return { flagged: false };
  const prohibited = ['kill', 'harass', 'hate_speech', 'nazi', 'doxx', 'scam', 'abuse', 'terrorism'];
  const lower = text.toLowerCase();
  for (const word of prohibited) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      return { 
        flagged: true, 
        reason: `Your post violates community guidelines: flagged keyword detected ("${word}").` 
      };
    }
  }
  return { flagged: false };
};

export const testSupabaseConnection = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.from('posts').select('id').limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Supabase Database connected and responding!' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection failed' };
  }
};

export const SUPABASE_SQL_SCHEMA = `-- WEVIDS OS Complete Database Schema
-- All tables are verified and active on Supabase:
-- 1. profiles
-- 2. posts
-- 3. clips
-- 4. direct_messages
-- 5. follows
-- 6. profile_likes
-- 7. audio_tracks
-- 8. films
-- 9. roms
-- 10. files
-- 11. products
-- 12. game_scores
`;