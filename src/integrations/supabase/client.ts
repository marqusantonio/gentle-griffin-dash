import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const SUPABASE_URL = "https://dmoxkwtifnwymcalzbie.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
export default supabase;