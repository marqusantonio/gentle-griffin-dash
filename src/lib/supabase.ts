import { createClient, SupabaseClient as OfficialSupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    [key: string]: any;
  };
  created_at?: string;
}

export interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: SupabaseUser;
}

// Clean helper to sanitize any user-entered Supabase project URL
export const sanitizeSupabaseUrl = (inputUrl: string): string => {
  if (!inputUrl) return '';
  let cleaned = inputUrl.trim();
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/rest\/v1.*$/, '');
  cleaned = cleaned.replace(/\/auth\/v1.*$/, '');
  return cleaned;
};

// Storage helpers
export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window === 'undefined') return { url: '', anonKey: '' };
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('wevids_supabase_url') || '';
  const localKey = localStorage.getItem('wevids_supabase_anon_key') || '';
  
  const rawUrl = envUrl || localUrl || 'https://placeholder-project.supabase.co';
  const rawKey = envKey || localKey || 'placeholder-anon-key-123456789012345';
  
  return {
    url: sanitizeSupabaseUrl(rawUrl),
    anonKey: rawKey.trim(),
  };
};

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    const cleanUrl = sanitizeSupabaseUrl(url);
    localStorage.setItem('wevids_supabase_url', cleanUrl);
    localStorage.setItem('wevids_supabase_anon_key', anonKey.trim());
    // Recreate client
    initSupabaseClient();
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wevids_supabase_url');
    localStorage.removeItem('wevids_supabase_anon_key');
    localStorage.removeItem('wevids_supabase_session');
    initSupabaseClient();
  }
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20 && !url.includes('placeholder-project'));
};

export const getStoredSession = (): SupabaseSession | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('wevids_supabase_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveStoredSession = (session: SupabaseSession | null) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem('wevids_supabase_session');
  } else {
    localStorage.setItem('wevids_supabase_session', JSON.stringify(session));
  }
};

// SQL Schema for 1-click execution in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- Run this in your Supabase SQL Editor (supabase.com -> Project -> SQL Editor)

-- 1. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  "authorName" TEXT,
  "authorHandle" TEXT,
  "authorAvatar" TEXT,
  "authorColor" TEXT,
  location TEXT,
  time TEXT,
  content TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  shares INT DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Clips Table (Shorts)
CREATE TABLE IF NOT EXISTS public.clips (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  title TEXT,
  description TEXT,
  "videoUrl" TEXT,
  "audioTrack" TEXT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Audio Tracks Table
CREATE TABLE IF NOT EXISTS public.audio_tracks (
  id TEXT PRIMARY KEY,
  title TEXT,
  artist TEXT,
  duration TEXT,
  genre TEXT,
  bpm INT DEFAULT 120,
  url TEXT,
  cover TEXT,
  "uploaderId" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Films Table
CREATE TABLE IF NOT EXISTS public.films (
  id TEXT PRIMARY KEY,
  title TEXT,
  synopsis TEXT,
  director TEXT,
  "releaseYear" INT DEFAULT 2026,
  duration TEXT,
  genre TEXT,
  rating NUMERIC DEFAULT 5.0,
  "videoUrl" TEXT,
  "posterUrl" TEXT,
  "backdropUrl" TEXT,
  "uploaderId" TEXT,
  views TEXT DEFAULT '0',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ROMs Table
CREATE TABLE IF NOT EXISTS public.roms (
  id TEXT PRIMARY KEY,
  title TEXT,
  device TEXT,
  brand TEXT,
  "romType" TEXT,
  status TEXT DEFAULT 'Official',
  maintainer TEXT,
  "maintainerHandle" TEXT,
  version TEXT,
  "androidVersion" TEXT DEFAULT 'Android 15',
  "fileSize" TEXT,
  checksum TEXT,
  "downloadCount" INT DEFAULT 0,
  "downloadUrl" TEXT,
  "githubUrl" TEXT,
  "releaseDate" TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Shared Files Table
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  title TEXT,
  "fileName" TEXT,
  "fileSize" TEXT,
  category TEXT,
  "uploaderId" TEXT,
  "uploaderName" TEXT,
  "downloadUrl" TEXT,
  checksum TEXT,
  downloads INT DEFAULT 0,
  "uploadedAt" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Products Table (Mall)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT,
  category TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  "creatorId" TEXT,
  "creatorName" TEXT,
  rating NUMERIC DEFAULT 5.0,
  "salesCount" INT DEFAULT 0,
  "previewUrl" TEXT,
  description TEXT,
  "affiliateCommission" INT DEFAULT 10,
  "isDigital" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime replication on the tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audio_tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.films;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Disable Row Level Security for instant unrestricted guest & member sharing
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.films DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
`;

let clientInstance: OfficialSupabaseClient | null = null;

export const initSupabaseClient = (): OfficialSupabaseClient => {
  const { url, anonKey } = getSupabaseConfig();
  clientInstance = createClient(url || 'https://placeholder-project.supabase.co', anonKey || 'placeholder-anon-key-123456789012345', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      }
    }
  });
  return clientInstance;
};

export const getClient = (): OfficialSupabaseClient => {
  if (!clientInstance) {
    clientInstance = initSupabaseClient();
  }
  return clientInstance;
};

// Wrapper supporting both direct channel subscription & helper methods
class SupabaseWrapper {
  public get client(): OfficialSupabaseClient {
    return getClient();
  }

  public channel(name: string) {
    return this.client.channel(name);
  }

  public removeChannel(channel: any) {
    return this.client.removeChannel(channel);
  }

  public async signInWithGoogle(): Promise<{ url?: string; error?: string }> {
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      }
    });
    if (error) return { error: error.message };
    return { url: data.url };
  }

  public parseOAuthCallback(): { session?: SupabaseSession; error?: string } | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    const search = window.location.search;
    
    if (!hash && !search) return null;

    const hashParams = new URLSearchParams(hash ? hash.replace(/^#/, '') : '');
    const searchParams = new URLSearchParams(search ? search.replace(/^\?/, '') : '');

    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description') || searchParams.get('error');
    if (errorDescription) {
      window.history.replaceState(null, '', window.location.pathname);
      return { error: decodeURIComponent(errorDescription.replace(/\+/g, ' ')) };
    }

    const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token') || '';
    const expiresIn = Number(hashParams.get('expires_in') || searchParams.get('expires_in')) || 3600;
    const tokenType = hashParams.get('token_type') || searchParams.get('token_type') || 'bearer';

    if (accessToken) {
      const session: SupabaseSession = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
        token_type: tokenType,
        user: {
          id: 'oauth_user',
          email: 'google_user@wevids.app',
        }
      };
      saveStoredSession(session);
      window.history.replaceState(null, '', window.location.pathname);
      return { session };
    }

    return null;
  }

  public async getUser() {
    const { data, error } = await this.client.auth.getUser();
    if (error) return { error: error.message };
    return { user: data.user as any };
  }

  public async signUp(email: string, password: string, name?: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email.split('@')[0] }
      }
    });
    if (error) return { error: error.message };
    if (data.session) saveStoredSession(data.session as any);
    return { user: data.user as any, session: data.session as any };
  }

  public async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    if (data.session) saveStoredSession(data.session as any);
    return { user: data.user as any, session: data.session as any };
  }

  public async signOut(): Promise<void> {
    await this.client.auth.signOut().catch(() => {});
    saveStoredSession(null);
  }

  public async select(table: string, query: string = '*') {
    try {
      const { data, error } = await this.client
        .from(table)
        .select(query)
        .order('created_at', { ascending: false });
      if (error) return { error: error.message };
      return { data: data || [] };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  public async upsert(table: string, payload: Record<string, any>) {
    try {
      const { data, error } = await this.client
        .from(table)
        .upsert(payload)
        .select();
      if (error) return { error: error.message };
      return { data };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  public async insert(table: string, payload: Record<string, any>) {
    return this.upsert(table, payload);
  }

  public async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return { ok: false, message: 'Please enter a valid Supabase URL and Anon Key.' };
    }
    try {
      const { error } = await this.client.from('posts').select('id').limit(1);
      if (error && !error.message.includes('relation "public.posts" does not exist')) {
        return { ok: false, message: error.message };
      }
      return { ok: true, message: 'Connected to Supabase successfully!' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Connection failed.' };
    }
  }
}

export const supabase = new SupabaseWrapper();