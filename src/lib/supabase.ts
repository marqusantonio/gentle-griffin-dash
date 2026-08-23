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

export const SUPABASE_SQL_SCHEMA = `-- Comprehensive Followers, Messaging & Streaks System SQL Migration
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor)

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

-- DATA API GRANTS (MANDATORY FOR REST API & supabase-js)
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

-- ATOMIC STORED PROCEDURE: Atomic Mutual Follow Switch
CREATE OR REPLACE FUNCTION public.toggle_follow_atomic(
  p_follower_id TEXT,
  p_following_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reverse_exists BOOLEAN;
  v_already_following BOOLEAN;
BEGIN
  -- Check if follower_id already follows following_id
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  ) INTO v_already_following;

  IF v_already_following THEN
    -- UNFOLLOW: Remove follow relationship
    DELETE FROM public.follows WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    -- If reverse follow exists, demote reverse status back to 'pending'
    UPDATE public.follows 
    SET status = 'pending' 
    WHERE follower_id = p_following_id AND following_id = p_follower_id;

    RETURN jsonb_build_object('status', 'unfollowed', 'is_mutual', false);
  ELSE
    -- Check if target user already follows me
    SELECT EXISTS(
      SELECT 1 FROM public.follows 
      WHERE follower_id = p_following_id AND following_id = p_follower_id
    ) INTO v_reverse_exists;

    IF v_reverse_exists THEN
      -- Mutual Friend: Set BOTH to 'accepted'
      INSERT INTO public.follows (follower_id, following_id, status)
      VALUES (p_follower_id, p_following_id, 'accepted')
      ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'accepted';

      UPDATE public.follows 
      SET status = 'accepted' 
      WHERE follower_id = p_following_id AND following_id = p_follower_id;

      RETURN jsonb_build_object('status', 'accepted', 'is_mutual', true);
    ELSE
      -- One-way follow: Set status = 'pending'
      INSERT INTO public.follows (follower_id, following_id, status)
      VALUES (p_follower_id, p_following_id, 'pending')
      ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'pending';

      RETURN jsonb_build_object('status', 'pending', 'is_mutual', false);
    END IF;
  END IF;
END;
$$;

-- ATOMIC STORED PROCEDURE: Get or Create Unique Conversation
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

-- ATOMIC STORED PROCEDURE: Send Message with 1-Request Rules & 🔥 Streak Updating
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
  v_is_mutual BOOLEAN;
  v_sender_msg_count INTEGER;
  v_u1 TEXT;
  v_u2 TEXT;
  v_last_date DATE;
  v_streak INTEGER := 0;
  v_msg_id UUID;
BEGIN
  -- Get recipient ID
  SELECT user_id INTO v_recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = p_conversation_id AND user_id != p_sender_id
  LIMIT 1;

  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient participant not found';
  END IF;

  -- Check if users are mutual friends (both follows records exist with status = 'accepted')
  SELECT (
    EXISTS(SELECT 1 FROM public.follows WHERE follower_id = p_sender_id AND following_id = v_recipient_id AND status = 'accepted')
    AND
    EXISTS(SELECT 1 FROM public.follows WHERE follower_id = v_recipient_id AND following_id = p_sender_id AND status = 'accepted')
  ) INTO v_is_mutual;

  -- If NOT mutual friends, enforce 1-Message Request Limit
  IF NOT v_is_mutual THEN
    SELECT COUNT(*) INTO v_sender_msg_count
    FROM public.messages
    WHERE conversation_id = p_conversation_id AND sender_id = p_sender_id;

    IF v_sender_msg_count >= 1 THEN
      RAISE EXCEPTION 'Request limit reached: You can only send 1 request message until recipient accepts your follow or reply.';
    END IF;
  END IF;

  -- Insert Message
  INSERT INTO public.messages (conversation_id, sender_id, content, media_url, type)
  VALUES (p_conversation_id, p_sender_id, p_content, p_media_url, p_type)
  RETURNING id INTO v_msg_id;

  -- Atomic Streak Logic
  IF p_sender_id < v_recipient_id THEN
    v_u1 := p_sender_id; v_u2 := v_recipient_id;
  ELSE
    v_u1 := v_recipient_id; v_u2 := p_sender_id;
  END IF;

  SELECT current_streak, last_message_date INTO v_streak, v_last_date
  FROM public.streaks
  WHERE user_1 = v_u1 AND user_2 = v_u2;

  IF v_last_date IS NULL THEN
    -- First message exchange
    INSERT INTO public.streaks (user_1, user_2, current_streak, last_message_date)
    VALUES (v_u1, v_u2, 1, CURRENT_DATE)
    ON CONFLICT (user_1, user_2) DO UPDATE SET current_streak = 1, last_message_date = CURRENT_DATE;
    v_streak := 1;
  ELSIF v_last_date = CURRENT_DATE THEN
    -- Already communicated today, keep streak
    NULL;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Communicated yesterday! Increment 🔥 Streak
    v_streak := COALESCE(v_streak, 0) + 1;
    UPDATE public.streaks SET current_streak = v_streak, last_message_date = CURRENT_DATE
    WHERE user_1 = v_u1 AND user_2 = v_u2;
  ELSE
    -- Communication gap > 24 hours: Reset streak
    v_streak := 1;
    UPDATE public.streaks SET current_streak = 1, last_message_date = CURRENT_DATE
    WHERE user_1 = v_u1 AND user_2 = v_u2;
  END IF;

  RETURN jsonb_build_object(
    'message_id', v_msg_id,
    'is_mutual', v_is_mutual,
    'current_streak', v_streak
  );
END;
$$;
`;