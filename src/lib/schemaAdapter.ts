import { supabase } from '../integrations/supabase/client';

export const isUuid = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Clean post serializer for Supabase that matches the existing table schema.
 * Prevents invalid UUID syntax errors and satisfies the non-null video_url constraint.
 */
export const insertPostWithAutoFallback = async (post: Record<string, any>): Promise<{ data: any; error: any }> => {
  const isVideo = post.mediaType === 'video' || Boolean(post.video_url || (post.mediaUrl && (post.mediaUrl.endsWith('.mp4') || post.mediaUrl.startsWith('data:video'))));
  const isImage = post.mediaType === 'image' || Boolean(post.mediaUrl && !isVideo);

  const videoValue = isVideo ? (post.video_url || post.mediaUrl || '') : '';
  const mediaValue = post.mediaUrl || (isVideo ? videoValue : null);

  const payload: Record<string, any> = {
    content: post.content || post.caption || '',
    caption: post.caption || post.content || '',
    title: post.title || post.content?.slice(0, 60) || 'Post',
    authorName: post.authorName || 'Creator',
    authorHandle: post.authorHandle || '@creator',
    authorAvatar: post.authorAvatar || 'C',
    authorColor: post.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    userId: post.userId || post.user_id || 'guest',
    mediaUrl: mediaValue,
    mediaType: isVideo ? 'video' : isImage ? 'image' : null,
    // Satisfy PostgreSQL NOT NULL constraint on video_url column
    video_url: videoValue || 'none',
    likes: Number(post.likes) || 0,
    dislikes: Number(post.dislikes) || 0,
    shares: Number(post.shares) || 0,
    tags: Array.isArray(post.tags) ? post.tags : [],
    comments: Array.isArray(post.comments) ? post.comments : []
  };

  // Only pass id if it's a valid UUID; otherwise let postgres gen_random_uuid() handle it
  if (post.id && isUuid(post.id)) {
    payload.id = post.id;
  }

  const { data, error } = await supabase.from('posts').insert([payload]).select();

  return { data, error };
};

export const sanitizePostForSchema = async (post: Record<string, any>): Promise<Record<string, any>> => {
  const { dislikes, likes, shares, ...rest } = post;
  return rest;
};