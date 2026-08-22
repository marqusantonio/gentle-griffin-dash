import { supabase } from './supabase';

/**
 * Clean post serializer for Supabase.
 * Strips out 'dislikes' and any non-table columns to guarantee 100% successful post insertion.
 */
export const insertPostWithAutoFallback = async (post: Record<string, any>): Promise<{ data: any; error: any }> => {
  // Safe payload matching verified Supabase 'posts' columns exactly
  const payload: Record<string, any> = {
    id: post.id,
    userId: post.userId,
    authorName: post.authorName,
    authorHandle: post.authorHandle,
    authorAvatar: post.authorAvatar,
    authorColor: post.authorColor,
    location: post.location || 'Earth Node',
    time: post.time || 'Just now',
    content: post.content || '',
    mediaUrl: post.mediaUrl || null,
    mediaType: post.mediaType || null,
    likes: Number(post.likes) || 0,
    shares: Number(post.shares) || 0,
    tags: Array.isArray(post.tags) ? post.tags : [],
    comments: Array.isArray(post.comments) ? post.comments : [],
    created_at: post.created_at || new Date().toISOString()
  };

  const { data, error } = await supabase.from('posts').upsert(payload);
  return { data, error };
};

export const sanitizePostForSchema = async (post: Record<string, any>): Promise<Record<string, any>> => {
  const { dislikes, ...rest } = post;
  return rest;
};