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

  // Google OAuth 2.0 Login with explicit redirect_to to prevent localhost fallback
  public async signInWithGoogle(): Promise<{ url?: string; error?: string }> {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
      return { error: 'Please configure your Supabase URL & Public Anon Key first in the modal.' };
    }

    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const oauthUrl = `${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(currentOrigin)}&apikey=${encodeURIComponent(anonKey)}`;
    
    if (typeof window !== 'undefined') {
      window.location.href = oauthUrl;
    }
    return { url: oauthUrl };
  }

  // Parse OAuth access_token or error params from hash fragments / query strings upon return
  public parseOAuthCallback(): { session?: SupabaseSession; error?: string } | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    const search = window.location.search;
    
    if (!hash && !search) return null;

    const hashParams = new URLSearchParams(hash ? hash.replace(/^#/, '') : '');
    const searchParams = new URLSearchParams(search ? search.replace(/^\?/, '') : '');

    // Check for provider error in query or hash
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
    if (errorDescription) {
      // Clean URL from error params
      window.history.replaceState(null, '', window.location.pathname);
      const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
      if (decoded.includes('Unable to exchange external code')) {
        return { 
          error: 'Google Client Secret mismatch. Please verify that your Google Client Secret in Supabase matches Google Cloud Console.' 
        };
      }
      return { error: decoded };
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

  // Fetch current user details with access_token
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
    const { url, anonKey } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL not configured' };
    const cleanTable = table.trim().replace(/^\/+/, '');
    if (!cleanTable) return { error: 'Invalid table name' };

    try {
      const res = await fetch(`${url}/rest/v1/${cleanTable}?select=${encodeURIComponent(query)}&order=created_at.desc`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.hint || data.details || `Query to ${cleanTable} failed` };
      }
      return { data: Array.isArray(data) ? data : [data] };
    } catch (err: any) {
      return { error: err.message || 'Query error' };
    }
  }

  public async upsert(table: string, payload: Record<string, any>): Promise<{ data?: any; error?: string }> {
    const { url } = getSupabaseConfig();
    if (!url) return { error: 'Supabase URL not configured' };
    const cleanTable = table.trim().replace(/^\/+/, '');
    if (!cleanTable) return { error: 'Invalid table name' };

    try {
      const res = await fetch(`${url}/rest/v1/${cleanTable}`, {
        method: 'POST',
        headers: this.getHeaders(undefined, true),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
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
        headers: {
          'apikey': anonKey,
        }
      });
      if (res.ok || res.status === 200) {
        return { ok: true, message: 'Connected to Supabase successfully!' };
      }

      const restRes = await fetch(`${url}/rest/v1/?apikey=${encodeURIComponent(anonKey)}`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Accept': 'application/openapi+json, application/json'
        }
      });
      if (restRes.ok || restRes.status === 200 || restRes.status === 401) {
        return { ok: true, message: 'Connected to Supabase REST endpoint!' };
      }
      return { ok: false, message: `Received HTTP status ${res.status}` };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Failed to reach Supabase project.' };
    }
  }
}

export const supabase = new SupabaseClient();