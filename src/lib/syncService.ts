import { supabase, isSupabaseConfigured } from './supabase';

const WEVIDS_LOCAL_KEY = 'wevids_global_state_v3';
const CLOUD_SYNC_URL = 'https://kvdb.io/6P4kYfU7p3N2m8Z4x1W9q/wevids_shared_feed_v3';

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

// Multi-tab local broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('wevids_sync_channel');
  } catch {
    // safe fallback
  }
}

// Local storage caching
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
    broadcastChannel?.postMessage({ type: 'LOCAL_SYNC_UPDATE', data: merged });
  } catch {
    // ignore
  }
};

// Fetch from cloud relay with timeout & multi-provider fallback
export const fetchGlobalCloudState = async (): Promise<Partial<GlobalCloudState> | null> => {
  // 1. If Supabase is connected by user, fetch from database tables
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
      // Fall through to public cloud relay
    }
  }

  // 2. Fetch from Zero-Config Global Cloud Relay
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${CLOUD_SYNC_URL}?t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const cloudData: GlobalCloudState = await res.json();
      if (cloudData && typeof cloudData === 'object') {
        const local = loadLocalSyncData();
        // Merge cloud with any local items
        const merged: GlobalCloudState = {
          posts: mergeUnique(cloudData.posts || [], local.posts || []),
          clips: mergeUnique(cloudData.clips || [], local.clips || []),
          audioTracks: mergeUnique(cloudData.audioTracks || [], local.audioTracks || []),
          films: mergeUnique(cloudData.films || [], local.films || []),
          roms: mergeUnique(cloudData.roms || [], local.roms || []),
          files: mergeUnique(cloudData.files || [], local.files || []),
          products: mergeUnique(cloudData.products || [], local.products || []),
          updatedAt: Math.max(cloudData.updatedAt || 0, local.updatedAt || 0)
        };
        saveLocalSyncData(merged);
        return merged;
      }
    }
  } catch {
    // Network retry or offline
  }

  return loadLocalSyncData();
};

// Push full state to Zero-Config Global Cloud Relay
export const pushGlobalCloudState = async (stateToPush: Partial<GlobalCloudState>): Promise<void> => {
  saveLocalSyncData(stateToPush);

  try {
    const existing = loadLocalSyncData();
    const payload: GlobalCloudState = {
      posts: stateToPush.posts || existing.posts || [],
      clips: stateToPush.clips || existing.clips || [],
      audioTracks: stateToPush.audioTracks || existing.audioTracks || [],
      films: stateToPush.films || existing.films || [],
      roms: stateToPush.roms || existing.roms || [],
      files: stateToPush.files || existing.files || [],
      products: stateToPush.products || existing.products || [],
      updatedAt: Date.now()
    };

    // Push to public cloud relay
    fetch(CLOUD_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {
    // Safe offline
  }
};

// Helper: merge arrays of objects uniquely by .id
function mergeUnique(primary: any[], secondary: any[]): any[] {
  const map = new Map<string, any>();
  [...secondary, ...primary].forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}