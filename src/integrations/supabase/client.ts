import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dmoxkwtifnwymcalzbie.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;