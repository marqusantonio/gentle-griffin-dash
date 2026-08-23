import { supabase } from '../integrations/supabase/client';

export { supabase };

export const sanitizeBaseUrl = (url: string): string => {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
};

export const isSupabaseConfigured = (): boolean => {
  return true;
};

export const getSupabaseConfig = () => ({
  url: "https://dmoxkwtifnwymcalzbie.supabase.co",
  anonKey: "sb_publishable_secKTwXm6CJ4GaTOho_7OA_wG6S5Ut8"
});

export const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('wevids_supabase_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveStoredSession = (session: any) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem('wevids_supabase_session');
  } else {
    localStorage.setItem('wevids_supabase_session', JSON.stringify(session));
  }
};

export const saveSupabaseCredentials = (_url: string, _anonKey: string) => {};
export const clearSupabaseCredentials = () => {};

export const checkContentModeration = (text: string): { flagged: boolean; reason?: string } => {
  if (!text) return { flagged: false };
  const prohibited = ['kill', 'harass', 'hate_speech', 'nazi', 'doxx', 'scam', 'abuse', 'terrorism'];
  const lower = text.toLowerCase();
  for (const word of prohibited) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) {
      return { 
        flagged: true, 
        reason: `Your post violates community guidelines: flagged keyword detected ("${word}").` 
      };
    }
  }
  return { flagged: false };
};

export const SUPABASE_SQL_SCHEMA = `-- 100x Ultra-Futuristic Cyberpunk Social Engine Migration
-- Execute this script in your Supabase SQL Editor (supabase.com -> SQL Editor)

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT,
  handle TEXT UNIQUE,
  avatar TEXT,
  avatarImage TEXT,
  color TEXT,
  location TEXT,
  bio TEXT,
  pronouns TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  followingIds JSONB DEFAULT '[]'::jsonb,
  followerIds JSONB DEFAULT '[]'::jsonb,
  blockedUserIds JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FOLLOWS TABLE (Mutual / Pending / Accepted)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CONVERSATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- 5. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. STREAKS TABLE (Daily 🔥 Counter)
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1 TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2 TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_message_date DATE,
  CONSTRAINT unique_streak_pair UNIQUE(user_1, user_2)
);

-- DATA API GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.follows TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversations TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversation_participants TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.streaks TO service_role, authenticated, anon;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access follows" ON public.follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access conversations" ON public.conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access participants" ON public.conversation_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access streaks" ON public.streaks FOR ALL USING (true) WITH CHECK (true);

-- RPC 1: ACCEPT MESSAGE REQUEST (Atomically Unlocks Chat & Mutual Follow)
CREATE OR REPLACE FUNCTION public.accept_message_request(
  p_sender_id TEXT,
  p_receiver_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Ensure mutual follow relationship is accepted
  INSERT INTO public.follows (follower_id, following_id, status)
  VALUES (p_sender_id, p_receiver_id, 'accepted')
  ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'accepted';

  INSERT INTO public.follows (follower_id, following_id, status)
  VALUES (p_receiver_id, p_sender_id, 'accepted')
  ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'accepted';

  -- 2. Approve all pending direct messages between these two users
  UPDATE public.direct_messages
  SET is_approved = true
  WHERE (sender_id = p_sender_id AND receiver_id = p_receiver_id)
     OR (sender_id = p_receiver_id AND receiver_id = p_sender_id);

  RETURN jsonb_build_object(
    'success', true,
    'relationship_status', 'FRIENDS',
    'message', 'Transmission link established. Mutual Friends unlocked.'
  );
END;
$$;

-- RPC 2: GET RELATIONSHIP STATUS (Returns NONE, FOLLOWING, FOLLOW_BACK, FRIENDS)
CREATE OR REPLACE FUNCTION public.get_relationship_status(
  p_current_user_id TEXT,
  p_target_user_id TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_i_follow_them BOOLEAN := false;
  v_i_follow_status TEXT;
  v_they_follow_me BOOLEAN := false;
  v_they_follow_status TEXT;
BEGIN
  IF p_current_user_id = p_target_user_id THEN
    RETURN 'FRIENDS';
  END IF;

  SELECT true, status INTO v_i_follow_them, v_i_follow_status
  FROM public.follows
  WHERE follower_id = p_current_user_id AND following_id = p_target_user_id;

  SELECT true, status INTO v_they_follow_me, v_they_follow_status
  FROM public.follows
  WHERE follower_id = p_target_user_id AND following_id = p_current_user_id;

  IF COALESCE(v_i_follow_them, false) AND COALESCE(v_they_follow_me, false) THEN
    RETURN 'FRIENDS';
  ELSIF COALESCE(v_i_follow_them, false) THEN
    RETURN 'FOLLOWING';
  ELSIF COALESCE(v_they_follow_me, false) THEN
    RETURN 'FOLLOW_BACK';
  ELSE
    RETURN 'NONE';
  END IF;
END;
$$;

-- AUTOMATIC TRIGGER: Auto mutual follow trigger
CREATE OR REPLACE FUNCTION public.handle_auto_mutual_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reciprocal_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.follows
    WHERE follower_id = NEW.following_id AND following_id = NEW.follower_id
  ) INTO v_reciprocal_exists;

  IF v_reciprocal_exists THEN
    NEW.status := 'accepted';
    UPDATE public.follows
    SET status = 'accepted'
    WHERE follower_id = NEW.following_id AND following_id = NEW.follower_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_mutual_follow ON public.follows;
CREATE TRIGGER trg_auto_mutual_follow
BEFORE INSERT OR UPDATE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_auto_mutual_follow();

-- RPC 3: ATOMIC FOLLOW TOGGLE
CREATE OR REPLACE FUNCTION public.toggle_follow_atomic(
  p_follower_id TEXT,
  p_following_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_following BOOLEAN;
  v_relationship TEXT;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  ) INTO v_already_following;

  IF v_already_following THEN
    DELETE FROM public.follows WHERE follower_id = p_follower_id AND following_id = p_following_id;
    UPDATE public.follows SET status = 'pending' WHERE follower_id = p_following_id AND following_id = p_follower_id;
  ELSE
    INSERT INTO public.follows (follower_id, following_id, status)
    VALUES (p_follower_id, p_following_id, 'pending');
  END IF;

  v_relationship := public.get_relationship_status(p_follower_id, p_following_id);

  RETURN jsonb_build_object(
    'status', v_relationship,
    'is_mutual', (v_relationship = 'FRIENDS')
  );
END;
$$;

-- RPC 4: GET OR CREATE CONVERSATION
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_user_1 TEXT,
  p_user_2 TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conv_id UUID;
BEGIN
  SELECT cp1.conversation_id INTO v_conv_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = p_user_1 AND cp2.user_id = p_user_2
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO v_conv_id;
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (v_conv_id, p_user_1);
    INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (v_conv_id, p_user_2);
  END IF;

  RETURN v_conv_id;
END;
$$;

-- RPC 5: SEND MESSAGE WITH 1-REQUEST LIMIT & STREAKS
CREATE OR REPLACE FUNCTION public.send_message_with_rules(
  p_conversation_id UUID,
  p_sender_id TEXT,
  p_content TEXT,
  p_media_url TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'text'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id TEXT;
  v_rel_status TEXT;
  v_sender_msg_count INTEGER;
  v_u1 TEXT;
  v_u2 TEXT;
  v_last_date DATE;
  v_streak INTEGER := 0;
  v_msg_id UUID;
BEGIN
  SELECT user_id INTO v_recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id != p_sender_id
  LIMIT 1;

  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient not found in conversation';
  END IF;

  v_rel_status := public.get_relationship_status(p_sender_id, v_recipient_id);

  IF v_rel_status != 'FRIENDS' THEN
    SELECT COUNT(*) INTO v_sender_msg_count
    FROM public.messages
    WHERE conversation_id = p_conversation_id AND sender_id = p_sender_id;

    IF v_sender_msg_count >= 1 THEN
      RAISE EXCEPTION 'Request limit reached: Only 1 transmission request allowed until target accepts or follows back.';
    END IF;
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, content, media_url, type)
  VALUES (p_conversation_id, p_sender_id, p_content, p_media_url, p_type)
  RETURNING id INTO v_msg_id;

  IF p_sender_id < v_recipient_id THEN
    v_u1 := p_sender_id; v_u2 := v_recipient_id;
  ELSE
    v_u1 := v_recipient_id; v_u2 := p_sender_id;
  END IF;

  SELECT current_streak, last_message_date INTO v_streak, v_last_date
  FROM public.streaks
  WHERE user_1 = v_u1 AND user_2 = v_u2;

  IF v_last_date IS NULL THEN
    INSERT INTO public.streaks (user_1, user_2, current_streak, last_message_date)
    VALUES (v_u1, v_u2, 1, CURRENT_DATE)
    ON CONFLICT (user_1, user_2) DO UPDATE SET current_streak = 1, last_message_date = CURRENT_DATE;
    v_streak := 1;
  ELSIF v_last_date = CURRENT_DATE THEN
    NULL;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_streak := COALESCE(v_streak, 0) + 1;
    UPDATE public.streaks SET current_streak = v_streak, last_message_date = CURRENT_DATE
    WHERE user_1 = v_u1 AND user_2 = v_u2;
  ELSE
    v_streak := 1;
    UPDATE public.streaks SET current_streak = 1, last_message_date = CURRENT_DATE
    WHERE user_1 = v_u1 AND user_2 = v_u2;
  END IF;

  RETURN jsonb_build_object(
    'message_id', v_msg_id,
    'relationship_status', v_rel_status,
    'current_streak', v_streak
  );
END;
$$;
`;