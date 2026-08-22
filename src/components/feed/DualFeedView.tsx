import React, { useState, useEffect, useCallback } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Film,
  RefreshCw,
  Loader2,
  Trash2,
  Play,
  Pause,
  ChevronUp
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from './CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { supabase, checkContentModeration } from '../../lib/supabase';
import { PostItem, ShortClipItem } from '../../types/wevids';
import { getErrorMessage } from '../../lib/errorUtils';
import { toast } from 'sonner';

interface CommentItem {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string;
  authorColor: string;
  text: string;
  created_at: string;
  likes: number;
  replies: CommentItem[];
}

export const DualFeedView: React.FC = () => {
  const { currentUser, setActiveView } = useWevids();

  const [activeTab, setActiveTab] = useState<'feed' | 'clips'>('feed');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [clips, setClips] = useState<ShortClipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: postsData, error: postsError }, { data: clipsData, error: clipsError }] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('clips').select('*').order('created_at', { ascending: false })
      ]);

      if (postsError) {
        toast.error(`Error loading posts: ${getErrorMessage(postsError)}`);
      } else if (postsData) {
        setPosts(postsData as PostItem[]);
      }

      if (clipsError) {
        toast.error(`Error loading clips: ${getErrorMessage(clipsError)}`);
      } else if (clipsData) {
        setClips(clipsData as ShortClipItem[]);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    sounds.click();
    fetchFeed();
  };

  const handleLikePost = async (postId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const newLikes = targetPost.likes + 1;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    sounds.pop();

    try {
      const { error } = await supabase
        .from('posts')
        .update({ likes: newLikes })
        .eq('id', postId);
      if (error) toast.error(`Error updating likes: ${getErrorMessage(error)}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleLikeClip = async (clipId: string) => {
    const targetClip = clips.find(c => c.id === clipId);
    if (!targetClip) return;

    const newLikes = targetClip.likes + 1;
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, likes: newLikes } : c));
    sounds.pop();

    try {
      const { error } = await supabase
        .from('clips')
        .update({ likes: newLikes })
        .eq('id', clipId);
      if (error) toast.error(`Error updating likes: ${getErrorMessage(error)}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSharePost = async (postId: string) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const newShares = targetPost.shares + 1;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares: newShares } : p));
    sounds.success();

    try {
      const { error } = await supabase
        .from('posts')
        .update({ shares: newShares })
        .eq('id', postId);
      if (error) toast.error(`Error updating shares: ${getErrorMessage(error)}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${targetPost.authorName}'s post on WEVIDS`,
          text: targetPost.content || 'Check out this post!',
          url: window.location.href
        });
      } catch {
        // user cancelled share sheet - ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Post link copied to clipboard!');
      } catch {
        toast.error('Unable to copy link');
      }
    }
  };

  const handleShareClip = async (clipId: string) => {
    const targetClip = clips.find(c => c.id === clipId);
    if (!targetClip) return;

    const newShares = targetClip.shares + 1;
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, shares: newShares } : c));
    sounds.success();

    try {
      const { error } = await supabase
        .from('clips')
        .update({ shares: newShares })
        .eq('id', clipId);
      if (error) toast.error(`Error updating shares: ${getErrorMessage(error)}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${targetClip.title} on WEVIDS`,
          text: targetClip.description || 'Check out this clip!',
          url: window.location.href
        });
      } catch {
        // user cancelled - ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Clip link copied to clipboard!');
      } catch {
        toast.error('Unable to copy link');
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast.error(`Error deleting post: ${getErrorMessage(error)}`);
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== postId));
    sounds.pop();
    toast.success('Post deleted');
  };

  const handleDeleteClip = async (clipId: string) => {
    const { error } = await supabase.from('clips').delete().eq('id', clipId);
    if (error) {
      toast.error(`Error deleting clip: ${getErrorMessage(error)}`);
      return;
    }
    setClips(prev => prev.filter(c => c.id !== clipId));
    sounds.pop();
    toast.success('Clip deleted');
  };

  const handleToggleComments = (postId: string) => {
    sounds.click();
    setExpandedComments(prev => prev === postId ? null : postId);
  };

  const handleSubmitComment = async (postId: string, text: string) => {
    if (!text.trim()) return;

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Creator',
      authorAvatar: currentUser?.avatar || 'C',
      authorColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
      text: text.trim(),
      created_at: new Date().toISOString(),
      likes: 0,
      replies: []
    };

    const updatedComments = [...(targetPost.comments || []), newComment];
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
    sounds.success();

    try {
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);
      if (error) toast.error(`Error saving comment: ${getErrorMessage(error)}`);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleClipPlay = (clipId: string) => {
    setPlayingClipId(prev => prev === clipId ? null : clipId);
  };

  const isOwnPost = (post: PostItem) => {
    return currentUser?.id === post.userId || (!currentUser && post.userId === 'guest');
  };

  const isOwnClip = (clip: ShortClipItem) => {
    return currentUser?.id === clip.userId || (!currentUser && clip.userId === 'guest');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header / Tab Bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex-1 grid grid-cols-2 gap-1.5 rounded-2xl bg-white/5 border border-white/10 p-1.5">
          <button
            onClick={() => { sounds.click(); setActiveTab('feed'); }}
            className={`px-3 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            COMMUNITY FEED
          </button>
          <button
            onClick={() => { sounds.click(); setActiveTab('clips'); }}
            className={`px-3 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'clips'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            SHORTS CLIPS
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#8a8aa8] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { sounds.click(); setIsCreateOpen(true); }}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">CREATE</span>
          </button>
        </div>
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin" />
          <p className="text-xs text-[#8a8aa8] font-orbitron">LOADING {activeTab === 'feed' ? 'COMMUNITY' : 'CLIPS'}...</p>
        </div>
      ) : activeTab === 'feed' ? (
        posts.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl">📡</div>
            <h3 className="font-orbitron font-bold text-white text-lg">NO POSTS YET</h3>
            <p className="text-sm text-[#8a8aa8] max-w-xs mx-auto">
              Be the first to share what you built, discovered, or played today!
            </p>
            <button
              onClick={() => { sounds.click(); setIsCreateOpen(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              CREATE FIRST POST
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <article
                key={post.id}
                className="rounded-3xl bg-[#161632]/80 border border-white/10 backdrop-blur-xl overflow-hidden hover:border-[#00e5ff]/30 transition-colors"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md shrink-0"
                      style={{ background: post.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                    >
                      {post.authorAvatar || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate">{post.authorName}</span>
                        <span className="text-[#00e5ff] text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 shrink-0">
                          WEVIDS
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8a8aa8] truncate">
                        {post.location ? `${post.location} · ` : ''}{post.time}
                      </div>
                    </div>
                  </div>

                  {isOwnPost(post) && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 rounded-lg text-[#8a8aa8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-[#ff2d95]/10 border border-[#ff2d95]/20 text-[11px] font-bold text-[#ff8ac2]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Media */}
                {post.mediaUrl && (
                  <div className="px-4 pb-3">
                    {post.mediaType === 'image' ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full max-h-96 object-cover rounded-2xl border border-white/10"
                      />
                    ) : (
                      <video
                        src={post.mediaUrl}
                        controls
                        loop
                        className="w-full max-h-96 object-cover rounded-2xl border border-white/10 bg-black"
                      />
                    )}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-1 px-4 pb-3 pt-1 border-t border-white/5">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#8a8aa8] hover:text-[#ff2d95] hover:bg-[#ff2d95]/10 transition-all group"
                  >
                    <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{post.likes}</span>
                  </button>

                  <button
                    onClick={() => handleToggleComments(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#8a8aa8] hover:text-[#00e5ff] hover:bg-[#00e5ff]/10 transition-all group"
                  >
                    <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{post.comments?.length || 0}</span>
                  </button>

                  <button
                    onClick={() => handleSharePost(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#8a8aa8] hover:text-white hover:bg-white/10 transition-all group"
                  >
                    <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{post.shares}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedComments === post.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3 bg-black/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider">
                        {post.comments?.length || 0} COMMENTS
                      </span>
                      <button
                        onClick={() => setExpandedComments(null)}
                        className="p-1 rounded-lg text-[#8a8aa8] hover:text-white transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Existing Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {post.comments.map((comment: any) => (
                          <div key={comment.id} className="flex items-start gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-slate-900 shrink-0"
                              style={{ background: comment.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                            >
                              {comment.authorAvatar || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="rounded-2xl bg-white/5 border border-white/5 px-3 py-2">
                                <span className="text-xs font-bold text-white">{comment.authorName}</span>
                                <p className="text-xs text-white/80 mt-0.5 whitespace-pre-wrap">{comment.text}</p>
                              </div>
                              <div className="text-[10px] text-[#8a8aa8] mt-1 px-2">
                                {new Date(comment.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="pt-1">
                      <RichCommentInput
                        onSubmit={(text) => handleSubmitComment(post.id, text)}
                        placeholder="Add a comment..."
                        disabled={!currentUser}
                        value={commentDrafts[post.id] || ''}
                        onChange={(val) => setCommentDrafts(prev => ({ ...prev, [post.id]: val }))}
                        submitLabel="POST"
                      />
                      {!currentUser && (
                        <p className="text-[10px] text-[#8a8aa8] mt-1.5">
                          Sign in to comment
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )
      ) : (
        /* Clips / Shorts Tab */
        clips.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="text-5xl">🎬</div>
            <h3 className="font-orbitron font-bold text-white text-lg">NO CLIPS YET</h3>
            <p className="text-sm text-[#8a8aa8] max-w-xs mx-auto">
              Upload your first vertical short clip and share it with the community!
            </p>
            <button
              onClick={() => { sounds.click(); setIsCreateOpen(true); setActiveView('clips'); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              UPLOAD FIRST CLIP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clips.map(clip => (
              <div
                key={clip.id}
                className="rounded-3xl bg-[#161632]/80 border border-white/10 backdrop-blur-xl overflow-hidden hover:border-[#00e5ff]/40 transition-colors group"
              >
                {/* Clip Video */}
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  <video
                    src={clip.videoUrl}
                    loop
                    muted
                    playsInline
                    onClick={() => handleToggleClipPlay(clip.id)}
                    className="w-full h-full object-cover"
                  />

                  {/* Play/Pause Overlay */}
                  <button
                    onClick={() => handleToggleClipPlay(clip.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {playingClipId === clip.id ? (
                      <Pause className="w-12 h-12 text-white drop-shadow-lg" />
                    ) : (
                      <Play className="w-12 h-12 text-white drop-shadow-lg" />
                    )}
                  </button>

                  {/* Clip Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#ff2d95]/30">
                    <Film className="w-3 h-3 text-[#ff2d95]" />
                    <span className="text-[10px] font-bold text-white">SHORT CLIP</span>
                  </div>

                  {/* Audio Track */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                    <svg className="w-3.5 h-3.5 text-[#00e5ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <span className="text-[10px] font-bold text-white truncate">{clip.audioTrack}</span>
                  </div>

                  {/* Delete Own Clip */}
                  {isOwnClip(clip) && (
                    <button
                      onClick={() => handleDeleteClip(clip.id)}
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-red-500/80 text-white backdrop-blur-md transition-colors"
                      title="Delete Clip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Clip Info */}
                <div className="p-3.5 space-y-2">
                  <h3 className="font-bold text-sm text-white leading-snug line-clamp-2">
                    {clip.title}
                  </h3>
                  <p className="text-xs text-[#8a8aa8] line-clamp-2">
                    {clip.description}
                  </p>

                  {/* Clip Stats & Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => handleLikeClip(clip.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#8a8aa8] hover:text-[#ff2d95] hover:bg-[#ff2d95]/10 transition-all group"
                    >
                      <Heart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span>{clip.likes}</span>
                    </button>

                    <button
                      onClick={() => handleShareClip(clip.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#8a8aa8] hover:text-white hover:bg-white/10 transition-all group"
                    >
                      <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span>{clip.shares}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultTarget={activeTab}
      />

      {/* Footer Hint */}
      <div className="text-center py-6">
        <p className="text-[10px] text-[#8a8aa8] font-orbitron tracking-widest">
          ∞ SCROLL FOR MORE · WEVIDS COMMUNITY ∞
        </p>
      </div>
    </div>
  );
};