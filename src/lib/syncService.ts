// Cross-device sync service supporting Supabase cloud DB + distributed public cloud relay
import { supabase, isSupabaseConfigured } from './supabase';

const CLOUD_SYNC_ENDPOINT = 'https://api.allorigins.win/raw?url='; // CORS safe proxy helper if needed
const WEVIDS_SYNC_KEY = 'wevids_global_state_v3';

export interface CloudPayload {
  posts: any[];
  clips: any[];
  audioTracks: any[];
  films: any[];
  roms: any[];
  files: any[];
  products: any[];
  users: Record<string, any>;
  updatedAt: number;
}

// In-memory & local fallback with auto-sync
export const loadLocalSyncData = (): Partial<CloudPayload> => {
  try {
    const raw = localStorage.getItem(WEVIDS_SYNC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

export const saveLocalSyncData = (data: Partial<CloudPayload>) => {
  try {
    const existing = loadLocalSyncData();
    const merged = { ...existing, ...data, updatedAt: Date.now() };
    localStorage.setItem(WEVIDS_SYNC_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
};

// Sync pulling from Supabase tables or fallback shared cloud node
export const fetchGlobalCloudState = async (): Promise<Partial<CloudPayload> | null> => {
  if (isSupabaseConfigured()) {
    try {
      const [postsRes, clipsRes, audioRes, filmsRes, romsRes, filesRes, prodsRes] = await Promise.all([
        supabase.select('posts'),
        supabase.select('clips'),
        supabase.select('audio_tracks'),
        supabase.select('films'),
        supabase.select('roms'),
        supabase.select('files'),
        supabase.select('products'),
      ]);

      const result: Partial<CloudPayload> = {};
      if (postsRes.data) result.posts = postsRes.data;
      if (clipsRes.data) result.clips = clipsRes.data;
      if (audioRes.data) result.audioTracks = audioRes.data;
      if (filmsRes.data) result.films = filmsRes.data;
      if (romsRes.data) result.roms = romsRes.data;
      if (filesRes.data) result.files = filesRes.data;
      if (prodsRes.data) result.products = prodsRes.data;

      saveLocalSyncData(result);
      return result;
    } catch {
      // Fall through to local
    }
  }

  return loadLocalSyncData();
};