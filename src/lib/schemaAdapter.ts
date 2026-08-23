import { supabase } from '../integrations/supabase/client';

export const isUuid = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

/**
 * Clean post serializer for Supabase conforming strictly to the table schema.
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
    userId: post.userId || 'guest',
    user_id: isUuid(post.userId) ? post.userId : isUuid(post.user_id) ? post.user_id : null,
    mediaUrl: mediaValue,
    mediaType: isVideo ? 'video' : isImage ? 'image' : null,
    video_url: videoValue || 'none',
    likes: Number(post.likes) || 0,
    dislikes: Number(post.dislikes) || 0,
    shares: Number(post.shares) || 0,
    tags: Array.isArray(post.tags) ? post.tags : [],
    comments: Array.isArray(post.comments) ? post.comments : []
  };

  if (post.id && isUuid(post.id)) {
    payload.id = post.id;
  }

  const { data, error } = await supabase.from('posts').upsert([payload]).select();
  return { data, error };
};

/**
 * Clean short clip serializer for Supabase to prevent unmapped column errors.
 */
export const insertClipWithAutoFallback = async (clip: Record<string, any>): Promise<{ data: any; error: any }> => {
  const videoSrc = clip.videoUrl || clip.video_url || '';

  const payload: Record<string, any> = {
    id: String(clip.id || `clip-${Date.now()}`),
    userId: String(clip.userId || 'guest'),
    title: clip.title || 'Short Clip',
    description: clip.description || '',
    videoUrl: videoSrc,
    video_url: videoSrc,
    audioTrack: clip.audioTrack || 'Original Audio Track',
    likes: Number(clip.likes) || 0,
    dislikes: Number(clip.dislikes) || 0,
    shares: Number(clip.shares) || 0,
    comments: Array.isArray(clip.comments) ? clip.comments : []
  };

  const { data, error } = await supabase.from('clips').upsert([payload]).select();
  return { data, error };
};

export const syncPostCommentsToCloud = async (postId: string, comments: any[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('posts')
      .update({ comments: comments || [] })
      .eq('id', postId);
    return !error;
  } catch {
    return false;
  }
};

export const syncClipCommentsToCloud = async (clipId: string, comments: any[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clips')
      .update({ comments: comments || [] })
      .eq('id', clipId);
    return !error;
  } catch {
    return false;
  }
};