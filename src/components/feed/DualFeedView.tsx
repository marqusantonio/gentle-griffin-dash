import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  ListVideo, 
  ChevronDown, 
  ChevronUp,
  Plus,
  Image as ImageIcon,
  Video as VideoIcon,
  Send
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from './CreatePostModal';
import { sounds } from '../../lib/soundFx';

export const DualFeedView: React.FC = () => {
  const { 
    posts,
    clips, 
    longVideos, 
    toggleClipLike, 
    toggleClipBookmark, 
    addClipComment, 
    openShareModal, 
    allUsers, 
    currentUser,
    openUserProfileModal
  } = useWevids();

  const [feedMode, setFeedMode] = useState<'posts' | 'clips' | 'watch'>('posts');
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [selectedLongVideoId, setSelectedLongVideoId] = useState(longVideos[0]?.id || 'long-1');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  // Player state
  const [isMuted, setIsMuted] = useState(true);
  const [showClipComments, setShowClipComments] = useState(false);

  const activeClip = clips[activeClipIndex] || clips[0];
  const activeLongVideo = longVideos.find(v => v.id === selectedLongVideoId) || longVideos[0];
  const clipAuthor = allUsers[activeClip?.userId] || currentUser;
  const longAuthor = allUsers[activeLongVideo?.userId] || currentUser;

  const topics = ['All', 'ROM Installation', 'Minecraft Guides', 'Tech Reviews', 'AI Shorts', 'Cyberpunk UI', 'Live Stream Replays'];

  const filteredPosts = posts.filter(p => {
    if (selectedTopic === 'All') return true;
    return (p.tags || []).some(t => t.toLowerCase().includes(selectedTopic.toLowerCase().replace(/\s+/g, '')));
  });

  const handleNextClip = () => {
    sounds.pop();
    setActiveClipIndex((prev) => (prev + 1) % clips.length);
  };

  const handlePrevClip = () => {
    sounds.pop();
    setActiveClipIndex((prev) => (prev - 1 + clips.length) % clips.length);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Mode Switcher Tab */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl liquid-glass border border-white/10">
        <div>
          <h1 className="text-2xl font-bold font-orbitron neon-gradient-text tracking-wide">
            {feedMode === 'posts' ? 'Global Community Feed' : feedMode === 'clips' ? 'Clips · Vertical Feed' : 'Watch · Long-Form Video Engine'}
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            {feedMode === 'posts'
              ? 'Real-time discussions with direct photo/video attachments and rich replies'
              : feedMode === 'clips' 
              ? 'TikTok-style snap scroll with rich comments, GIPHY GIFs, and voice notes' 
              : '16:9 4K player with resolution selector, chapters, and nested thread reactions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1.5 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => {
                sounds.click();
                setFeedMode('posts');
              }}
              className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-all ${
                feedMode === 'posts'
                  ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                  : 'text-[#8a8aa8] hover:text-white'
              }`}
            >
              💬 Feed
            </button>
            <button
              onClick={() => {
                sounds.click();
                setFeedMode('clips');
              }}
              className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-all ${
                feedMode === 'clips'
                  ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                  : 'text-[#8a8aa8] hover:text-white'
              }`}
            >
              🔥 Clips
            </button>
            <button
              onClick={() => {
                sounds.click();
                setFeedMode('watch');
              }}
              className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-all ${
                feedMode === 'watch'
                  ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md'
                  : 'text-[#8a8aa8] hover:text-white'
              }`}
            >
              📺 16:9 Player
            </button>
          </div>

          <button
            onClick={() => {
              sounds.pop();
              setIsCreatePostOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE POST</span>
          </button>
        </div>
      </div>

      {/* Quick In-Feed Composer Bar */}
      {feedMode === 'posts' && (
        <div 
          onClick={() => {
            sounds.pop();
            setIsCreatePostOpen(true);
          }}
          className="liquid-glass-card rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:border-[#00e5ff]/40 transition-all shadow-md"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md flex-shrink-0"
              style={{ background: currentUser.color }}
            >
              {currentUser.avatar}
            </div>
            <span className="text-xs text-[#8a8aa8] truncate">
              What&apos;s on your mind, {currentUser.name}? Upload photo or video...
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
      )}

      {/* Topics pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                : 'bg-white/5 text-[#8a8aa8] hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FEED POSTS VIEW */}
      {feedMode === 'posts' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {filteredPosts.map((post) => {
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

                {/* Uploaded Media (Image or Video) */}
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

                {/* Actions & Comment Input */}
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
                    onSend={(comment) => {
                      sounds.success();
                      toast.success('Comment posted to feed!');
                    }}
                    placeholder="Write a comment with GIF, sticker, or voice note..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLIPS VERTICAL VIEW */}
      {feedMode === 'clips' && activeClip && (
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
          <div className="relative w-full max-w-[420px] mx-auto h-[640px] rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center justify-center bg-black">
            <video
              src={activeClip.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />

            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 font-orbitron">
                CLIP {activeClipIndex + 1}/{clips.length}
              </span>
            </div>

            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.pop();
                  setIsMuted(!isMuted);
                }}
                className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95] transition-all border border-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
              <button
                onClick={handlePrevClip}
                className="p-2 rounded-full bg-black/60 hover:bg-[#00e5ff] text-white hover:text-slate-900 transition-all border border-white/10"
                title="Previous Clip"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextClip}
                className="p-2 rounded-full bg-black/60 hover:bg-[#ff2d95] text-white transition-all border border-white/10"
                title="Next Clip"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Details */}
            <div className="absolute bottom-0 left-0 right-16 p-5 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              <div 
                onClick={() => openUserProfileModal(clipAuthor)}
                className="flex items-center gap-2.5 mb-2 cursor-pointer group"
              >
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md group-hover:scale-105 transition-transform"
                  style={{ background: clipAuthor.color }}
                >
                  {clipAuthor.avatarImage ? (
                    <img src={clipAuthor.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    clipAuthor.avatar
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1 group-hover:text-[#00e5ff]">
                    {clipAuthor.name}
                    {clipAuthor.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
                  </div>
                  <div className="text-[11px] text-[#8a8aa8]">{clipAuthor.handle}</div>
                </div>
              </div>

              <h2 className="text-sm font-bold text-white mb-1.5 drop-shadow">{activeClip.title}</h2>
              <p className="text-xs text-[#e8e8f4]/90 line-clamp-2 mb-2.5 drop-shadow">{activeClip.description}</p>
            </div>

            {/* Floating Action Bar */}
            <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-4">
              <button onClick={() => toggleClipLike(activeClip.id)} className="flex flex-col items-center group">
                <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  activeClip.isLiked 
                    ? 'bg-[#ff2d95] text-white scale-110 shadow-[0_0_15px_rgba(255,45,149,0.8)]' 
                    : 'bg-black/60 text-white hover:bg-[#ff2d95]/40 border border-white/10'
                }`}>
                  <Heart className={`w-5 h-5 ${activeClip.isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
                  {activeClip.likes.toLocaleString()}
                </span>
              </button>

              <button
                onClick={() => {
                  sounds.pop();
                  setShowClipComments(!showClipComments);
                }}
                className="flex flex-col items-center group"
              >
                <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#00e5ff]/40 transition-all border border-white/10 shadow-lg">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">
                  {activeClip.comments.length}
                </span>
              </button>

              <button onClick={() => toggleClipBookmark(activeClip.id)} className="flex flex-col items-center group">
                <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  activeClip.isBookmarked
                    ? 'bg-[#fbbf24] text-slate-900 scale-110'
                    : 'bg-black/60 text-white hover:bg-[#fbbf24]/40 border border-white/10'
                }`}>
                  <Bookmark className={`w-5 h-5 ${activeClip.isBookmarked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">Save</span>
              </button>

              <button onClick={() => openShareModal(activeClip.title, `https://wevids.app/clip/${activeClip.id}`)} className="flex flex-col items-center group">
                <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95]/40 transition-all border border-white/10 shadow-lg">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">{activeClip.shares}</span>
              </button>
            </div>
          </div>

          {/* Comments Panel */}
          {showClipComments && (
            <div className="w-full lg:w-96 liquid-glass rounded-3xl p-5 border border-white/15 shadow-2xl flex flex-col h-[640px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                  Comments ({activeClip.comments.length})
                </h3>
                <button onClick={() => setShowClipComments(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {activeClip.comments.length === 0 ? (
                  <div className="text-center py-16 text-[#8a8aa8] text-xs">
                    No comments yet. Send a GIF or voice note!
                  </div>
                ) : (
                  activeClip.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{c.userName}</span>
                        <span className="text-[10px] text-[#8a8aa8]">{c.timestamp}</span>
                      </div>
                      {c.text && <p className="text-xs text-[#e8e8f4]">{c.text}</p>}

                      {/* Render Attachments */}
                      {c.media && c.mediaType === 'gif' && (
                        <img src={c.media} alt="GIF comment" className="rounded-xl max-h-32 object-cover border border-white/10" />
                      )}
                      {c.media && c.mediaType === 'image' && (
                        <img src={c.media} alt="Photo comment" className="rounded-xl max-h-36 object-cover border border-white/10" />
                      )}
                      {c.media && c.mediaType === 'sticker' && (
                        <img src={c.media} alt="Sticker comment" className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      {c.mediaType === 'audio' && (
                        <div className="p-2 rounded-xl bg-white/10 border border-[#00e5ff]/40 text-xs text-[#00e5ff] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#ff2d95] animate-ping" />
                          <span>🎤 Voice Note Message</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Rich Comment Input */}
              <div className="pt-2 border-t border-white/10">
                <RichCommentInput
                  onSend={(comment) => {
                    addClipComment(activeClip.id, {
                      user: currentUser.id,
                      userName: currentUser.name,
                      userAvatar: currentUser.avatar,
                      userColor: currentUser.color,
                      text: comment.text,
                      media: comment.media,
                      mediaType: comment.mediaType
                    });
                  }}
                  placeholder="Drop a GIF, voice, or sticker..."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* WATCH LONG-FORM PLAYER VIEW */}
      {feedMode === 'watch' && activeLongVideo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl bg-black">
              <video
                src={activeLongVideo.videoUrl}
                poster={activeLongVideo.thumbnail}
                controls
                className="w-full h-full object-cover"
              />
            </div>

            <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h1 className="text-xl font-bold text-white tracking-wide">{activeLongVideo.title}</h1>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div onClick={() => openUserProfileModal(longAuthor)} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md" style={{ background: longAuthor.color }}>
                    {longAuthor.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1">
                      {longAuthor.name}
                      {longAuthor.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
                    </div>
                    <div className="text-xs text-[#8a8aa8]">{longAuthor.followers.toLocaleString()} subscribers</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => sounds.like()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-xs text-white">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#ff2d95]" /> {activeLongVideo.likes.toLocaleString()}
                  </button>
                  <button onClick={() => openShareModal(activeLongVideo.title, `https://wevids.app/watch/${activeLongVideo.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-xs text-white">
                    <Share2 className="w-3.5 h-3.5 text-[#00e5ff]" /> Share
                  </button>
                </div>
              </div>

              {/* Rich Comments for Long Video */}
              <div className="pt-2 space-y-4">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                  Community Discussion & Media Replies
                </h3>

                <RichCommentInput
                  onSend={(comment) => {
                    sounds.success();
                  }}
                  placeholder="Join the discussion with GIF, voice, or photo..."
                />
              </div>
            </div>
          </div>

          {/* Right Recommendations */}
          <div className="space-y-3">
            <div className="liquid-glass rounded-2xl p-4 border border-white/10">
              <h3 className="font-orbitron font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff2d95]" />
                Up Next
              </h3>
              {longVideos.map((lv) => (
                <div
                  key={lv.id}
                  onClick={() => setSelectedLongVideoId(lv.id)}
                  className="flex gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <img src={lv.thumbnail} alt={lv.title} className="w-28 aspect-video rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white line-clamp-2 leading-tight">{lv.title}</div>
                    <div className="text-[10px] text-[#8a8aa8] mt-1">{lv.views} views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Post Composer Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </div>
  );
};