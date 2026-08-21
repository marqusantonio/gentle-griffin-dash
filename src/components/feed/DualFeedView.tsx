import React, { useState, useEffect, useCallback } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles,
  CheckCircle2,
  Film,
  Radio,
  Trash2,
  Send,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from './CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { supabase, isSupabaseConfigured, checkContentModeration } from '../../lib/supabase';
import { PostItem } from '../../types/wevids';
import { toast } from 'sonner';

export const DualFeedView: React.FC = () => {
  const { 
    allUsers, 
    currentUser, 
    openShareModal, 
    openUserProfileModal,
  } = useWevids();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [composerTarget, setComposerTarget] = useState<'feed' | 'clips'>('feed');
  const [quickInputText, setQuickInputText] = useState('');
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);

  // 1. Fetch posts directly from Supabase
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts from Supabase:', error);
      } else if (data) {
        setPosts(data as PostItem[]);
      }
    } catch (err) {
      console.error('Network error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 2. Real-time Supabase postgres_changes channel listener
  useEffect(() => {
    const channel = supabase
      .channel('realtime-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload: any) => {
          const eventType = payload.eventType || payload.event;
          
          if (eventType === 'INSERT' && payload.new) {
            sounds.pop();
            setPosts((prev) => {
              // Avoid duplicate if already inserted optimistically
              if (prev.some((p) => p.id === payload.new.id)) return prev;
              return [payload.new as PostItem, ...prev];
            });
          } else if (eventType === 'DELETE' && payload.old) {
            setPosts((prev) => prev.filter((post) => post.id !== payload.old.id));
          } else if (eventType === 'UPDATE' && payload.new) {
            setPosts((prev) =>
              prev.map((post) =>
                post.id === payload.new.id ? { ...post, ...(payload.new as PostItem) } : post
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const topics = ['All', '#WEVIDS', '#Tech', '#CustomROM', '#Anime', '#Gaming', '#Cyberpunk', '#Music'];

  const filteredPosts = posts.filter((p) => {
    if (selectedTopic === 'All') return true;
    return (p.tags || []).some((t) => t.toLowerCase() === selectedTopic.toLowerCase());
  });

  const handleOpenComposer = (target: 'feed' | 'clips' = 'feed') => {
    sounds.pop();
    setComposerTarget(target);
    setIsCreatePostOpen(true);
  };

  // 3. Direct insert to Supabase for quick post
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInputText.trim() || isSubmitting) return;

    const content = quickInputText.trim();
    const moderation = checkContentModeration(content);
    if (moderation.flagged) {
      toast.error(moderation.reason || 'Post violates community guidelines.');
      return;
    }

    const newPost: PostItem = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Creator',
      authorHandle: currentUser?.handle || '@creator',
      authorAvatar: currentUser?.avatar || 'C',
      authorColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
      location: currentUser?.location || 'Earth Node',
      time: 'Just now',
      content,
      likes: 0,
      dislikes: 0,
      shares: 0,
      comments: [],
      tags: ['#WEVIDS'],
      created_at: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert([newPost]);
      if (error) {
        toast.error(`Failed to publish: ${error}`);
      } else {
        sounds.success();
        setQuickInputText('');
        toast.success('Post published directly to Supabase!');
        // Optimistic UI update
        setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct delete in Supabase
  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post from Supabase?')) return;
    
    sounds.pop();
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) {
        toast.error(`Delete failed: ${error}`);
        fetchPosts();
      } else {
        toast.success('Post deleted from Supabase.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  // Direct toggle like in Supabase
  const handleToggleLike = async (post: PostItem) => {
    sounds.like();
    const newLiked = !post.isLiked;
    const newLikesCount = newLiked ? (Number(post.likes) || 0) + 1 : Math.max(0, (Number(post.likes) || 1) - 1);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, isLiked: newLiked, likes: newLikesCount } : p
      )
    );

    try {
      await supabase
        .from('posts')
        .update({ likes: newLikesCount })
        .eq('id', post.id);
    } catch {
      // Safe offline
    }
  };

  // Direct comment in Supabase
  const handleAddComment = async (postId: string, commentData: any) => {
    sounds.pop();
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const newComment = {
      id: `c-${Date.now()}`,
      user: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userColor: currentUser.color,
      text: commentData.text,
      media: commentData.media,
      mediaType: commentData.mediaType,
      timestamp: 'Just now',
      likes: 0
    };

    const updatedComments = [newComment, ...(post.comments || [])];
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: updatedComments } : p))
    );

    try {
      await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);
      toast.success('Comment saved!');
    } catch (err) {
      console.error('Failed to save comment to Supabase:', err);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#00e5ff]" />
            <span>REAL-TIME SUPABASE POSTS STREAM</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Community Feed
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Connected directly to Supabase Postgres with instant live change listeners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPosts()}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#00e5ff] transition-colors"
            title="Refresh Feed from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenComposer('clips')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-orbitron font-bold text-xs transition-colors"
          >
            <Film className="w-3.5 h-3.5 text-[#00e5ff]" />
            <span>NEW CLIP</span>
          </button>

          <button
            onClick={() => handleOpenComposer('feed')}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE POST</span>
          </button>
        </div>
      </div>

      {/* In-Feed Quick Composer Input Bar */}
      <form 
        onSubmit={handleQuickSubmit}
        className="liquid-glass-card rounded-2xl p-3 sm:p-4 border border-white/10 flex items-center justify-between gap-3 shadow-md focus-within:border-[#00e5ff]/60 transition-all"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md flex-shrink-0"
          style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
        >
          {currentUser?.avatar || 'U'}
        </div>

        <input
          type="text"
          value={quickInputText}
          onChange={(e) => setQuickInputText(e.target.value)}
          placeholder={`Share a thought with Supabase, ${currentUser?.name || 'creator'}...`}
          className="flex-1 bg-transparent text-xs text-white placeholder-[#8a8aa8] focus:outline-none py-1"
        />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenComposer('feed')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#fbbf24] transition-colors"
            title="Attach Media / Details"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => handleOpenComposer('clips')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#00e5ff] transition-colors"
            title="Upload Clip"
          >
            <VideoIcon className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!quickInputText.trim() || isSubmitting}
            className="p-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold hover:scale-105 transition-transform disabled:opacity-40 flex items-center justify-center"
            title="Publish"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Topic Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => {
              sounds.click();
              setSelectedTopic(t);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTopic === t
                ? 'bg-[#ff2d95] text-slate-900 shadow-[0_0_12px_rgba(255,45,149,0.5)] font-bold'
                : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Live Feed Stream */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="liquid-glass rounded-3xl p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin mx-auto" />
            <p className="text-xs text-[#8a8aa8]">Loading live feed from Supabase...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-10 border border-white/10 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#ff2d95]/15 border border-[#ff2d95]/30 flex items-center justify-center mx-auto text-[#ff2d95]">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-orbitron font-bold text-lg text-white">No posts in Supabase yet</h3>
              <p className="text-xs text-[#8a8aa8] max-w-sm mx-auto">
                Publish the first post to insert directly to your Supabase `posts` table.
              </p>
            </div>
            <button
              onClick={() => handleOpenComposer('feed')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>PUBLISH LIVE POST</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const author = allUsers[post.userId] || {
              name: post.authorName,
              handle: post.authorHandle,
              avatar: post.authorAvatar,
              color: post.authorColor,
              location: post.location,
              verified: true,
              id: post.userId
            };

            const isAuthor = post.userId === currentUser.id;
            const areCommentsOpen = openCommentsPostId === post.id;

            return (
              <div
                key={post.id}
                className="liquid-glass rounded-3xl p-5 sm:p-6 border border-white/15 shadow-2xl space-y-4 hover:border-white/25 transition-all"
              >
                {/* Author Info & Creator Delete Option */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => openUserProfileModal(author as any)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md group-hover:scale-105 transition-transform"
                      style={{ background: post.authorColor || 'linear-gradient(135deg, #00e5ff, #ff2d95)' }}
                    >
                      {post.authorAvatar || post.authorName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1 group-hover:text-[#00e5ff]">
                        {post.authorName}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />
                      </div>
                      <div className="text-[11px] text-[#8a8aa8]">{post.authorHandle} · {post.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8a8aa8] hidden sm:inline">{post.location}</span>
                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                        title="Delete Your Post in Supabase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-[#e8e8f4] leading-relaxed whitespace-pre-line">{post.content}</p>

                {/* Uploaded Media */}
                {post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black max-h-[420px] flex items-center justify-center">
                    {post.mediaType === 'video' ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full h-full object-cover max-h-[420px]"
                      />
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full h-full object-cover max-h-[420px]"
                      />
                    )}
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tg, idx) => (
                      <span key={idx} className="text-xs text-[#00e5ff] font-semibold bg-[#00e5ff]/10 px-2.5 py-0.5 rounded-full border border-[#00e5ff]/20">
                        {tg}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#8a8aa8]">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(post)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.isLiked ? 'text-[#ff2d95] font-bold' : 'hover:text-[#ff2d95]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current text-[#ff2d95]' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>

                    <button 
                      onClick={() => {
                        sounds.click();
                        setOpenCommentsPostId(areCommentsOpen ? null : post.id);
                      }}
                      className="flex items-center gap-1.5 hover:text-[#00e5ff] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                      <span className="font-bold">{post.comments?.length || 0}</span>
                    </button>

                    <button
                      onClick={() => openShareModal(post.content, `https://wevids.app/post/${post.id}`)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Comments Stream */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5 max-h-48 overflow-y-auto pr-1">
                    {post.comments.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-slate-900 font-bold"
                              style={{ background: c.userColor || '#00e5ff' }}
                            >
                              {c.userAvatar || 'U'}
                            </span>
                            {c.userName}
                          </span>
                          <span className="text-[10px] text-[#8a8aa8]">{c.timestamp}</span>
                        </div>
                        <p className="text-[#e8e8f4] pl-5">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rich Comment Input */}
                <div className="pt-2">
                  <RichCommentInput
                    onSend={(commentData) => {
                      handleAddComment(post.id, commentData);
                    }}
                    placeholder="Write a comment..."
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => {
          setIsCreatePostOpen(false);
          fetchPosts();
        }}
        defaultTarget={composerTarget}
      />
    </div>
  );
};