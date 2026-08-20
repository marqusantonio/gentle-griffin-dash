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
  
  const rawUrl = envUrl || localUrl || '';
  const rawKey = envKey || localKey || '';
  
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
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wevids_supabase_url');
    localStorage.removeItem('wevids_supabase_anon_key');
    localStorage.removeItem('wevids_supabase_session');
  }
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 15);
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

// Complete Production SQL Schema with RLS, Posts, Clips, Audio, Films, ROMs, Files, Products, and Games
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

-- Enable Row Level Security (RLS) and grant permissive access
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access so both Guests and Accounts sync seamlessly
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

export interface RealtimeChannelOptions {
  event: string;
  schema: string;
  table: string;
}

export class RealtimeChannel {
  private topic: string;
  private listeners: Array<{ options: RealtimeChannelOptions; callback: (payload: any) => void }> = [];
  private ws: WebSocket | null = null;
  private pollInterval: any = null;
  private isSubscribed = false;
  private lastKnownTimestamp: string = new Date().toISOString();

  constructor(topic: string) {
    this.topic = topic;
  }

  public on(
    type: 'postgres_changes' | string,
    options: RealtimeChannelOptions,
    callback: (payload: { new: any; old: any; eventType: string }) => void
  ): this {
    this.listeners.push({ options, callback });
    return this;
  }

  public subscribe(statusCallback?: (status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR') => void): this {
    if (this.isSubscribed) return this;
    this.isSubscribed = true;

    const { url, anonKey } = getSupabaseConfig();
    
    if (url && anonKey && typeof window !== 'undefined') {
      try {
        const wsUrl = url.replace(/^http/, 'ws') + `/realtime/v1/websocket?apikey=${encodeURIComponent(anonKey)}&vsn=1.0.0`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          statusCallback?.('SUBSCRIBED');
          const joinMsg = {
            topic: `realtime:${this.topic}`,
            event: 'phx_join',
            payload: {},
            ref: '1'
          };
          this.ws?.send(JSON.stringify(joinMsg));
        };

        this.ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'postgres_changes' || data.event === 'INSERT' || data.event === 'DELETE' || data.event === 'UPDATE') {
              this.listeners.forEach((l) => {
                l.callback(data.payload || data);
              });
            }
          } catch {
            // Safe fallback
          }
        };

        this.ws.onerror = () => {
          this.startPollingFallback();
        };

        this.ws.onclose = () => {
          this.startPollingFallback();
        };
      } catch {
        this.startPollingFallback();
      }
    } else {
      this.startPollingFallback();
    }

    statusCallback?.('SUBSCRIBED');
    return this;
  }

  private startPollingFallback() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      const { url } = getSupabaseConfig();
      if (!url) return;

      for (const listener of this.listeners) {
        try {
          const res = await supabase.select(listener.options.table);
          if (res.data && res.data.length > 0) {
            const newItems = res.data.filter((item: any) => {
              if (!item.created_at) return false;
              return new Date(item.created_at) > new Date(this.lastKnownTimestamp);
            });

            if (newItems.length > 0) {
              this.lastKnownTimestamp = new Date().toISOString();
              newItems.forEach((newItem) => {
                listener.callback({ new: newItem, old: null, eventType: 'INSERT' });
              });
            }
          }
        } catch {
          // Safe ignore
        }
      }
    }, 4000);
  }

  public unsubscribe(): void {
    this.isSubscribed = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Safe ignore
      }
      this.ws = null;
    }
  }
}

export class NativeSupabaseClient {
  private activeChannels = new Map<string, RealtimeChannel>();

  public channel(topic: string): RealtimeChannel {
    let chan = this.activeChannels.get(topic);
    if (!chan) {
      chan = new RealtimeChannel(topic);
      this.activeChannels.set(topic, chan);
    }
    return chan;
  }

  public removeChannel(channel: RealtimeChannel): void {
    if (channel) {
      channel.unsubscribe();
    }
  }

  private getHeaders(token?: string, isUpsert = false) {
    const { anonKey } = getSupabaseConfig();
    const headers: Record<string, string> = {
      'apikey': anonKey,
      'Content-Type': 'application/json',
      'Prefer': isUpsert 
        ? 'return=representation,resolution=merge-duplicates' 
        : 'return=representation',
    };
    const session = getStoredSession();
    const bearer = token || session?.access_token || anonKey;
    if (bearer) {
      headers['Authorization'] = `Bearer ${bearer}`;
    }
    return headers;
  }

  public async signInWithGoogle(): Promise<{ url?: string; error?: string }> {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
      return { error: 'Please configure your Supabase URL & Public Anon Key first.' };
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const oauthUrl = `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(currentOrigin)}&apikey=${encodeURIComponent(anonKey)}`;
    
    if (typeof window !== 'undefined') {
      window.location.href = oauthUrl;
    }
    return { url: oauthUrl };
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

  public async getUser(token?: string): Promise<{ user?: SupabaseUser; error?: string }> {
    const { url, anonKey } = getSupabaseConfig();
    const session = getStoredSession();
    const activeToken = token || session?.access_token;
    if (!url || !activeToken) return { error: 'Not authenticated' };

    try {
      const res = await fetch(`${url}/auth/v1/user?apikey=${encodeURIComponent(anonKey)}`, {
        method: 'GET',
        headers: this.getHeaders(activeToken),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.msg || 'Failed to fetch user profile' };
      }
      if (session) {
        session.user = data;
        saveStoredSession(session);
      }
      return { user: data };
    } catch (err: any) {
      return { error: err.message || 'User fetch error' };
    }
  }

  public async signUp(email: string, password: string, name?: string): Promise<{ user?: SupabaseUser; session?: SupabaseSession; error?: string }> {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) return { error: 'Supabase URL & Anon Key are required.' };

    try {
      const res = await fetch(`${url}/auth/v1/signup?apikey=${encodeURIComponent(anonKey)}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ 
          email, 
          password,
          data: { full_name: name || email.split('@')[0] }
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.msg || data.error_description || data.message || 'Signup failed' };
      }
      if (data.access_token) {
        saveStoredSession(data as SupabaseSession);
      }
      return { user: data.user || data, session: data.access_token ? data : undefined };
    } catch (err: any) {
      return { error: err.message || 'Network error connecting to Supabase' };
    }
  }

  public async signIn(email: string, password: string): Promise<{ user?: SupabaseUser; session?: SupabaseSession; error?: string }> {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) return { error: 'Supabase URL & Anon Key are required.' };

    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password&apikey=${encodeURIComponent(anonKey)}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.msg || data.error_description || data.message || 'Invalid credentials' };
      }
      saveStoredSession(data as SupabaseSession);
      return { user: data.user, session: data as SupabaseSession };
    } catch (err: any) {
      return { error: err.message || 'Network error connecting to Supabase' };
    }
  }

  public async signOut(): Promise<void> {
    const { url, anonKey } = getSupabaseConfig();
    const session = getStoredSession();
    if (url && session?.access_token) {
      try {
        await fetch(`${url}/auth/v1/logout?apikey=${encodeURIComponent(anonKey)}`, {
          method: 'POST',
          headers: this.getHeaders(session.access_token),
        });
      } catch {
        // Safe ignore
      }
    }
    saveStoredSession(null);
  }

  public async select(table: string, query: string = '*'): Promise<{ data?: any[]; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL not configured' };
    const cleanTable = table.trim().replace(/^\/+/, '');

    try {
      // First attempt with created_at desc ordering
      const res = await fetch(`${url}/rest/v1/${cleanTable}?select=${encodeURIComponent(query)}&order=created_at.desc`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (res.ok) {
        const data = await res.json();
        return { data: Array.isArray(data) ? data : [data] };
      }

      // Fallback query without ordering if created_at column doesn't exist
      const fallbackRes = await fetch(`${url}/rest/v1/${cleanTable}?select=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        return { error: fallbackData.message || fallbackData.hint || `Query to ${cleanTable} failed` };
      }
      return { data: Array.isArray(fallbackData) ? fallbackData : [fallbackData] };
    } catch (err: any) {
      return { error: err.message || 'Query error' };
    }
  }

  public async delete(table: string, column: string, value: string): Promise<{ success: boolean; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { success: false, error: 'Supabase URL not configured' };
    const cleanTable = table.trim().replace(/^\/+/, '');

    try {
      const res = await fetch(`${url}/rest/v1/${cleanTable}?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.message || 'Delete operation failed' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async update(table: string, column: string, value: string, payload: Record<string, any>): Promise<{ data?: any; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL not configured' };
    const cleanTable = table.trim().replace(/^\/+/, '');

    try {
      const res = await fetch(`${url}/rest/v1/${cleanTable}?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.message || `Update to ${cleanTable} failed` };
      }
      return { data };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  public async upsert(table: string, payload: Record<string, any>): Promise<{ data?: any; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL not configured' };
    const cleanTable = table.trim().replace(/^\/+/, '');

    try {
      const res = await fetch(`${url}/rest/v1/${cleanTable}`, {
        method: 'POST',
        headers: this.getHeaders(undefined, true),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.message || data.hint || data.details || `Upsert to ${cleanTable} failed` };
      }
      return { data };
    } catch (err: any) {
      return { error: err.message || 'Network sync error' };
    }
  }

  public async insert(table: string, payload: Record<string, any>): Promise<{ data?: any; error?: string }> {
    return this.upsert(table, payload);
  }

  public async testConnection(): Promise<{ ok: boolean; message: string }> {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
      return { ok: false, message: 'URL and Anon Key are missing.' };
    }
    try {
      const res = await fetch(`${url}/auth/v1/health?apikey=${encodeURIComponent(anonKey)}`, {
        method: 'GET',
        headers: { 'apikey': anonKey }
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

export const supabase = new NativeSupabaseClient();