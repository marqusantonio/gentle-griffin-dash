// Zero-dependency Supabase REST & RPC Client
const SUPABASE_URL = "https://dmoxkwtifnwymcalzbie.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8";

class SupabaseQueryBuilder {
  private url: string;
  private anonKey: string;
  private table: string;
  private queryParams: string[] = [];

  constructor(url: string, anonKey: string, table: string) {
    this.url = url;
    this.anonKey = anonKey;
    this.table = table;
  }

  select(columns = '*') {
    this.queryParams.push(`select=${encodeURIComponent(columns)}`);
    return this;
  }

  eq(column: string, value: any) {
    this.queryParams.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  in(column: string, values: any[]) {
    const formatted = `(${values.map(v => encodeURIComponent(v)).join(',')})`;
    this.queryParams.push(`${column}=in.${formatted}`);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.queryParams.push(`order=${column}.${ascending ? 'asc' : 'desc'}`);
    return this;
  }

  limit(count: number) {
    this.queryParams.push(`limit=${count}`);
    return this;
  }

  async then(resolve: (res: { data: any; error: any }) => void) {
    try {
      const queryString = this.queryParams.length ? `?${this.queryParams.join('&')}` : '';
      const res = await fetch(`${this.url}/rest/v1/${this.table}${queryString}`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });
      if (!res.ok) {
        const text = await res.text();
        resolve({ data: null, error: new Error(text) });
        return;
      }
      const data = await res.json();
      resolve({ data, error: null });
    } catch (error: any) {
      resolve({ data: null, error });
    }
  }

  async insert(rows: any[]) {
    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(rows)
      });
      if (!res.ok) {
        const text = await res.text();
        return { data: null, error: new Error(text) };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async upsert(rows: any[]) {
    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(rows)
      });
      if (!res.ok) {
        const text = await res.text();
        return { data: null, error: new Error(text) };
      }
      const data = await res.json().catch(() => null);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  update(values: any) {
    return {
      eq: async (column: string, value: any) => {
        try {
          const res = await fetch(`${this.url}/rest/v1/${this.table}?${column}=eq.${encodeURIComponent(value)}`, {
            method: 'PATCH',
            headers: {
              'apikey': this.anonKey,
              'Authorization': `Bearer ${this.anonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(values)
          });
          if (!res.ok) {
            const text = await res.text();
            return { data: null, error: new Error(text) };
          }
          const data = await res.json().catch(() => null);
          return { data, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      }
    };
  }

  delete() {
    return {
      eq: async (column: string, value: any) => {
        try {
          const res = await fetch(`${this.url}/rest/v1/${this.table}?${column}=eq.${encodeURIComponent(value)}`, {
            method: 'DELETE',
            headers: {
              'apikey': this.anonKey,
              'Authorization': `Bearer ${this.anonKey}`
            }
          });
          if (!res.ok) {
            const text = await res.text();
            return { data: null, error: new Error(text) };
          }
          return { data: null, error: null };
        } catch (error: any) {
          return { data: null, error };
        }
      }
    };
  }
}

class SupabaseRestClient {
  private url: string;
  private anonKey: string;

  constructor(url: string, anonKey: string) {
    this.url = url.replace(/\/+$/, '');
    this.anonKey = anonKey;
  }

  from(table: string) {
    return new SupabaseQueryBuilder(this.url, this.anonKey, table);
  }

  async rpc(functionName: string, args: Record<string, any> = {}) {
    try {
      const res = await fetch(`${this.url}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(args)
      });
      if (!res.ok) {
        const text = await res.text();
        return { data: null, error: new Error(text) };
      }
      const data = await res.json().catch(() => null);
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  channel(name: string) {
    return {
      on: (_event: string, _filter: any, _callback: Function) => ({
        subscribe: () => ({
          unsubscribe: () => {}
        })
      }),
      subscribe: () => ({
        unsubscribe: () => {}
      })
    };
  }

  removeChannel(_channel: any) {}

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