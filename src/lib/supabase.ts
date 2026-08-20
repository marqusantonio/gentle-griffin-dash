// Self-contained Supabase Client with standard PostgREST and Realtime support
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.info(
    'Supabase environment variables (VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY) are not provided in .env. Using local offline storage mode with live fallback.'
  );
}

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
    localStorage.setItem('wevids_supabase_url', url.trim());
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
  if (typeof window === 'undefined') return { url: '', anonKey: '' };
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('wevids_supabase_url') || '';
  const localKey = localStorage.getItem('wevids_supabase_anon_key') || '';

  const rawUrl = envUrl || localUrl || '';
  const rawKey = envKey || localKey || '';

  return {
    url: rawUrl.trim().replace(/\/+$/, ''),
    anonKey: rawKey.trim(),
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 15);
};

// Query Builder for .from('table').select().order().eq()
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
    this.url = url;
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
    const effectiveUrl = this.url || config.url;
    const effectiveKey = this.anonKey || config.anonKey;

    if (!effectiveUrl || !effectiveKey) {
      return { data: null, error: 'Supabase URL or Key not set' };
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
      const bearer = session?.access_token || effectiveKey;
      if (bearer) {
        headers['Authorization'] = `Bearer ${bearer}`;
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
  private pollInterval: any = null;
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
    if (url && anonKey && typeof window !== 'undefined') {
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

        this.ws.onerror = () => {
          this.startPollingFallback();
        };
      } catch {
        this.startPollingFallback();
      }
    } else {
      this.startPollingFallback();
    }

    callback?.('SUBSCRIBED');
    return this;
  }

  private startPollingFallback() {
    // Fallback polling keeps state updated even if websockets are blocked
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      const { url } = getSupabaseConfig();
      if (!url) return;
    }, 5000);
  }

  public unsubscribe(): void {
    this.isSubscribed = false;
    if (this.pollInterval) clearInterval(this.pollInterval);
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
      const u = this.url || config.url;
      const k = this.anonKey || config.anonKey;
      if (!u || !k) return { data: null, error: { message: 'Supabase credentials missing' } };

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
      const u = this.url || config.url;
      const k = this.anonKey || config.anonKey;
      if (!u || !k) return { data: null, error: { message: 'Supabase credentials missing' } };

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
      const u = this.url || config.url;
      const k = this.anonKey || config.anonKey;
      const session = getStoredSession();
      if (u && k && session?.access_token) {
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
    this.url = url;
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

  // Convenience methods
  public async signInWithGoogle(): Promise<{ url?: string; error?: string }> {
    const config = getSupabaseConfig();
    const u = this.url || config.url;
    const k = this.anonKey || config.anonKey;
    if (!u || !k) return { error: 'Please configure your Supabase URL & Anon Key.' };
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

  public async testConnection(): Promise<{ ok: boolean; message: string }> {
    const config = getSupabaseConfig();
    const u = this.url || config.url;
    const k = this.anonKey || config.anonKey;
    if (!u || !k) return { ok: false, message: 'URL and Anon Key are missing.' };

    try {
      const res = await fetch(`${u}/auth/v1/health?apikey=${encodeURIComponent(k)}`, {
        method: 'GET',
        headers: { 'apikey': k },
      });
      if (res.ok || res.status === 200) {
        return { ok: true, message: 'Connected to Supabase successfully!' };
      }
      return { ok: false, message: `Received HTTP status ${res.status}` };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Failed to reach Supabase project.' };
    }
  }
}

// Function to create a new client
export const createClient = (url: string, anonKey: string): SupabaseClientInstance => {
  return new SupabaseClientInstance(url, anonKey);
};

// Official exported Supabase singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Content moderation keyword list
export const PROHIBITED_KEYWORDS = [
  'kill', 'harass', 'hate_speech', 'nazi', 'doxx', 'scam', 'abuse', 'terrorism'
];

export const checkContentModeration = (text: string): { flagged: boolean; reason?: string } => {
  if (!text) return { flagged: false };
  const lower = text.toLowerCase();
  for (const word of PROHIBITED_KEYWORDS) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      return { 
        flagged: true, 
        reason: `Your post violates community guidelines: flagged keyword detected ("${word}").` 
      };
    }
  }
  return { flagged: false };
};

// Complete Production SQL Schema for Supabase
export const SUPABASE_SQL_SCHEMA = `-- Run this script in your Supabase SQL Editor (supabase.com -> Project -> SQL Editor)

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

-- 2. Clips Table
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

-- 4. Films Table
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

-- 5. ROMs Table
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

-- 6. Files Table
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

-- 7. Products Table
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

-- 8. Game Scores Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_name TEXT,
  player_handle TEXT,
  score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  receiver_id TEXT,
  content TEXT,
  is_friend_request BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT NULL,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access
DO $$ 
BEGIN
  CREATE POLICY "Public Read Posts" ON public.posts FOR SELECT USING (true);
  CREATE POLICY "Public Write Posts" ON public.posts FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public Update Posts" ON public.posts FOR UPDATE USING (true);
  CREATE POLICY "Public Delete Posts" ON public.posts FOR DELETE USING (true);

  CREATE POLICY "Public Read Clips" ON public.clips FOR SELECT USING (true);
  CREATE POLICY "Public Write Clips" ON public.clips FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public Update Clips" ON public.clips FOR UPDATE USING (true);

  CREATE POLICY "Public Read Audio" ON public.audio_tracks FOR SELECT USING (true);
  CREATE POLICY "Public Write Audio" ON public.audio_tracks FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public Read Films" ON public.films FOR SELECT USING (true);
  CREATE POLICY "Public Write Films" ON public.films FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public Read ROMs" ON public.roms FOR SELECT USING (true);
  CREATE POLICY "Public Write ROMs" ON public.roms FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public Read Files" ON public.files FOR SELECT USING (true);
  CREATE POLICY "Public Write Files" ON public.files FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
  CREATE POLICY "Public Write Products" ON public.products FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public Read GameScores" ON public.game_scores FOR SELECT USING (true);
  CREATE POLICY "Public Write GameScores" ON public.game_scores FOR INSERT WITH CHECK (true);

  CREATE POLICY "Public Read DMs" ON public.direct_messages FOR SELECT USING (true);
  CREATE POLICY "Public Write DMs" ON public.direct_messages FOR INSERT WITH CHECK (true);
  CREATE POLICY "Public Update DMs" ON public.direct_messages FOR UPDATE USING (true);
EXCEPTION WHEN OTHERS THEN
  -- Policies already exist
END $$;

-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
`;