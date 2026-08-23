// Zero-dependency Supabase REST Client
const SUPABASE_URL = "https://dmoxkwtifnwymcalzbie.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8";

class SupabaseRestClient {
  private url: string;
  private anonKey: string;

  constructor(url: string, anonKey: string) {
    this.url = url.replace(/\/+$/, '');
    this.anonKey = anonKey;
  }

  from(table: string) {
    return {
      select: (columns = '*') => ({
        order: async (column: string, { ascending = true } = {}) => {
          try {
            const res = await fetch(`${this.url}/rest/v1/${table}?select=${encodeURIComponent(columns)}&order=${column}.${ascending ? 'asc' : 'desc'}`, {
              headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`
              }
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            return { data, error: null };
          } catch (error: any) {
            return { data: null, error };
          }
        },
        then: async (resolve: any, reject: any) => {
          try {
            const res = await fetch(`${this.url}/rest/v1/${table}?select=${encodeURIComponent(columns)}`, {
              headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`
              }
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            return resolve({ data, error: null });
          } catch (error: any) {
            return resolve({ data: null, error });
          }
        }
      }),
      insert: (rows: any[]) => ({
        select: async () => {
          try {
            const res = await fetch(`${this.url}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(rows)
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            return { data, error: null };
          } catch (error: any) {
            return { data: null, error };
          }
        }
      }),
      upsert: async (rows: any[]) => {
        try {
          const res = await fetch(`${this.url}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': this.anonKey,
              'Authorization': `Bearer ${this.anonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(rows)
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json().catch(() => null);
          return { data, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      },
      update: (values: any) => ({
        eq: async (column: string, value: any) => {
          try {
            const res = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
              method: 'PATCH',
              headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(values)
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json().catch(() => null);
            return { data, error: null };
          } catch (error: any) {
            return { data: null, error };
          }
        }
      }),
      delete: () => ({
        eq: async (column: string, value: any) => {
          try {
            const res = await fetch(`${this.url}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`, {
              method: 'DELETE',
              headers: {
                'apikey': this.anonKey,
                'Authorization': `Bearer ${this.anonKey}`
              }
            });
            if (!res.ok) throw new Error(await res.text());
            return { data: null, error: null };
          } catch (error: any) {
            return { data: null, error };
          }
        }
      })
    };
  }

  channel() {
    return {
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} })
    };
  }

  removeChannel() {}

  auth = {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signIn: async () => ({ error: 'Use email sign-in or guest mode' }),
    signUp: async () => ({ error: 'Use guest mode or Supabase UI' }),
    signOut: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: 'Google auth requires project domain setup' })
  };

  async testConnection() {
    try {
      const res = await fetch(`${this.url}/rest/v1/posts?select=id&limit=1`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });
      if (res.ok) return { ok: true, message: 'Connected to Supabase successfully!' };
      return { ok: false, message: `Status ${res.status}: Tables not found. Run SQL setup.` };
    } catch (e: any) {
      return { ok: false, message: e.message || 'Connection failed' };
    }
  }
}

export const supabase = new SupabaseRestClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export default supabase;