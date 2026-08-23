-- ==============================================================================
-- WEVIDS OS v3.1: ROCK-SOLID FOLLOWERS & LIKES SUPABASE SQL MIGRATION
-- ==============================================================================

-- 1. Ensure Aggregate Columns exist in public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. Create profile_likes table
CREATE TABLE IF NOT EXISTS public.profile_likes (
  liker_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (liker_id, target_id)
);

-- 3. Create follows table if not already present
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS FOR AGGREGATE COUNTERS
-- ==============================================================================

-- Trigger function for Follows (increment/decrement follower_count & following_count)
CREATE OR REPLACE FUNCTION public.handle_follows_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment following_count for follower
    UPDATE public.profiles 
    SET following_count = COALESCE(following_count, 0) + 1,
        following = COALESCE(following, 0) + 1
    WHERE id = NEW.follower_id;

    -- Increment follower_count for target (following_id)
    UPDATE public.profiles 
    SET follower_count = COALESCE(follower_count, 0) + 1,
        followers = COALESCE(followers, 0) + 1
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement following_count for follower
    UPDATE public.profiles 
    SET following_count = GREATEST(0, COALESCE(following_count, 1) - 1),
        following = GREATEST(0, COALESCE(following, 1) - 1)
    WHERE id = OLD.follower_id;

    -- Decrement follower_count for target (following_id)
    UPDATE public.profiles 
    SET follower_count = GREATEST(0, COALESCE(follower_count, 1) - 1),
        followers = GREATEST(0, COALESCE(followers, 1) - 1)
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_follows_counter ON public.follows;
CREATE TRIGGER trg_follows_counter
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follows_counter();


-- Trigger function for Profile Likes (increment/decrement likes_count)
CREATE OR REPLACE FUNCTION public.handle_profile_likes_counter()
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
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles 
    SET likes_count = GREATEST(0, COALESCE(likes_count, 1) - 1),
        likes = GREATEST(0, COALESCE(likes, 1) - 1)
    WHERE id = OLD.target_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_likes_counter ON public.profile_likes;
CREATE TRIGGER trg_profile_likes_counter
AFTER INSERT OR DELETE ON public.profile_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_profile_likes_counter();


-- ==============================================================================
-- DATA API GRANTS & REALTIME PUBLICATION
-- ==============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.follows TO service_role, authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profile_likes TO service_role, authenticated, anon;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE profiles, follows, profile_likes;