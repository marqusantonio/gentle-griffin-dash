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

-- 1. PROFILES TABLE WITH LIVE COUNTERS
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
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  followingIds JSONB DEFAULT '[]'::jsonb,
  followerIds JSONB DEFAULT '[]'::jsonb,
  blockedUserIds JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure count columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. FOLLOWS TABLE (Mutual / Pending / Accepted)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. PROFILE LIKES TABLE
CREATE TABLE IF NOT EXISTS public.profile_likes (
  liker_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (liker_id, target_id)
);

-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONVERSATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. STREAKS TABLE (Daily 🔥 Counter)
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1 TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2 TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_message_date DATE,
  CONSTRAINT unique_streak_pair UNIQUE(user_1, user_2)
);

-- AUTOMATIC COUNTER TRIGGERS FOR FOLLOWS
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles 
    SET following_count = COALESCE(following_count, 0) + 1,
        following = COALESCE(following, 0) + 1 
    WHERE id = NEW.follower_id;

    UPDATE public.profiles 
    SET follower_count = COALESCE(follower_count, 0) + 1,
        followers = COALESCE(followers, 0) + 1 
    WHERE id = NEW.following_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles 
    SET following_count = GREATEST(0, COALESCE(following_count, 1) - 1),
        following = GREATEST(0, COALESCE(following, 1) - 1) 
    WHERE id = OLD.follower_id;

    UPDATE public.profiles 
    SET follower_count = GREATEST(0, COALESCE(follower_count, 1) - 1),
        followers = GREATEST(0, COALESCE(followers, 1) - 1) 
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_follow_counts ON public.follows;
CREATE TRIGGER trg_update_follow_counts
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- AUTOMATIC COUNTER TRIGGERS FOR PROFILE LIKES
CREATE OR REPLACE FUNCTION public.update_profile_like_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles 
    SET likes_count = COALESCE(likes_count, 0) + 1,
        likes = COALESCE(likes, 0) + 1 
    WHERE id = NEW.target_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles 
    SET likes_count = GREATEST(0, COALESCE(likes_count, 1) - 1),
        likes = GREATEST(0, COALESCE(likes, 1) - 1) 
    WHERE id = OLD.target_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_profile_like_counts ON public.profile_likes;
CREATE TRIGGER trg_update_profile_like_counts
AFTER INSERT OR DELETE ON public.profile_likes
FOR EACH ROW EXECUTE FUNCTION public.update_profile_like_counts();

-- AUTO MUTUAL FOLLOW TRIGGER
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

-- RPC 1: GET RELATIONSHIP STATUS
CREATE OR REPLACE FUNCTION public.get_relationship_status(
  p_current_user_id TEXT,
  p_target_user_id TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_i_follow_them BOOLEAN := false;
  v_they_follow_me BOOLEAN := false;
BEGIN
  IF p_current_user_id = p_target_user_id THEN
    RETURN 'FRIENDS';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.follows
    WHERE follower_id = p_current_user_id AND following_id = p_target_user_id
  ) INTO v_i_follow_them;

  SELECT EXISTS(
    SELECT 1 FROM public.follows
    WHERE follower_id = p_target_user_id AND following_id = p_current_user_id
  ) INTO v_they_follow_me;

  IF v_i_follow_them AND v_they_follow_me THEN
    RETURN 'FRIENDS';
  ELSIF v_i_follow_them THEN
    RETURN 'FOLLOWING';
  ELSIF v_they_follow_me THEN
    RETURN 'FOLLOW_BACK';
  ELSE
    RETURN 'NONE';
  END IF;
END;
$$;

-- RPC 2: ACCEPT MESSAGE REQUEST
CREATE OR REPLACE FUNCTION public.accept_message_request(
  p_sender_id TEXT,
  p_receiver_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Ensure mutual follow relationship is set to accepted
  INSERT INTO public.follows (follower_id, following_id, status)
  VALUES (p_sender_id, p_receiver_id, 'accepted')
  ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'accepted';

  INSERT INTO public.follows (follower_id, following_id, status)
  VALUES (p_receiver_id, p_sender_id, 'accepted')
  ON CONFLICT (follower_id, following_id) DO UPDATE SET status = 'accepted';

  -- 2. Approve direct messages
  UPDATE public.direct_messages
  SET is_approved = true
  WHERE (sender_id = p_sender_id AND receiver_id = p_receiver_id)
     OR (sender_id = p_receiver_id AND receiver_id = p_sender_id);

  RETURN jsonb_build_object(
    'success', true,
    'relationship_status', 'FRIENDS',
    'message', 'Mutual transmission link established. Unrestricted chat enabled.'
  );
END;
$$;

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

-- DATA API GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.follows TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_likes TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversations TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversation_participants TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.streaks TO service_role, authenticated, anon;

-- ENABLE REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE profiles, follows, messages, conversations, profile_likes, direct_messages;
`;