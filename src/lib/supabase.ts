export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  created_at?: string;
}

export interface SupabaseSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: SupabaseUser;
}

// Storage helpers
export const getSupabaseConfig = (): SupabaseConfig => {
  if (typeof window === 'undefined') return { url: '', anonKey: '' };
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('wevids_supabase_url') || '';
  const localKey = localStorage.getItem('wevids_supabase_anon_key') || '';
  return {
    url: (envUrl || localUrl).trim().replace(/\/+$/, ''),
    anonKey: (envKey || localKey).trim(),
  };
};

export const saveSupabaseCredentials = (url: string, anonKey: string) => {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim().replace(/\/+$/, '');
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
  return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20);
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

// Pure fetch client for Supabase REST & Auth APIs
export class SupabaseClient {
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

  public async signUp(email: string, password: string): Promise<{ user?: SupabaseUser; session?: SupabaseSession; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL is not configured' };

    try {
      const res = await fetch(`${url}/auth/v1/signup`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ email, password }),
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
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL is not configured' };

    try {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
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
    const { url } = getSupabaseConfig();
    const session = getStoredSession();
    if (url && session?.access_token) {
      try {
        await fetch(`${url}/auth/v1/logout`, {
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

    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=${encodeURIComponent(query)}&order=created_at.desc`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.hint || data.details || 'Query failed' };
      }
      return { data: Array.isArray(data) ? data : [data] };
    } catch (err: any) {
      return { error: err.message || 'Query error' };
    }
  }

  public async upsert(table: string, payload: Record<string, any>): Promise<{ data?: any; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL not configured' };

    try {
      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: this.getHeaders(undefined, true),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.hint || data.details || 'Sync failed' };
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
      const res = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      if (res.ok || res.status === 200 || res.status === 401 || res.status === 404) {
        return { ok: true, message: 'Connected to Supabase endpoint!' };
      }
      return { ok: false, message: `Received HTTP status ${res.status}` };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Failed to reach Supabase project.' };
    }
  }
}

export const supabase = new SupabaseClient();