const SUPABASE_URL = "https://dmoxkwtifnwymcalzbie.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8";

class SupabaseQueryBuilder {
  private url: string;
  private apiKey: string;
  private table: string;
  private queryParams: string[] = [];
  private headers: Record<string, string>;

  constructor(url: string, apiKey: string, table: string) {
    this.url = url;
    this.apiKey = apiKey;
    this.table = table;
    this.headers = {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  select(columns: string = '*') {
    this.queryParams.push(`select=${encodeURIComponent(columns)}`);
    return this;
  }

  eq(column: string, value: any) {
    this.queryParams.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  order(column: string, opts: { ascending?: boolean } = {}) {
    const dir = opts.ascending === false ? 'desc' : 'asc';
    this.queryParams.push(`order=${encodeURIComponent(column)}.${dir}`);
    return this;
  }

  private buildUrl(): string {
    const qs = this.queryParams.length > 0 ? `?${this.queryParams.join('&')}` : '';
    return `${this.url}/rest/v1/${this.table}${qs}`;
  }

  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      const res = await fetch(this.buildUrl(), {
        method: 'GET',
        headers: this.headers
      });
      if (!res.ok) {
        const errText = await res.text();
        return resolve({ data: null, error: { message: errText || res.statusText } });
      }
      const data = await res.json();
      return resolve({ data, error: null });
    } catch (err: any) {
      if (reject) reject(err);
      return resolve({ data: null, error: { message: err.message || 'Network error' } });
    }
  }

  async single() {
    const { data, error } = await this;
    if (error) return { data: null, error };
    if (Array.isArray(data) && data.length > 0) {
      return { data: data[0], error: null };
    }
    return { data: null, error: { message: 'Row not found' } };
  }

  async maybeSingle() {
    const { data, error } = await this;
    if (error) return { data: null, error };
    if (Array.isArray(data) && data.length > 0) {
      return { data: data[0], error: null };
    }
    return { data: null, error: null };
  }

  async insert(values: any[]) {
    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: { message: errText || res.statusText } };
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : values;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Insert failed' } };
    }
  }

  async upsert(values: any[]) {
    try {
      const headers = { ...this.headers, 'Prefer': 'resolution=merge-duplicates,return=representation' };
      const res = await fetch(`${this.url}/rest/v1/${this.table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: { message: errText || res.statusText } };
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : values;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Upsert failed' } };
    }
  }

  async update(values: any) {
    const qs = this.queryParams.length > 0 ? `?${this.queryParams.join('&')}` : '';
    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}${qs}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: { message: errText || res.statusText } };
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : values;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Update failed' } };
    }
  }

  async delete() {
    const qs = this.queryParams.length > 0 ? `?${this.queryParams.join('&')}` : '';
    try {
      const res = await fetch(`${this.url}/rest/v1/${this.table}${qs}`, {
        method: 'DELETE',
        headers: this.headers
      });
      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: { message: errText || res.statusText } };
      }
      return { data: true, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Delete failed' } };
    }
  }
}

class SupabaseChannel {
  private name: string;
  private callbacks: Array<(payload: any) => void> = [];

  constructor(name: string) {
    this.name = name;
  }

  on(_event: string, _opts: any, callback: (payload: any) => void) {
    this.callbacks.push(callback);
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) callback('SUBSCRIBED');
    return this;
  }

  track(_data: any) {
    return Promise.resolve('ok');
  }

  presenceState() {
    return {};
  }
}

class SupabaseClient {
  private url: string;
  private apiKey: string;
  public auth: {
    signUp: (email: string, pass: string, name?: string) => Promise<any>;
    signIn: (email: string, pass: string) => Promise<any>;
    signOut: () => Promise<any>;
    onAuthStateChange: (cb: any) => { data: { subscription: { unsubscribe: () => void } } };
  };

  constructor(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;

    this.auth = {
      signUp: async (email: string, password: string, name?: string) => {
        try {
          const res = await fetch(`${this.url}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'apikey': this.apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, data: { full_name: name } })
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data.msg || data.message || 'Sign up failed' };
          return { data, error: null, user: data.user };
        } catch (err: any) {
          return { data: null, error: err.message };
        }
      },
      signIn: async (email: string, password: string) => {
        try {
          const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'apikey': this.apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) return { data: null, error: data.error_description || data.msg || 'Sign in failed' };
          return { data, error: null, user: data.user };
        } catch (err: any) {
          return { data: null, error: err.message };
        }
      },
      signOut: async () => {
        return { error: null };
      },
      onAuthStateChange: (callback: any) => {
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      }
    };
  }

  from(table: string) {
    return new SupabaseQueryBuilder(this.url, this.apiKey, table);
  }

  async rpc(fnName: string, params: Record<string, any> = {}) {
    try {
      const res = await fetch(`${this.url}/rest/v1/rpc/${fnName}`, {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const errText = await res.text();
        return { data: null, error: { message: errText } };
      }
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  channel(name: string, _opts?: any) {
    return new SupabaseChannel(name);
  }

  removeChannel(_channel: any) {}

  async testConnection() {
    try {
      const res = await fetch(`${this.url}/rest/v1/posts?select=id&limit=1`, {
        headers: {
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      if (res.ok || res.status === 200 || res.status === 206) {
        return { ok: true, message: 'Supabase Database connected successfully!' };
      }
      return { ok: false, message: `Status ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Connection failed' };
    }
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export default supabase;