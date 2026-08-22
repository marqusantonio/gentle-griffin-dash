// This file exports the Supabase client for all app components without external package dependencies.
import { supabase, createClient, getSupabaseConfig } from '@/lib/supabase';

export { supabase, createClient, getSupabaseConfig };
export default supabase;