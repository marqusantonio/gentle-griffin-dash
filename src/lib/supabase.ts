// Self-contained Supabase Client with standard PostgREST and Realtime support
const rawSupabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dmoxkwtifnwymcalzbie.supabase.co';
const rawSupabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Clean base URL ensuring no trailing slashes or /rest/v1 paths in base URL
export const sanitizeBaseUrl = (url: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
};

const supabaseUrl = sanitizeBaseUrl(rawSupabaseUrl);
const supabaseAnonKey = typeof rawSupabaseAnonKey === 'string' ? rawSupabaseAnonKey.trim() : '';

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

export const isValidJwt = (token?: string | null): boolean => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.trim().split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
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

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wevids_supabase_url', sanitizeBaseUrl(url));
    localStorage.setItem('wevids_supabase_anon_key', anonKey.trim());
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wevids_supabase_url');
    localStorage.removeItem('wevids_supabase_anon_key');
    localStorage.removeItem('wevids_supabase_session');
  }
};

export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window === 'undefined') return { url: supabaseUrl, anonKey: supabaseAnonKey };
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('wevids_supabase_url') || '';
  const localKey = localStorage.getItem('wevids_supabase_anon_key') || '';

  const rawUrl = envUrl || localUrl || supabaseUrl || '';
  const rawKey = envKey || localKey || supabaseAnonKey || '';

  return {
    url: sanitizeBaseUrl(rawUrl),
    anonKey: typeof rawKey === 'string' ? rawKey.trim() : '',
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
};

// Query Builder for .from('table').select().order().eq().or()
class PostgrestQueryBuilder<T = any> implements PromiseLike<{ data: T[] | null; error: any }> {
  private table: string;
  private url: string;
  private anonKey: string;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  private selectCols: string = '*';
  private filters: string[] = [];
  private orderClause: string = '';
  private limitClause: string = '';
  private bodyPayload: any = null;
  private isUpsert: boolean = false;

  constructor(table: string, url: string, anonKey: string) {
    this.table = table;
    this.url = sanitizeBaseUrl(url);
    this.anonKey = anonKey;
  }

  select(columns: string = '*') {
    this.method = 'GET';
    this.selectCols = columns;
    return this;
  }

  insert(values: any) {
    this.method = 'POST';
    this.bodyPayload = values;
    return this;
  }

  upsert(values: any) {
    this.method = 'POST';
    this.isUpsert = true;
    this.bodyPayload = values;
    return this;
  }

  update(values: any) {
    this.method = 'PATCH';
    this.bodyPayload = values;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  or(conditions: string) {
    this.filters.push(`or=(${conditions})`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'desc' : 'asc';
    this.orderClause = `order=${encodeURIComponent(column)}.${direction}`;
    return this;
  }

  limit(count: number) {
    this.limitClause = `limit=${count}`;
    return this;
  }

  async execute(): Promise<{ data: T[] | null; error: any }> {
    const config = getSupabaseConfig();
    const effectiveUrl = sanitizeBaseUrl(this.url || config.url);
    const effectiveKey = this.anonKey || config.anonKey;

    if (!effectiveUrl) {
      return { data: null, error: 'Supabase URL is required' };
    }

    try {
      const queryParams: string[] = [];
      if (this.method === 'GET' && this.selectCols) {
        queryParams.push(`select=${encodeURIComponent(this.selectCols)}`);
      }
      if (this.orderClause) queryParams.push(this.orderClause);
      if (this.limitClause) queryParams.push(this.limitClause);
      if (this.filters.length > 0) queryParams.push(...this.filters);

      const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const endpoint = `${effectiveUrl}/rest/v1/${this.table}${qs}`;

      const headers: Record<string, string> = {
        'apikey': effectiveKey,
        'Content-Type': 'application/json',
      };

      const session = getStoredSession();
      if (session?.access_token && isValidJwt(session.access_token)) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (isValidJwt(effectiveKey)) {
        headers['Authorization'] = `Bearer ${effectiveKey}`;
      }

      if (this.isUpsert) {
        headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
      } else if (this.method !== 'GET') {
        headers['Prefer'] = 'return=representation';
      }

      const res = await fetch(endpoint, {
        method: this.method,
        headers,
        body: this.bodyPayload ? JSON.stringify(this.bodyPayload) : undefined,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        if (errJson.message && errJson.message.includes('schema cache')) {
          return { data: null, error: { message: errJson.message, hint: 'Run the SQL schema script to add missing columns.' } };
        }
        return { data: null, error: errJson.message || errJson.error_description || 'Query error' };
      }

      if (res.status === 204) {
        return { data: [] as any, error: null };
      }

      const data = await res.json().catch(() => null);
      return { data: Array.isArray(data) ? data : data ? [data] : [], error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Network error' };
    }
  }

  then<TResult1 = { data: T[] | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export class RealtimeChannel {
  private topic: string;
  private listeners: Array<{ options: any; callback: (payload: any) => void }> = [];
  private ws: WebSocket | null = null;
  private isSubscribed = false;

  constructor(topic: string) {
    this.topic = topic;
  }

  public on(
    type: 'postgres_changes' | string,
    options: any,
    callback: (payload: { new: any; old: any; eventType: string }) => void
  ): this {
    this.listeners.push({ options, callback });
    return this;
  }

  public subscribe(callback?: (status: string) => void): this {
    if (this.isSubscribed) return this;
    this.isSubscribed = true;

    const { url, anonKey } = getSupabaseConfig();
    if (url && typeof window !== 'undefined') {
      try {
        const wsUrl = url.replace(/^http/, 'ws') + `/realtime/v1/websocket?apikey=${encodeURIComponent(anonKey)}&vsn=1.0.0`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          callback?.('SUBSCRIBED');
          this.ws?.send(
            JSON.stringify({
              topic: `realtime:${this.topic}`,
              event: 'phx_join',
              payload: {},
              ref: '1',
            })
          );
        };

        this.ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'postgres_changes' || data.event === 'INSERT' || data.event === 'DELETE' || data.event === 'UPDATE') {
              this.listeners.forEach((l) => l.callback(data.payload || data));
            }
          } catch {
            // safe fallback
          }
        };
      } catch {
        // safe fallback
      }
    }

    callback?.('SUBSCRIBED');
    return this;
  }

  public unsubscribe(): void {
    this.isSubscribed = false;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // safe ignore
      }
      this.ws = null;
    }
  }
}

export class SupabaseClientInstance {
  private url: string;
  private anonKey: string;
  private channels = new Map<string, RealtimeChannel>();

  public auth = {
    signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
      const config = getSupabaseConfig();
      const u = sanitizeBaseUrl(this.url || config.url);
      const k = this.anonKey || config.anonKey;
      if (!u) return { data: null, error: { message: 'Supabase URL missing' } };

      try {
        const res = await fetch(`${u}/auth/v1/signup?apikey=${encodeURIComponent(k)}`, {
          method: 'POST',
          headers: { 'apikey': k, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, data: options?.data }),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        if (data.access_token) saveStoredSession(data as SupabaseSession);
        return { data: { user: data.user || data, session: data.access_token ? data : null }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const config = getSupabaseConfig();
      const u = sanitizeBaseUrl(this.url || config.url);
      const k = this.anonKey || config.anonKey;
      if (!u) return { data: null, error: { message: 'Supabase URL missing' } };

      try {
        const res = await fetch(`${u}/auth/v1/token?grant_type=password&apikey=${encodeURIComponent(k)}`, {
          method: 'POST',
          headers: { 'apikey': k, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        saveStoredSession(data as SupabaseSession);
        return { data: { user: data.user, session: data }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    signOut: async () => {
      const config = getSupabaseConfig();
      const u = sanitizeBaseUrl(this.url || config.url);
      const k = this.anonKey || config.anonKey;
      const session = getStoredSession();
      if (u && session?.access_token && isValidJwt(session.access_token)) {
        try {
          await fetch(`${u}/auth/v1/logout?apikey=${encodeURIComponent(k)}`, {
            method: 'POST',
            headers: { 'apikey': k, 'Authorization': `Bearer ${session.access_token}` },
          });
        } catch {
          // safe ignore
        }
      }
      saveStoredSession(null);
      return { error: null };
    },
    getSession: async () => {
      return { data: { session: getStoredSession() }, error: null };
    }
  };

  constructor(url: string, anonKey: string) {
    this.url = sanitizeBaseUrl(url);
    this.anonKey = anonKey;
  }

  public from(table: string) {
    return new PostgrestQueryBuilder(table, this.url, this.anonKey);
  }

  public channel(topic: string): RealtimeChannel {
    let chan = this.channels.get(topic);
    if (!chan) {
      chan = new RealtimeChannel(topic);
      this.channels.set(topic, chan);
    }
    return chan;
  }

  public removeChannel(channel: RealtimeChannel): void {
    channel?.unsubscribe();
  }

  public async signInWithGoogle(): Promise<{ url?: string; error?: string }> {
    const config = getSupabaseConfig();
    const u = sanitizeBaseUrl(this.url || config.url);
    const k = this.anonKey || config.anonKey;
    if (!u) return { error: 'Please configure your Supabase URL.' };
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const oauthUrl = `${u}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(currentOrigin)}&apikey=${encodeURIComponent(k)}`;
    if (typeof window !== 'undefined') {
      window.location.href = oauthUrl;
    }
    return { url: oauthUrl };
  }

  public async signUp(email: string, password: string, name?: string) {
    const res = await this.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (res.error) return { error: res.error.message || 'Signup failed' };
    return { user: res.data?.user, session: res.data?.session };
  }

  public async signIn(email: string, password: string) {
    const res = await this.auth.signInWithPassword({ email, password });
    if (res.error) return { error: res.error.message || 'Sign in failed' };
    return { user: res.data?.user, session: res.data?.session };
  }

  public async signOut() {
    await this.auth.signOut();
  }

  public async testConnection(): Promise<{ ok: boolean; message: string; hint?: string }> {
    const config = getSupabaseConfig();
    const u = sanitizeBaseUrl(this.url || config.url);
    const k = this.anonKey || config.anonKey;
    if (!u) return { ok: false, message: 'URL is missing or unset.' };

    try {
      const res = await fetch(`${u}/rest/v1/posts?select=id&limit=1`, {
        method: 'GET',
        headers: { 'apikey': k },
      });
      if (res.ok || res.status === 200 || res.status === 204) {
        return { ok: true, message: 'Connected to Supabase database successfully!' };
      }
      return { ok: false, message: `Received HTTP status ${res.status}` };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Failed to reach Supabase project.' };
    }
  }
}

export const createClient = (url: string, anonKey: string): SupabaseClientInstance => {
  return new SupabaseClientInstance(sanitizeBaseUrl(url), anonKey);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export const SUPABASE_SQL_SCHEMA = `-- Run this in your Supabase SQL Editor (supabase.com -> Project -> SQL Editor)
-- This script will create all tables, backfill any missing columns, configure RLS, and enable Realtime safely.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  avatar TEXT,
  "avatarImage" TEXT,
  color TEXT,
  location TEXT,
  bio TEXT,
  pronouns TEXT,
  "bioAudioUrl" TEXT,
  "bioAudioTitle" TEXT,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  "followingIds" JSONB DEFAULT '[]'::jsonb,
  "followerIds" JSONB DEFAULT '[]'::jsonb,
  likes INT DEFAULT 0,
  views TEXT DEFAULT '0',
  joined TEXT,
  verified BOOLEAN DEFAULT false,
  "walletBalance" NUMERIC DEFAULT 50,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "avatarImage" TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "bioAudioUrl" TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "bioAudioTitle" TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "followingIds" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "followerIds" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "walletBalance" NUMERIC DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Posts Table
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
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "authorName" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "authorHandle" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "authorAvatar" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "authorColor" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS dislikes INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Clips Table
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
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS "audioTrack" TEXT;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS dislikes INT DEFAULT 0;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS shares INT DEFAULT 0;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clips ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 4. Audio Tracks Table
CREATE TABLE IF NOT EXISTS public.audio_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  duration TEXT,
  genre TEXT,
  bpm INT DEFAULT 120,
  url TEXT,
  cover TEXT,
  "uploaderId" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audio_tracks ADD COLUMN IF NOT EXISTS "uploaderId" TEXT;
ALTER TABLE public.audio_tracks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. Films Table
CREATE TABLE IF NOT EXISTS public.films (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
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
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS "releaseYear" INT DEFAULT 2026;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS "posterUrl" TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS "backdropUrl" TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS "uploaderId" TEXT;
ALTER TABLE public.films ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 6. ROMs Table
CREATE TABLE IF NOT EXISTS public.roms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
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
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "romType" TEXT;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "maintainerHandle" TEXT;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "androidVersion" TEXT DEFAULT 'Android 15';
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "fileSize" TEXT;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "downloadCount" INT DEFAULT 0;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "downloadUrl" TEXT;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS "githubUrl" TEXT;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS changelog JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.roms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 7. Files Table
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
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
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS "fileSize" TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS "uploaderId" TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS "uploaderName" TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS "downloadUrl" TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS downloads INT DEFAULT 0;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS "uploadedAt" TEXT;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 8. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  "creatorId" TEXT,
  "creatorName" TEXT,
  rating NUMERIC DEFAULT 5.0,
  "salesCount" INT DEFAULT 0,
  "previewUrl" TEXT,
  description TEXT,
  "affiliateCommission" NUMERIC DEFAULT 10,
  "isDigital" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "creatorId" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "creatorName" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "salesCount" INT DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "previewUrl" TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "affiliateCommission" NUMERIC DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "isDigital" BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 9. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT,
  "mediaUrl" TEXT,
  type TEXT DEFAULT 'text',
  is_friend_request BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT NULL,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_friend_request BOOLEAN DEFAULT false;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT NULL;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 10. Game Scores Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_name TEXT,
  player_handle TEXT,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.game_scores ADD COLUMN IF NOT EXISTS game_id TEXT;
ALTER TABLE public.game_scores ADD COLUMN IF NOT EXISTS player_name TEXT;
ALTER TABLE public.game_scores ADD COLUMN IF NOT EXISTS player_handle TEXT;
ALTER TABLE public.game_scores ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0;
ALTER TABLE public.game_scores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Enable RLS & Apply Full Public Access Policy for Guests and Authenticated Users
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access" ON public.posts;
CREATE POLICY "Public full access" ON public.posts FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access clips" ON public.clips;
CREATE POLICY "Public full access clips" ON public.clips FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access profiles" ON public.profiles;
CREATE POLICY "Public full access profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access audio" ON public.audio_tracks;
CREATE POLICY "Public full access audio" ON public.audio_tracks FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access films" ON public.films;
CREATE POLICY "Public full access films" ON public.films FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.roms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access roms" ON public.roms;
CREATE POLICY "Public full access roms" ON public.roms FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access files" ON public.files;
CREATE POLICY "Public full access files" ON public.files FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access products" ON public.products;
CREATE POLICY "Public full access products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access dms" ON public.direct_messages;
CREATE POLICY "Public full access dms" ON public.direct_messages FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access game_scores" ON public.game_scores;
CREATE POLICY "Public full access game_scores" ON public.game_scores FOR ALL TO public USING (true) WITH CHECK (true);

-- Ensure anon & authenticated roles have full permissions across tables
GRANT ALL ON public.posts TO anon, authenticated;
GRANT ALL ON public.clips TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.audio_tracks TO anon, authenticated;
GRANT ALL ON public.films TO anon, authenticated;
GRANT ALL ON public.roms TO anon, authenticated;
GRANT ALL ON public.files TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.direct_messages TO anon, authenticated;
GRANT ALL ON public.game_scores TO anon, authenticated;

-- Enable Realtime publication safely (idempotent block that ignores duplicate object errors)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_scores;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
`;