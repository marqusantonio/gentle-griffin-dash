import { supabase, isSupabaseConfigured } from './supabase';

const WEVIDS_LOCAL_KEY = 'wevids_global_state_v3';

export interface GlobalCloudState {
  posts: any[];
  clips: any[];
  audioTracks: any[];
  films: any[];
  roms: any[];
  files: any[];
  products: any[];
  updatedAt: number;
}

export const loadLocalSyncData = (): Partial<GlobalCloudState> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WEVIDS_LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
};

export const saveLocalSyncData = (data: Partial<GlobalCloudState>) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadLocalSyncData();
    const merged = { ...existing, ...data, updatedAt: Date.now() };
    localStorage.setItem(WEVIDS_LOCAL_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
};

export const fetchGlobalCloudState = async (): Promise<Partial<GlobalCloudState> | null> => {
  if (isSupabaseConfigured()) {
    try {
      const [postsRes, clipsRes, audioRes, filmsRes, romsRes, filesRes, prodsRes] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('clips').select('*').order('created_at', { ascending: false }),
        supabase.from('audio_tracks').select('*').order('created_at', { ascending: false }),
        supabase.from('films').select('*').order('created_at', { ascending: false }),
        supabase.from('roms').select('*').order('created_at', { ascending: false }),
        supabase.from('files').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
      ]);

      const result: Partial<GlobalCloudState> = {};
      if (postsRes.data && postsRes.data.length > 0) result.posts = postsRes.data;
      if (clipsRes.data && clipsRes.data.length > 0) result.clips = clipsRes.data;
      if (audioRes.data && audioRes.data.length > 0) result.audioTracks = audioRes.data;
      if (filmsRes.data && filmsRes.data.length > 0) result.films = filmsRes.data;
      if (romsRes.data && romsRes.data.length > 0) result.roms = romsRes.data;
      if (filesRes.data && filesRes.data.length > 0) result.files = filesRes.data;
      if (prodsRes.data && prodsRes.data.length > 0) result.products = prodsRes.data;

      if (Object.keys(result).length > 0) {
        saveLocalSyncData(result);
        return result;
      }
    } catch {
      // Fallback to local storage cache
    }
  }

  return loadLocalSyncData();
};

export const pushGlobalCloudState = async (stateToPush: Partial<GlobalCloudState>): Promise<void> => {
  saveLocalSyncData(stateToPush);

  if (isSupabaseConfigured()) {
    try {
      if (stateToPush.posts && stateToPush.posts.length > 0) {
        await supabase.from('posts').upsert(stateToPush.posts);
      }
      if (stateToPush.clips && stateToPush.clips.length > 0) {
        await supabase.from('clips').upsert(stateToPush.clips);
      }
    } catch {
      // Safe offline
    }
  }
};