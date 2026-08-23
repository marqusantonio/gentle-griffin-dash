-- ============================================================================
-- WEVIDS v3.1 - COMPLETE POSTGRESQL DATABASE STRUCTURE & MIGRATION SCRIPT
-- Compatible with Supabase PostgreSQL 15+ / PostgREST Data API
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CORE SCHEMAS & TABLES
-- ============================================================================

-- A. PROFILES (Users, Creators, Modders)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT UNIQUE,
  avatar TEXT DEFAULT 'U',
  "avatarImage" TEXT,
  color TEXT DEFAULT 'linear-gradient(135deg, #ff2d95, #00e5ff)',
  location TEXT DEFAULT 'Earth Node',
  bio TEXT DEFAULT 'Building on WEVIDS ecosystem.',
  pronouns TEXT DEFAULT 'they/them',
  "bioAudioUrl" TEXT,
  "bioAudioTitle" TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  "followingIds" JSONB DEFAULT '[]'::jsonb,
  "followerIds" JSONB DEFAULT '[]'::jsonb,
  "blockedUserIds" JSONB DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  views TEXT DEFAULT '0',
  joined TEXT DEFAULT '2026',
  verified BOOLEAN DEFAULT false,
  "isAdmin" BOOLEAN DEFAULT false,
  "walletBalance" NUMERIC DEFAULT 50,
  email TEXT,
  badges JSONB DEFAULT '["⚡ Verified Node"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. POSTS & VIDEO FEEDS
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" TEXT,
  user_id UUID,
  "authorName" TEXT DEFAULT 'Creator',
  "authorHandle" TEXT DEFAULT '@creator',
  "authorAvatar" TEXT DEFAULT 'C',
  "authorColor" TEXT DEFAULT 'linear-gradient(135deg, #ff2d95, #00e5ff)',
  title TEXT,
  caption TEXT,
  content TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  video_url TEXT DEFAULT 'none',
  location TEXT DEFAULT 'Earth Node',
  time TEXT DEFAULT 'Just now',
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  tags JSONB DEFAULT '["#WEVIDS"]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. SHORTS / VERTICAL CLIPS
CREATE TABLE IF NOT EXISTS public.clips (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  title TEXT NOT NULL,
  description TEXT,
  "videoUrl" TEXT,
  video_url TEXT,
  "audioTrack" TEXT DEFAULT 'Original Audio Track',
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. DIRECT MESSAGING & CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT,
  "mediaUrl" TEXT,
  type TEXT DEFAULT 'text',
  is_friend_request BOOLEAN DEFAULT false,
  is_approved BOOLEAN,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. SOCIAL RELATIONSHIPS & FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  status TEXT DEFAULT 'accepted',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- F. PROFILE & POST LIKES
CREATE TABLE IF NOT EXISTS public.profile_likes (
  liker_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (liker_id, target_id)
);

-- G. AUDIO TRACKS & SYNTH STEMS
CREATE TABLE IF NOT EXISTS public.audio_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT DEFAULT 'Creator',
  duration TEXT DEFAULT '03:20',
  genre TEXT DEFAULT 'Synthwave / Cyberpunk',
  bpm INTEGER DEFAULT 120,
  url TEXT NOT NULL,
  cover TEXT,
  "uploaderId" TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- H. 4K CINEMA & FEATURE FILMS
CREATE TABLE IF NOT EXISTS public.films (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT,
  director TEXT DEFAULT 'Creator',
  "releaseYear" INTEGER DEFAULT 2026,
  duration TEXT DEFAULT '1h 30m',
  genre TEXT DEFAULT 'Cyberpunk Sci-Fi',
  rating NUMERIC DEFAULT 5.0,
  "videoUrl" TEXT NOT NULL,
  "posterUrl" TEXT,
  "backdropUrl" TEXT,
  "uploaderId" TEXT,
  views TEXT DEFAULT '0',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- I. CUSTOM ROM REPOSITORY & KERNELS
CREATE TABLE IF NOT EXISTS public.roms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  device TEXT NOT NULL,
  brand TEXT DEFAULT 'Xiaomi / Redmi',
  "romType" TEXT DEFAULT 'China ROM Port',
  status TEXT DEFAULT 'Official',
  maintainer TEXT NOT NULL,
  "maintainerHandle" TEXT,
  version TEXT NOT NULL,
  "androidVersion" TEXT DEFAULT 'Android 15',
  "fileSize" TEXT DEFAULT '4.5 GB',
  checksum TEXT,
  "downloadCount" INTEGER DEFAULT 0,
  "downloadUrl" TEXT NOT NULL,
  "githubUrl" TEXT,
  "releaseDate" TEXT DEFAULT 'Today',
  changelog JSONB DEFAULT '["Initial optimized build"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- J. DECENTRALIZED FILE VAULT
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" TEXT DEFAULT '10.0 MB',
  category TEXT DEFAULT 'ROM / Kernel',
  "uploaderId" TEXT,
  "uploaderName" TEXT,
  "downloadUrl" TEXT NOT NULL,
  checksum TEXT,
  downloads INTEGER DEFAULT 0,
  "uploadedAt" TEXT DEFAULT 'Just now',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- K. CREATOR MALL & DIGITAL ASSETS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Presets & LUTs',
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  "creatorId" TEXT,
  "creatorName" TEXT,
  rating NUMERIC DEFAULT 5.0,
  "salesCount" INTEGER DEFAULT 0,
  "previewUrl" TEXT,
  description TEXT,
  "affiliateCommission" NUMERIC DEFAULT 10,
  "isDigital" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- L. MULTIPLAYER ARCADE & GAME SCORES
CREATE TABLE IF NOT EXISTS public.game_scores (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_name TEXT,
  player_handle TEXT,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts("userId");
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON public.clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dms_sender_receiver ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_follows_pair ON public.follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_rank ON public.game_scores(game_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_roms_device ON public.roms(device, brand);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for real-time application access
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public full access profiles" ON public.profiles;
    CREATE POLICY "Public full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access posts" ON public.posts;
    CREATE POLICY "Public full access posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access clips" ON public.clips;
    CREATE POLICY "Public full access clips" ON public.clips FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access dms" ON public.direct_messages;
    CREATE POLICY "Public full access dms" ON public.direct_messages FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access follows" ON public.follows;
    CREATE POLICY "Public full access follows" ON public.follows FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access profile_likes" ON public.profile_likes;
    CREATE POLICY "Public full access profile_likes" ON public.profile_likes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access audio" ON public.audio_tracks;
    CREATE POLICY "Public full access audio" ON public.audio_tracks FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access films" ON public.films;
    CREATE POLICY "Public full access films" ON public.films FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access roms" ON public.roms;
    CREATE POLICY "Public full access roms" ON public.roms FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access files" ON public.files;
    CREATE POLICY "Public full access files" ON public.files FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access products" ON public.products;
    CREATE POLICY "Public full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public full access game_scores" ON public.game_scores;
    CREATE POLICY "Public full access game_scores" ON public.game_scores FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ============================================================================
-- 5. API DATA GRANTS (REQUIRED FOR REST / JS CLIENT)
-- ============================================================================
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.posts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.clips TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.direct_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.follows TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profile_likes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.audio_tracks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.films TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.roms TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.files TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.game_scores TO anon, authenticated, service_role;

-- ============================================================================
-- 6. AUTOMATED TRIGGER FUNCTIONS FOR LIVE COUNTERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET follower_count = COALESCE(follower_count, 0) + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 1) - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET follower_count = GREATEST(0, COALESCE(follower_count, 1) - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.target_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET likes_count = GREATEST(0, COALESCE(likes_count, 1) - 1) WHERE id = OLD.target_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON public.profile_likes;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.profile_likes
FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();