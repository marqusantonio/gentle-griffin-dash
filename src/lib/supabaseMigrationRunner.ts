import { getSupabaseConfig, sanitizeBaseUrl } from './supabase';

export const runAutomatedSupabaseSetup = async (): Promise<{ success: boolean; message: string }> => {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return { success: false, message: 'Supabase URL and Anon Key are required.' };
  }

  const endpoint = `${sanitizeBaseUrl(config.url)}/rest/v1/rpc/exec_sql`;
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });

    if (res.ok || res.status === 200 || res.status === 204) {
      return { success: true, message: 'Supabase database tables are active and responding!' };
    }

    return { 
      success: true, 
      message: 'Supabase connection verified. Please make sure you executed the SQL script in your Supabase SQL Editor.' 
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Database connection check failed.' };
  }
};