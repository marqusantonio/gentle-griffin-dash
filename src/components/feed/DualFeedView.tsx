import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Film, 
  RefreshCw, 
  Loader2, 
  Trash2, 
  Play, 
  Pause, 
  Sparkles, 
  Bookmark, 
  Check, 
  LayoutGrid, 
  Image as ImageIcon,
  Video as VideoIcon,
  Send,
  CornerDownRight
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from './CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { insertPostWithAutoFallback } from '../../lib/schemaAdapter';
import { PostItem, ShortClipItem, CommentItem, CommentReply } from '../../types/wevids';
import { getErrorMessage, isTableOrSchemaMissingError } from '../../lib/errorUtils';
import { toast } from 'sonner';

export const DualFeedView: React.FC = () => {
  const { 
    currentUser, 
    setActiveView, 
    openUserProfileModal, 
    allUsers,
    toggleCommentLike,
    toggleReplyLike,
    addCommentReply
  } = useWevids();

  const [activeTab, setActiveTab] = useState<'feed' | 'clips'>('feed');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [viewDensity, setViewDensity] = useState<'cozy' | 'compact'>('cozy');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [clips, setClips] = useState<ShortClipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Inline Fast Composer State
  const [inlineText, setInlineText] = useState('');
  const [inlineMediaUrl, setInlineMediaUrl] = useState<string | null>(null);
  const [inlineMediaType, setInlineMediaType] = useState<'image' | 'video' | null>(null);
  const [inlineTag, setInlineTag] = useState('#WEVIDS');
  const [isInlinePosting, setIsInlinePosting] = useState(false);

  const inlineImageInputRef = useRef<HTMLInputElement | null>(null);
  const inlineVideoInputRef = useRef<HTMLInputElement | null>(null);

  const quickFilterTags = ['All', '#WEVIDS', '#Tech', '#CustomROM', '#Gaming', '#Anime', '#Cyberpunk', '#AI'];

  const fetchFeed = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        if (!isTableOrSchemaMissingError(postsError) && isManualRefresh) {
          toast.error(`Error loading posts: ${getErrorMessage(postsError)}`);
        }
      } else if (postsData) {
        const normalizedPosts: PostItem[] = postsData.map((p: any) => {
          const hasVideo = p.mediaType === 'video' || Boolean(p.video_url && p.video_url.length > 5);
          const hasImage = p.mediaType === 'image' || Boolean(p.mediaUrl && !p.mediaUrl.endsWith('.mp4') && p.mediaUrl.startsWith('data:image') || (p.mediaUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(p.mediaUrl)));
          
          let mediaUrl: string | undefined = undefined;
          let mediaType: 'image' | 'video' | undefined = undefined;

          if (hasVideo && (p.video_url || p.mediaUrl)) {
            mediaUrl = p.video_url || p.mediaUrl;
            mediaType = 'video';
          } else if (hasImage && p.mediaUrl) {
            mediaUrl = p.mediaUrl;
            mediaType = 'image';
          }

          return {
            id: p.id,
            userId: p.userId || p.user_id || 'guest',
            authorName: p.authorName || 'Creator',
            authorHandle: p.authorHandle || '@creator',
            authorAvatar: p.authorAvatar || 'C',
            authorColor: p.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
            location: p.location || 'Earth Node',
            time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            content: p.content || p.caption || '',
            mediaUrl,
            mediaType,
            likes: Number(p.likes) || 0,
            shares: Number(p.shares) || 0,
            comments: Array.isArray(p.comments) ? p.comments : [],
            tags: Array.isArray(p.tags) ? p.tags : []
          };
        });

        setPosts(normalizedPosts);

        // Filter valid video clips
        const videoClips: ShortClipItem[] = normalizedPosts
          .filter(p => p.mediaType === 'video' && p.mediaUrl)
          .map(p => ({
            id: p.id,
            userId: p.userId,
            title: p.content?.slice(0, 40) || 'Video Clip',
            description: p.content || '',
            videoUrl: p.mediaUrl!,
            audioTrack: 'Original Audio Track',
            likes: p.likes || 0,
            dislikes: 0,
            shares: p.shares || 0,
            comments: p.comments || []
          }));
        setClips(videoClips);
      }
    } catch (err: any) {
      if (isManualRefresh) toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = () => {
    sounds.click();
    fetchFeed(true);
    toast.success('Feed updated!');
  };

  const handleLikePost = (postId: string) => {
    sounds.like();
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (Number(p.likes) || 0) + 1 } : p));
  };

  const handleLikeClip = (clipId: string) => {
    sounds.like();
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, likes: (Number(c.likes) || 0) + 1 } : c));
  };

  const handleBookmark = (postId: string) => {
    sounds.pop();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        toast.info('Removed from bookmarks');
      } else {
        next.add(postId);
        toast.success('Saved to your library vault!');
      }
      return next;
    });
  };

  const handleSharePost = async (post: PostItem) => {
    sounds.success();
    const shareText = `${post.authorName}: "${post.content?.slice(0, 80)}" on WEVIDS`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'WEVIDS Social Post', text: shareText, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      setCopiedPostId(post.id);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopiedPostId(null), 2000);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast.error(`Error: ${getErrorMessage(error)}`);
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== postId));
    sounds.pop();
    toast.success('Post removed');
  };

  const handleToggleComments = (postId: string) => {
    sounds.click();
    setExpandedComments(prev => prev === postId ? null : postId);
  };

  const handleSendComment = async (postId: string, commentData: { text: string; media?: string; mediaType?: 'image' | 'gif' | 'sticker' | 'audio' }) => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const newComment: CommentItem = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Creator',
      userAvatar: currentUser?.avatar || 'C',
      userColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
      text: commentData.text,
      media: commentData.media,
      mediaType: commentData.mediaType,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: []
    };

    const updatedComments = [newComment, ...(targetPost.comments || [])];
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
    sounds.success();

    try {
      await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
    } catch {}
  };

  const handleCommentLikeClick = (postId: string, commentId: string) => {
    sounds.like();
    toggleCommentLike(postId, commentId);

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: (p.comments || []).map(c => {
          if (c.id !== commentId) return c;
          const newLiked = !c.isLiked;
          return {
            ...c,
            isLiked: newLiked,
            likes: newLiked ? (Number(c.likes) || 0) + 1 : Math.max(0, (Number(c.likes) || 1) - 1)
          };
        })
      };
    }));
  };

  const handleReplyLikeClick = (postId: string, commentId: string, replyId: string) => {
    sounds.like();
    toggleReplyLike(postId, commentId, replyId);

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: (p.comments || []).map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            replies: (c.replies || []).map(r => {
              if (r.id !== replyId) return r;
              const newLiked = !r.isLiked;
              return {
                ...r,
                isLiked: newLiked,
                likes: newLiked ? (Number(r.likes) || 0) + 1 : Math.max(0, (Number(r.likes) || 1) - 1)
              };
            })
          };
        })
      };
    }));
  };

  const handleSendReply = async (
    postId: string, 
    commentId: string, 
    replyPayload: { text: string; media?: string; mediaType?: 'image' | 'video' | 'gif' | 'sticker' | 'audio' }
  ) => {
    if (!replyPayload.text.trim() && !replyPayload.media) return;
    sounds.pop();

    await addCommentReply(postId, commentId, replyPayload);

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: (p.comments || []).map(c => {
          if (c.id !== commentId) return c;
          return {
            ...c,
            replies: [
              ...(c.replies || []),
              {
                id: `r-${Date.now()}`,
                user: currentUser?.id || 'guest',
                userName: currentUser?.name || 'Creator',
                userAvatar: currentUser?.avatar || 'C',
                userColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
                text: replyPayload.text,
                media: replyPayload.media,
                mediaType: replyPayload.mediaType,
                timestamp: 'Just now',
                likes: 0
              }
            ]
          };
        })
      };
    }));

    setActiveReplyCommentId(null);
    toast.success('Rich reply published!');
  };

  // Instant Inline Fast Post Submission
  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineText.trim() && !inlineMediaUrl) {
      toast.error('Type a message or attach a photo/video');
      return;
    }

    setIsInlinePosting(true);
    const newPost: PostItem = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: currentUser?.id || 'guest',
      authorName: currentUser?.name || 'Creator',
      authorHandle: currentUser?.handle || '@creator',
      authorAvatar: currentUser?.avatar || 'C',
      authorColor: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
      location: currentUser?.location || 'Earth Node',
      time: 'Just now',
      content: inlineText.trim(),
      mediaUrl: inlineMediaUrl || undefined,
      mediaType: inlineMediaUrl ? (inlineMediaType || 'image') : undefined,
      likes: 0,
      shares: 0,
      comments: [],
      tags: [inlineTag],
      created_at: new Date().toISOString()
    };

    setPosts(prev => [newPost, ...prev]);
    sounds.success();
    toast.success('Post published live!');

    setInlineText('');
    setInlineMediaUrl(null);
    setInlineMediaType(null);
    setIsInlinePosting(false);

    // Async background insertion
    insertPostWithAutoFallback(newPost).catch(err => {
      console.warn('Background insert issue:', err);
    });
  };

  const handleInlineImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setInlineMediaUrl(objectUrl);
    setInlineMediaType('image');
    sounds.pop();
    toast.success('Photo attached');
  };

  const handleInlineVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setInlineMediaUrl(objectUrl);
    setInlineMediaType('video');
    sounds.success();
    toast.success('Video attached');
  };

  const isOwnPost = (post: PostItem) => {
    return currentUser?.id === post.userId || (!currentUser && post.userId === 'guest');
  };

  const filteredPosts = posts.filter(p => {
    if (filterTag === 'All') return true;
    return p.tags?.includes(filterTag) || p.content.toLowerCase().includes(filterTag.toLowerCase());
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-20">
      {/* Tab Switcher & Density Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 grid grid-cols-2 gap-1.5 rounded-2xl bg-white/5 border border-white/10 p-1.5">
          <button
            onClick={() => { sounds.click(); setActiveTab('feed'); }}
            className={`px-3 py-2 rounded-xl text-xs font-orbitron font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'feed'
                ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>COMMUNITY FEED</span>
          </button>
          <button
            onClick={() => { sounds.click(); setActiveTab('clips'); }}
            className={`px-3 py-2 rounded-xl text-xs font-orbitron font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'clips'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>SHORTS CLIPS ({clips.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewDensity(d => d === 'cozy' ? 'compact' : 'cozy')}
            className={`p-2.5 rounded-xl border transition-colors ${
              viewDensity === 'compact' ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40' : 'bg-white/5 border-white/10 text-[#8a8aa8] hover:text-white'
            }`}
            title={`Switch to ${viewDensity === 'cozy' ? 'Compact' : 'Cozy'} Layout`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#8a8aa8] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Instant Fast Creator Box */}
      {activeTab === 'feed' && (
        <form 
          onSubmit={handleInlineSubmit}
          className="rounded-3xl bg-[#161632]/80 border border-white/15 p-4 backdrop-blur-xl shadow-xl space-y-3 relative overflow-hidden animate-spring-pop"
        >
          <div className="flex items-start gap-3">
            <div
              onClick={() => openUserProfileModal(currentUser)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
              style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
            >
              {currentUser?.avatar || 'U'}
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                value={inlineText}
                onChange={(e) => setInlineText(e.target.value)}
                placeholder="What's happening? Share thoughts, custom ROM tweaks, gaming clips, or AI art..."
                rows={2}
                className="w-full bg-transparent text-sm text-white placeholder-[#8a8aa8] focus:outline-none resize-none"
              />

              {inlineMediaUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-white/20 my-2 max-h-48 bg-black flex items-center justify-center">
                  {inlineMediaType === 'image' ? (
                    <img src={inlineMediaUrl} alt="Upload preview" className="w-full h-full object-cover max-h-48" />
                  ) : (
                    <video src={inlineMediaUrl} controls className="w-full h-full object-cover max-h-48" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setInlineMediaUrl(null); setInlineMediaType(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-red-500 text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-xs">
              <input type="file" ref={inlineImageInputRef} accept="image/*" className="hidden" onChange={handleInlineImageFile} />
              <input type="file" ref={inlineVideoInputRef} accept="video/*" className="hidden" onChange={handleInlineVideoFile} />

              <button
                type="button"
                onClick={() => inlineImageInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#fbbf24] font-semibold transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Photo</span>
              </button>

              <button
                type="button"
                onClick={() => inlineVideoInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#00e5ff] font-semibold transition-colors"
              >
                <VideoIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Video</span>
              </button>

              <select
                value={inlineTag}
                onChange={(e) => setInlineTag(e.target.value)}
                className="px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white focus:outline-none"
              >
                {quickFilterTags.filter(t => t !== 'All').map(t => (
                  <option key={t} value={t} className="bg-[#161632]">{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="text-[11px] text-[#8a8aa8] hover:text-white underline hidden sm:inline"
              >
                Full Studio
              </button>
              <button
                type="submit"
                disabled={isInlinePosting || (!inlineText.trim() && !inlineMediaUrl)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-50"
              >
                {isInlinePosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>POST</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Quick Tag Filter Bar */}
      {activeTab === 'feed' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickFilterTags.map(tag => (
            <button
              key={tag}
              onClick={() => { sounds.click(); setFilterTag(tag); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterTag === tag
                  ? 'bg-[#00e5ff] text-slate-900 font-bold shadow-md scale-102'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/5'
              }`}
            >
              {tag === 'All' ? '⚡ All Posts' : tag}
            </button>
          ))}
        </div>
      )}

      {/* Feed Content Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 text-[#00e5ff] animate-spin" />
          <p className="text-xs text-[#8a8aa8] font-orbitron">SYNCING COMMUNITY STREAM...</p>
        </div>
      ) : activeTab === 'feed' ? (
        filteredPosts.length === 0 ? (
          <div className="text-center py-20 space-y-4 rounded-3xl bg-white/[0.02] border border-white/5 p-8">
            <div className="text-5xl animate-bounce">📡</div>
            <h3 className="font-orbitron font-bold text-white text-lg">NO POSTS IN THIS FILTER</h3>
            <p className="text-xs text-[#8a8aa8] max-w-xs mx-auto">
              Be the first to share an update, review a ROM, or post a game highlight!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => {
              const isSaved = bookmarkedIds.has(post.id);
              const authorProfile = allUsers[post.userId];

              return (
                <article
                  key={post.id}
                  className={`rounded-3xl liquid-glass-card border border-white/10 backdrop-blur-xl overflow-hidden hover:border-[#00e5ff]/40 transition-all ${
                    viewDensity === 'compact' ? 'p-3' : 'p-4'
                  }`}
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div 
                      onClick={() => openUserProfileModal(authorProfile || { id: post.userId, name: post.authorName, handle: post.authorHandle, avatar: post.authorAvatar, color: post.authorColor, location: post.location, bio: '', followers: 0, following: 0, videos: 0, likes: 0, views: '0', joined: '2026', walletBalance: 0 })}
                      className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md shrink-0 group-hover:scale-105 transition-transform border border-white/20"
                        style={{ background: post.authorColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                      >
                        {post.authorAvatar || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate group-hover:text-[#00e5ff] transition-colors">{post.authorName}</span>
                          <span className="text-[#00e5ff] text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20 shrink-0">
                            CREATOR
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8a8aa8] truncate">
                          {post.authorHandle} · {post.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleBookmark(post.id)}
                        className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'text-[#fbbf24] bg-[#fbbf24]/15' : 'text-[#8a8aa8] hover:text-white'}`}
                        title={isSaved ? 'Bookmarked' : 'Bookmark post'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>

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
                  </div>

                  {/* Post Content */}
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-white/95 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            onClick={() => setFilterTag(tag)}
                            className="px-2.5 py-0.5 rounded-full bg-[#ff2d95]/10 border border-[#ff2d95]/20 text-[11px] font-bold text-[#ff8ac2] cursor-pointer hover:bg-[#ff2d95]/20 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Media */}
                  {post.mediaUrl && post.mediaType === 'image' && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-white/10 bg-black max-h-96 flex items-center justify-center">
                      <img
                        src={post.mediaUrl}
                        alt="Attached photo"
                        className="w-full h-full object-cover max-h-96"
                      />
                    </div>
                  )}

                  {post.mediaUrl && post.mediaType === 'video' && (
                    <div className="mb-3 rounded-2xl overflow-hidden border border-white/10 bg-black max-h-96">
                      <video
                        src={post.mediaUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-96 object-cover bg-black"
                      />
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-[#8a8aa8]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#8a8aa8] hover:text-[#ff2d95] transition-all group"
                      >
                        <Heart className="w-4 h-4 group-hover:scale-125 transition-transform group-hover:fill-[#ff2d95]" />
                        <span>{(Number(post.likes) || 0).toLocaleString()}</span>
                      </button>

                      <button
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#8a8aa8] hover:text-[#00e5ff] transition-all group"
                      >
                        <MessageCircle className="w-4 h-4 group-hover:scale-125 transition-transform" />
                        <span>{post.comments?.length || 0}</span>
                      </button>

                      <button
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#8a8aa8] hover:text-white transition-all group"
                      >
                        {copiedPostId === post.id ? <Check className="w-4 h-4 text-[#10b981]" /> : <Share2 className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                        <span>{copiedPostId === post.id ? 'Copied' : 'Share'}</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-[#8a8aa8] font-mono">
                      #ID-{post.id.slice(-4)}
                    </div>
                  </div>

                  {/* Comments & Nested Replies Expansion */}
                  {expandedComments === post.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-3 bg-black/20 -mx-4 -mb-4 p-4 rounded-b-3xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider">
                          {post.comments?.length || 0} Comments & Replies
                        </span>
                        <button
                          onClick={() => setExpandedComments(null)}
                          className="text-xs text-[#8a8aa8] hover:text-white"
                        >
                          ✕ Close
                        </button>
                      </div>

                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {post.comments.map((comment: CommentItem) => (
                            <div key={comment.id} className="space-y-2">
                              <div className="flex items-start gap-2.5">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-900 shrink-0"
                                  style={{ background: comment.userColor || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                                >
                                  {comment.userAvatar || 'U'}
                                </div>
                                <div className="flex-1 min-w-0 bg-white/5 rounded-2xl p-2.5 border border-white/5 text-xs space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-white">{comment.userName}</span>
                                    <span className="text-[9px] text-[#8a8aa8]">{comment.timestamp}</span>
                                  </div>

                                  {comment.text && <p className="text-white/90 leading-relaxed">{comment.text}</p>}
                                  
                                  {comment.media && (
                                    <div className="mt-1 rounded-xl overflow-hidden max-h-36 border border-white/10">
                                      <img src={comment.media} alt="Attached media" className="w-full h-full object-cover max-h-36" />
                                    </div>
                                  )}

                                  {/* Comment Action Controls: Like & Reply */}
                                  <div className="pt-1 flex items-center gap-3 text-[10px] text-[#8a8aa8]">
                                    <button
                                      onClick={() => handleCommentLikeClick(post.id, comment.id)}
                                      className={`flex items-center gap-1 font-bold transition-colors ${comment.isLiked ? 'text-[#ff2d95]' : 'hover:text-white'}`}
                                    >
                                      <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                                      <span>{comment.likes || 0} Likes</span>
                                    </button>

                                    <button
                                      onClick={() => setActiveReplyCommentId(activeReplyCommentId === comment.id ? null : comment.id)}
                                      className="flex items-center gap-1 hover:text-[#00e5ff] font-bold"
                                    >
                                      <CornerDownRight className="w-3 h-3" />
                                      <span>Reply ({comment.replies?.length || 0})</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Nested Replies Stream */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-8 space-y-2 border-l-2 border-white/10 pl-3">
                                  {comment.replies.map((reply: CommentReply) => (
                                    <div key={reply.id} className="flex items-start gap-2 text-xs">
                                      <div
                                        className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px] text-slate-900 shrink-0"
                                        style={{ background: reply.userColor }}
                                      >
                                        {reply.userAvatar}
                                      </div>
                                      <div className="flex-1 bg-white/[0.03] rounded-xl p-2.5 border border-white/5 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-white text-[11px]">{reply.userName}</span>
                                          <span className="text-[9px] text-[#8a8aa8]">{reply.timestamp}</span>
                                        </div>

                                        {reply.text && <p className="text-white/85 text-[11px] leading-relaxed">{reply.text}</p>}
                                        
                                        {reply.media && (
                                          <div className="mt-1.5 rounded-xl overflow-hidden max-h-32 border border-white/10">
                                            <img src={reply.media} alt="Reply attachment" className="w-full h-full object-cover max-h-32" />
                                          </div>
                                        )}

                                        {/* Reply Like Action */}
                                        <div className="pt-1 flex items-center gap-2 text-[10px] text-[#8a8aa8]">
                                          <button
                                            onClick={() => handleReplyLikeClick(post.id, comment.id, reply.id)}
                                            className={`flex items-center gap-1 font-bold transition-colors ${reply.isLiked ? 'text-[#ff2d95]' : 'hover:text-white'}`}
                                          >
                                            <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                            <span>{reply.likes || 0} Likes</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Inline Rich Reply Form Input (Supports Photos, GIPHY, Stickers & Voice Notes) */}
                              {activeReplyCommentId === comment.id && (
                                <div className="ml-8 pt-1">
                                  <RichCommentInput
                                    onSend={(replyPayload) => handleSendReply(post.id, comment.id, replyPayload)}
                                    placeholder={`Reply with text, photo, GIF or voice to ${comment.userName}...`}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <RichCommentInput
                        onSend={(c) => handleSendComment(post.id, c)}
                        placeholder="Leave a rich comment or reaction..."
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
      ) : (
        /* Shorts Clips View */
        clips.length === 0 ? (
          <div className="text-center py-24 space-y-4 rounded-3xl bg-white/[0.02] border border-white/5 p-8">
            <div className="text-5xl animate-pulse">🎬</div>
            <h3 className="font-orbitron font-bold text-white text-lg">NO SHORT CLIPS UPLOADED</h3>
            <p className="text-xs text-[#8a8aa8] max-w-xs mx-auto">
              Upload a vertical short clip (MP4) to showcase ROM smoothness, gaming fps, or creative edits!
            </p>
            <button
              onClick={() => { sounds.click(); setIsCreateOpen(true); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              UPLOAD VERTICAL CLIP
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clips.map(clip => (
              <div
                key={clip.id}
                className="rounded-3xl liquid-glass-card border border-white/10 overflow-hidden group"
              >
                <div className="relative aspect-[9/16] bg-black overflow-hidden">
                  <video
                    src={clip.videoUrl}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    onClick={() => setPlayingClipId(playingClipId === clip.id ? null : clip.id)}
                    className="w-full h-full object-cover"
                  />

                  <button
                    onClick={() => setPlayingClipId(playingClipId === clip.id ? null : clip.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {playingClipId === clip.id ? (
                      <Pause className="w-12 h-12 text-white drop-shadow-lg" />
                    ) : (
                      <Play className="w-12 h-12 text-white drop-shadow-lg" />
                    )}
                  </button>

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#ff2d95]/30">
                    <Film className="w-3 h-3 text-[#ff2d95]" />
                    <span className="text-[10px] font-bold text-[#00e5ff]">CLIP</span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2">
                  <h3 className="font-bold text-sm text-white line-clamp-1">{clip.title}</h3>
                  <p className="text-xs text-[#8a8aa8] line-clamp-2">{clip.description}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs text-[#8a8aa8]">
                    <button
                      onClick={() => handleLikeClip(clip.id)}
                      className="flex items-center gap-1 hover:text-[#ff2d95] font-bold"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{clip.likes}</span>
                    </button>
                    <span className="text-[10px] font-mono text-[#00e5ff]">HD 60FPS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Full Modal Composer */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          fetchFeed(true);
        }}
        defaultTarget={activeTab}
      />
    </div>
  );
};