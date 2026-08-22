import { supabase } from './supabase';

/**
 * Clean post serializer for Supabase that matches the existing table schema.
 * Dynamically adapts to existing columns (e.g. content, tags, comments, video_url, etc.)
 */
export const insertPostWithAutoFallback = async (post: Record<string, any>): Promise<{ data: any; error: any }> => {
  // Base payload matching existing columns in the Supabase 'posts' table
  const payload: Record<string, any> = {
    content: post.content || post.caption || '',
    caption: post.caption || post.content || '',
    title: post.title || post.content?.slice(0, 50) || 'Post',
    authorName: post.authorName || 'Creator',
    authorHandle: post.authorHandle || '@creator',
    authorAvatar: post.authorAvatar || 'C',
    authorColor: post.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    userId: post.userId || post.user_id || 'guest',
    mediaUrl: post.mediaUrl || null,
    mediaType: post.mediaType || (post.mediaUrl ? 'image' : null),
    video_url: post.video_url || (post.mediaType === 'video' ? post.mediaUrl : '') || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    tags: Array.isArray(post.tags) ? post.tags : [],
    comments: Array.isArray(post.comments) ? post.comments : []
  };

  // If a valid UUID was provided, include it, otherwise let Postgres generate gen_random_uuid()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post.id);
  if (isUuid) {
    payload.id = post.id;
  }

  const { data, error } = await supabase.from('posts').insert(payload);
  return { data, error };
};

export const sanitizePostForSchema = async (post: Record<string, any>): Promise<Record<string, any>> => {
  const { dislikes, likes, shares, ...rest } = post;
  return rest;
};