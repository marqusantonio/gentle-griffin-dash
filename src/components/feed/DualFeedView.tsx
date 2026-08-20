import React, { useState, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Plus, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Sparkles,
  CheckCircle2,
  Film,
  Radio
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from './CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

export const DualFeedView: React.FC = () => {
  const { 
    posts, 
    allUsers, 
    currentUser, 
    openShareModal, 
    openUserProfileModal,
    setActiveView,
    addPost
  } = useWevids();

  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [composerTarget, setComposerTarget] = useState<'feed' | 'clips'>('feed');

  // Listen for real-time inserts using Supabase Realtime channel
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload: any) => {
          if (payload?.new) {
            sounds.pop();
            toast.info(`New post from ${payload.new.authorName || 'creator'}!`);
            // Add or merge into state if not already existing
            addPost(payload.new);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime posts-channel subscribed successfully');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const topics = ['All', '#WEVIDS', '#Tech', '#CustomROM', '#Anime', '#Gaming', '#Cyberpunk', '#Music'];

  const filteredPosts = posts.filter(p => {
    if (selectedTopic === 'All') return true;
    return (p.tags || []).some(t => t.toLowerCase() === selectedTopic.toLowerCase());
  });

  const handleOpenComposer = (target: 'feed' | 'clips' = 'feed') => {
    sounds.pop();
    setComposerTarget(target);
    setIsCreatePostOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#00e5ff]" />
            <span>REALTIME VIDEO & COMMUNITY STREAM</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Community Feed
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Real-time discussions and video uploads instantly synced across all connected devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* In-Feed Composer Input Bar */}
      <div 
        onClick={() => handleOpenComposer('feed')}
        className="liquid-glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:border-[#00e5ff]/50 transition-all shadow-md"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md flex-shrink-0"
            style={{ background: currentUser.color }}
          >
            {currentUser.avatar}
          </div>
          <span className="text-xs text-[#8a8aa8] truncate">
            Share a new video or thought, {currentUser.name}...
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#fbbf24]">
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#00e5ff]">
            <VideoIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

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

      {/* FEED POSTS STREAM */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <div className="liquid-glass rounded-3xl p-10 border border-white/10 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#ff2d95]/15 border border-[#ff2d95]/30 flex items-center justify-center mx-auto text-[#ff2d95]">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-orbitron font-bold text-lg text-white">No posts in the feed yet!</h3>
              <p className="text-xs text-[#8a8aa8] max-w-sm mx-auto">
                Be the first person to publish a video, thought, or photo to the global network.
              </p>
            </div>
            <button
              onClick={() => handleOpenComposer('feed')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>PUBLISH THE FIRST POST</span>
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

            return (
              <div
                key={post.id}
                className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4 hover:border-white/25 transition-all"
              >
                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => openUserProfileModal(author as any)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md group-hover:scale-105 transition-transform"
                      style={{ background: post.authorColor }}
                    >
                      {post.authorAvatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1 group-hover:text-[#00e5ff]">
                        {post.authorName}
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />
                      </div>
                      <div className="text-[11px] text-[#8a8aa8]">{post.authorHandle} · {post.time}</div>
                    </div>
                  </div>

                  <span className="text-xs text-[#8a8aa8]">{post.location}</span>
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
                      onClick={() => sounds.like()}
                      className="flex items-center gap-1.5 hover:text-[#ff2d95] transition-colors"
                    >
                      <Heart className="w-4 h-4 text-[#ff2d95]" />
                      <span className="font-bold">{post.likes}</span>
                    </button>

                    <button className="flex items-center gap-1.5 hover:text-[#00e5ff] transition-colors">
                      <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                      <span className="font-bold">{post.comments?.length || 0}</span>
                    </button>

                    <button
                      onClick={() => openShareModal(post.content, `https://wevids.app/post/${post.id}`)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{post.shares}</span>
                    </button>
                  </div>
                </div>

                {/* Rich Comment Input */}
                <div className="pt-2">
                  <RichCommentInput
                    onSend={() => {
                      sounds.success();
                    }}
                    placeholder="Leave a comment with GIF, sticker, or voice note..."
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        defaultTarget={composerTarget}
      />
    </div>
  );
};