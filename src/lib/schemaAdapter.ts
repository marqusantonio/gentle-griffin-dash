import { getSupabaseConfig } from './supabase';

export interface PostsSchemaColumns {
  avatar: boolean;
  color: boolean;
}

let postsSchemaCache: PostsSchemaColumns | null = null;
let schemaInFlight: Promise<PostsSchemaColumns> | null = null;

const checkColumn = async (url: string, key: string, column: string): Promise<boolean> => {
  try {
    const res = await fetch(
      `${url}/rest/v1/posts?select=${encodeURIComponent(`id, "${column}"`)}&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Automatically detects whether the Supabase `posts` table contains
 * `authorAvatar` and `authorColor`. Cached for 60 seconds, then re-checks
 * so the app dynamically adapts without restart.
 */
export const detectPostsSchemaColumns = async (): Promise<PostsSchemaColumns> => {
  if (postsSchemaCache) return postsSchemaCache;
  if (schemaInFlight) return schemaInFlight;

  const config = getSupabaseConfig();

  const check = async (): Promise<PostsSchemaColumns> => {
    if (!config.url || !config.anonKey) {
      return { avatar: false, color: false };
    }

    const [avatar, color] = await Promise.all([
      checkColumn(config.url, config.anonKey, 'authorAvatar'),
      checkColumn(config.url, config.anonKey, 'authorColor'),
    ]);

    const result: PostsSchemaColumns = { avatar, color };
    postsSchemaCache = result;

    setTimeout(() => {
      postsSchemaCache = null;
    }, 60000);

    return result;
  };

  schemaInFlight = check();
  try {
    return await schemaInFlight;
  } finally {
    schemaInFlight = null;
  }
};

/**
 * Removes any fields from the post payload that don't exist yet in the database schema.
 */
export const sanitizePostForSchema = async (post: Record<string, any>): Promise<Record<string, any>> => {
  const safePost = { ...post };

  try {
    const columns = await detectPostsSchemaColumns();

    if (!columns.avatar) {
      delete safePost.authorAvatar;
    }
    if (!columns.color) {
      delete safePost.authorColor;
    }
  } catch {
    // If detection fails, pass payload through safely
  }

  return safePost;
};

export const clearPostsSchemaCache = () => {
  postsSchemaCache = null;
};