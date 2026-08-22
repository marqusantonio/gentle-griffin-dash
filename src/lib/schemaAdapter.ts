/**
 * Direct post adapter for Supabase.
 * Passes all verified columns directly to the PostgREST API without stripping.
 */
export const sanitizePostForSchema = async (post: Record<string, any>): Promise<Record<string, any>> => {
  return {
    id: post.id,
    userId: post.userId,
    authorName: post.authorName,
    authorHandle: post.authorHandle,
    authorAvatar: post.authorAvatar,
    authorColor: post.authorColor,
    location: post.location,
    time: post.time,
    content: post.content,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    likes: post.likes || 0,
    dislikes: post.dislikes || 0,
    shares: post.shares || 0,
    tags: post.tags || [],
    comments: post.comments || [],
    created_at: post.created_at || new Date().toISOString()
  };
};

export const clearPostsSchemaCache = () => {
  // No-op - direct insertion enabled
};