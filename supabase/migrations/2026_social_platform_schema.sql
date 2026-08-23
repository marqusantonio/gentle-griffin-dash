-- WEVIDS v3.1 Social Platform SQL Migration Script
-- Executed via Dyad direct database integration

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  avatar TEXT,
  "avatarImage" TEXT,
  color TEXT,
  location TEXT,
  bio TEXT,
  pronouns TEXT,
  "bioAudioUrl" TEXT,
  "bioAudioTitle" TEXT,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  "followingIds" JSONB DEFAULT '[]'::jsonb,
  "followerIds" JSONB DEFAULT '[]'::jsonb,
  likes INT DEFAULT 0,
  views TEXT DEFAULT '0',
  joined TEXT,
  verified BOOLEAN DEFAULT false,
  "walletBalance" NUMERIC DEFAULT 50,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles(handle);

-- 2. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  "authorName" TEXT,
  "authorHandle" TEXT,
  "authorAvatar" TEXT,
  "authorColor" TEXT,
  location TEXT,
  time TEXT,
  content TEXT,
  "mediaUrl" TEXT,
  "mediaType" TEXT,
  video_url TEXT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  shares INT DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts("userId");
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 3. Clips Table
CREATE TABLE IF NOT EXISTS public.clips (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  "videoUrl" TEXT,
  video_url TEXT,
  "audioTrack" TEXT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clips_user_id ON public.clips("userId");

-- 4. Direct Messages Table (Chat System)
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT,
  "mediaUrl" TEXT,
  type TEXT DEFAULT 'text',
  is_friend_request BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT NULL,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_sender_receiver ON public.direct_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON public.direct_messages(created_at ASC);

-- 5. Audio Tracks Table
CREATE TABLE IF NOT EXISTS public.audio_tracks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  duration TEXT,
  genre TEXT,
  bpm INT DEFAULT 120,
  url TEXT,
  cover TEXT,
  "uploaderId" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Films Table
CREATE TABLE IF NOT EXISTS public.films (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT,
  director TEXT,
  "releaseYear" INT DEFAULT 2026,
  duration TEXT,
  genre TEXT,
  rating NUMERIC DEFAULT 5.0,
  "videoUrl" TEXT,
  "posterUrl" TEXT,
  "backdropUrl" TEXT,
  "uploaderId" TEXT,
  views TEXT DEFAULT '0',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. ROMs & Kernels Table
CREATE TABLE IF NOT EXISTS public.roms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  device TEXT,
  brand TEXT,
  "romType" TEXT,
  status TEXT DEFAULT 'Official',
  maintainer TEXT,
  "maintainerHandle" TEXT,
  version TEXT,
  "androidVersion" TEXT DEFAULT 'Android 15',
  "fileSize" TEXT,
  checksum TEXT,
  "downloadCount" INT DEFAULT 0,
  "downloadUrl" TEXT,
  "githubUrl" TEXT,
  "releaseDate" TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Shared Files Vault Table
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "fileName" TEXT,
  "fileSize" TEXT,
  category TEXT,
  "uploaderId" TEXT,
  "uploaderName" TEXT,
  "downloadUrl" TEXT,
  checksum TEXT,
  downloads INT DEFAULT 0,
  "uploadedAt" TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Marketplace Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  "creatorId" TEXT,
  "creatorName" TEXT,
  rating NUMERIC DEFAULT 5.0,
  "salesCount" INT DEFAULT 0,
  "previewUrl" TEXT,
  description TEXT,
  "affiliateCommission" NUMERIC DEFAULT 10,
  "isDigital" BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Game Scores Table
CREATE TABLE IF NOT EXISTS public.game_scores (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_name TEXT,
  player_handle TEXT,
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON public.game_scores(game_id, score DESC);

-- Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Apply Secure RLS Policies
DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access posts" ON public.posts;
CREATE POLICY "Public access posts" ON public.posts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access clips" ON public.clips;
CREATE POLICY "Public access clips" ON public.clips FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Chat participants can view their messages" ON public.direct_messages;
CREATE POLICY "Chat participants can view their messages" ON public.direct_messages
FOR ALL TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Public access audio" ON public.audio_tracks;
CREATE POLICY "Public access audio" ON public.audio_tracks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access films" ON public.films;
CREATE POLICY "Public access films" ON public.films FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access roms" ON public.roms;
CREATE POLICY "Public access roms" ON public.roms FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access files" ON public.files;
CREATE POLICY "Public access files" ON public.files FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access products" ON public.products;
CREATE POLICY "Public access products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access game_scores" ON public.game_scores;
CREATE POLICY "Public access game_scores" ON public.game_scores FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant API permissions
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.posts TO anon, authenticated;
GRANT ALL ON TABLE public.clips TO anon, authenticated;
GRANT ALL ON TABLE public.direct_messages TO anon, authenticated;
GRANT ALL ON TABLE public.audio_tracks TO anon, authenticated;
GRANT ALL ON TABLE public.films TO anon, authenticated;
GRANT ALL ON TABLE public.roms TO anon, authenticated;
GRANT ALL ON TABLE public.files TO anon, authenticated;
GRANT ALL ON TABLE public.products TO anon, authenticated;
GRANT ALL ON TABLE public.game_scores TO anon, authenticated;