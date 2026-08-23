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

export const SUPABASE_SQL_SCHEMA = `-- WEVIDS OS v3.1 Complete Database Schema Script
-- Execute this script in your Supabase SQL Editor (https://supabase.com -> SQL Editor -> New Query)

-- 1. PROFILES TABLE WITH LIVE COUNTERS & JSONB ARRAYS
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
  walletBalance NUMERIC DEFAULT 50,
  verified BOOLEAN DEFAULT false,
  isAdmin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure count columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followingIds JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followerIds JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blockedUserIds JSONB DEFAULT '[]'::jsonb;

-- 2. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  userId TEXT,
  authorName TEXT,
  authorHandle TEXT,
  authorAvatar TEXT,
  authorColor TEXT,
  location TEXT,
  time TEXT,
  title TEXT,
  content TEXT,
  caption TEXT,
  video_url TEXT DEFAULT 'none',
  mediaUrl TEXT,
  mediaType TEXT,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CLIPS TABLE
CREATE TABLE IF NOT EXISTS public.clips (
  id TEXT PRIMARY KEY,
  userId TEXT,
  title TEXT,
  description TEXT,
  videoUrl TEXT,
  video_url TEXT,
  audioTrack TEXT DEFAULT 'Original Audio Track',
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DIRECT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT,
  mediaUrl TEXT,
  type TEXT DEFAULT 'text',
  is_friend_request BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT NULL,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PROFILE LIKES TABLE
CREATE TABLE IF NOT EXISTS public.profile_likes (
  liker_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (liker_id, target_id)
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

-- ATOMIC FOLLOW TOGGLE RPC
CREATE OR REPLACE FUNCTION public.toggle_follow_atomic(
  p_follower_id TEXT,
  p_following_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_already_following BOOLEAN;
  v_reciprocal_exists BOOLEAN;
  v_status TEXT := 'pending';
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  ) INTO v_already_following;

  IF v_already_following THEN
    DELETE FROM public.follows WHERE follower_id = p_follower_id AND following_id = p_following_id;
    RETURN jsonb_build_object('status', 'NONE', 'is_mutual', false);
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM public.follows
      WHERE follower_id = p_following_id AND following_id = p_follower_id
    ) INTO v_reciprocal_exists;

    IF v_reciprocal_exists THEN
      v_status := 'accepted';
      UPDATE public.follows SET status = 'accepted'
      WHERE follower_id = p_following_id AND following_id = p_follower_id;
    END IF;

    INSERT INTO public.follows (follower_id, following_id, status)
    VALUES (p_follower_id, p_following_id, v_status)
    ON CONFLICT (follower_id, following_id) DO UPDATE SET status = v_status;

    RETURN jsonb_build_object('status', v_status, 'is_mutual', v_reciprocal_exists);
  END IF;
END;
$$;

-- DATA API GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.follows TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.posts TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clips TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.direct_messages TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_likes TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.streaks TO service_role, authenticated, anon;

-- ENABLE REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE profiles, follows, posts, clips, direct_messages;
`;