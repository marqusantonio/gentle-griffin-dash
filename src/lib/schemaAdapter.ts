import { supabase } from './supabase';

/**
 * Clean post serializer for Supabase that matches the existing table schema.
 * Prevents text-only posts from receiving dummy video URLs.
 */
export const insertPostWithAutoFallback = async (post: Record<string, any>): Promise<{ data: any; error: any }> => {
  const isVideo = post.mediaType === 'video' && Boolean(post.mediaUrl || post.video_url);
  const isImage = post.mediaType === 'image' && Boolean(post.mediaUrl);

  const payload: Record<string, any> = {
    content: post.content || post.caption || '',
    caption: post.caption || post.content || '',
    title: post.title || post.content?.slice(0, 60) || 'Post',
    authorName: post.authorName || 'Creator',
    authorHandle: post.authorHandle || '@creator',
    authorAvatar: post.authorAvatar || 'C',
    authorColor: post.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    userId: post.userId || post.user_id || 'guest',
    mediaUrl: post.mediaUrl || null,
    mediaType: isVideo ? 'video' : isImage ? 'image' : null,
    video_url: isVideo ? (post.video_url || post.mediaUrl) : null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    comments: Array.isArray(post.comments) ? post.comments : []
  };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post.id);
  if (isUuid) {
    payload.id = post.id;
  }

  let { data, error } = await supabase.from('posts').insert(payload);
  
  if (error && (error.message?.includes('schema cache') || error.message?.includes('column') || error.message?.includes('does not exist'))) {
    // Retry with minimal payload if schema cache is lagging
    const minimalPayload = {
      content: payload.content,
      authorName: payload.authorName,
      authorHandle: payload.authorHandle,
      userId: payload.userId,
      mediaUrl: payload.mediaUrl
    };
    const retry = await supabase.from('posts').insert(minimalPayload);
    data = retry.data;
    error = retry.error;
  }

  return { data, error };
};

export const sanitizePostForSchema = async (post: Record<string, any>): Promise<Record<string, any>> => {
  const { dislikes, likes, shares, ...rest } = post;
  return rest;
};