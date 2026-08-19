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
  VolumeX<dyad-write path="src/components/feed/DualFeedView.tsx" description="Dual Format Video Engine: Vertical TikTok Clips + 16:9 YouTube Widescreen Player with comments & playlists">
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
  Maximize2, 
  Settings, 
  Flame, 
  Radio, 
  Sparkles,
  Send,
  Sliders,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  ListVideo,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const DualFeedView: React.FC = () => {
  const { 
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

  const [feedMode, setFeedMode] = useState<'clips' | 'watch'>('clips');
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [selectedLongVideoId, setSelectedLongVideoId] = useState(longVideos[0]?.id || 'long-1');
  const [selectedTopic, setSelectedTopic] = useState('All');
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [resolution, setResolution] = useState('1080p 60fps');
  const [showSettings, setShowSettings] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showClipComments, setShowClipComments] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [longCommentText, setLongCommentText] = useState('');

  const activeClip = clips[activeClipIndex] || clips[0];
  const activeLongVideo = longVideos.find(v => v.id === selectedLongVideoId) || longVideos[0];
  const clipAuthor = allUsers[activeClip?.userId] || currentUser;
  const longAuthor = allUsers[activeLongVideo?.userId] || currentUser;

  const topics = ['All', 'ROM Installation', 'Minecraft Guides', 'Tech Reviews', 'AI Shorts', 'Cyberpunk UI', 'Live Stream Replays'];

  const handleSendClipComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeClip) return;
    addClipComment(activeClip.id, {
      user: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userColor: currentUser.color,
      text: commentText.trim(),
    });
    setCommentText('');
  };

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
            {feedMode === 'clips' ? 'Clips · Vertical Feed' : 'Watch · Long-Form Video Engine'}
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            {feedMode === 'clips' 
              ? 'TikTok-style snap scroll with instant music & comment overlay' 
              : '16:9 4K player with resolution selector, chapters, and nested thread reactions'}
          </p>
        </div>

        {/* Dual Mode Switch Button Group */}
        <div className="flex items-center p-1.5 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => {
              sounds.click();
              setFeedMode('clips');
            }}
            className={`px-4 py-2 rounded-lg font-orbitron font-bold text-xs transition-all ${
              feedMode === 'clips'
                ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            🔥 Vertical Clips
          </button>
          <button
            onClick={() => {
              sounds.click();
              setFeedMode('watch');
            }}
            className={`px-4 py-2 rounded-lg font-orbitron font-bold text-xs transition-all ${
              feedMode === 'watch'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            📺 16:9 Long Player
          </button>
        </div>
      </div>

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

      {/* CLIPS VERTICAL VIEW (TikTok style) */}
      {feedMode === 'clips' && activeClip && (
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-start">
          {/* Vertical Video Viewport Container */}
          <div className="relative w-full max-w-[420px] mx-auto h-[640px] rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center justify-center bg-black">
            <video
              src={activeClip.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Navigation Overlay Controls */}
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

            {/* Prev / Next Swipe Buttons */}
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

            {/* Bottom Caption & Music Bar */}
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
                  <div className="text-sm font-bold text-white flex items-center gap-1 group-hover:text-[#00e5ff] transition-colors">
                    {clipAuthor.name}
                    {clipAuthor.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
                  </div>
                  <div className="text-[11px] text-[#8a8aa8]">{clipAuthor.handle}</div>
                </div>
              </div>

              <h2 className="text-sm font-bold text-white mb-1.5 drop-shadow">{activeClip.title}</h2>
              <p className="text-xs text-[#e8e8f4]/90 line-clamp-2 mb-2.5 drop-shadow">{activeClip.description}</p>

              <div className="flex items-center gap-2 text-[11px] text-[#00e5ff] font-medium bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 inline-flex">
                <span className="w-2 h-2 rounded-full bg-[#ff2d95] animate-ping" />
                <span className="truncate max-w-[220px]">🎵 {activeClip.audioTrack}</span>
              </div>
            </div>

            {/* Right Action Bar (Like, Comment, Share, Save) */}
            <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-4">
              {/* Like */}
              <button
                onClick={() => toggleClipLike(activeClip.id)}
                className="flex flex-col items-center group"
              >
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

              {/* Comment */}
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

              {/* Bookmark */}
              <button
                onClick={() => toggleClipBookmark(activeClip.id)}
                className="flex flex-col items-center group"
              >
                <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  activeClip.isBookmarked
                    ? 'bg-[#fbbf24] text-slate-900 scale-110 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                    : 'bg-black/60 text-white hover:bg-[#fbbf24]/40 border border-white/10'
                }`}>
                  <Bookmark className={`w-5 h-5 ${activeClip.isBookmarked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">Save</span>
              </button>

              {/* Share */}
              <button
                onClick={() => openShareModal(activeClip.title, `https://wevids.app/clip/${activeClip.id}`)}
                className="flex flex-col items-center group"
              >
                <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95]/40 transition-all border border-white/10 shadow-lg">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white mt-1 drop-shadow">{activeClip.shares}</span>
              </button>
            </div>
          </div>

          {/* Comments Panel (collapsible on desktop side) */}
          {showClipComments && (
            <div className="w-full lg:w-96 liquid-glass rounded-3xl p-5 border border-white/15 shadow-2xl flex flex-col h-[640px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                  Comments ({activeClip.comments.length})
                </h3>
                <button
                  onClick={() => setShowClipComments(false)}
                  className="text-xs text-[#8a8aa8] hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {activeClip.comments.length === 0 ? (
                  <div className="text-center py-16 text-[#8a8aa8] text-xs">
                    No comments yet. Be the first to start the discussion!
                  </div>
                ) : (
                  activeClip.comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{c.userName}</span>
                        <span className="text-[10px] text-[#8a8aa8]">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#e8e8f4]">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendClipComment} className="pt-3 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Say something cool..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#ff2d95] text-slate-900 font-bold text-xs hover:bg-[#00e5ff] transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* WATCH LONG-FORM WIDESCREEN PLAYER VIEW */}
      {feedMode === 'watch' && activeLongVideo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video & Details Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* 16:9 Widescreen Video Player Card */}
            <div className="relative aspect-video rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl bg-black group">
              <video
                src={activeLongVideo.videoUrl}
                poster={activeLongVideo.thumbnail}
                controls
                className="w-full h-full object-cover"
              />

              {/* Player Top Glass Overlay Bar */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-[#00e5ff] border border-white/10 font-orbitron">
                  ⚡ 4K 60FPS WEVIDS ENGINE
                </div>
                <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95] transition-all border border-white/10"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    {showSettings && (
                      <div className="absolute right-0 top-10 w-44 rounded-2xl liquid-glass p-3 border border-white/20 shadow-2xl z-30 space-y-2 text-xs">
                        <div className="font-bold text-[#00e5ff] font-orbitron">Resolution</div>
                        {['4K Ultra HD', '1080p 60fps', '720p', 'Auto'].map((res) => (
                          <div
                            key={res}
                            onClick={() => {
                              setResolution(res);
                              setShowSettings(false);
                            }}
                            className={`p-1.5 rounded-lg cursor-pointer flex items-center justify-between ${
                              resolution === res ? 'bg-[#ff2d95]/20 text-[#ff2d95] font-bold' : 'hover:bg-white/5'
                            }`}
                          >
                            <span>{res}</span>
                            {resolution === res && <span>✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Header & Meta */}
            <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h1 className="text-xl font-bold text-white tracking-wide">{activeLongVideo.title}</h1>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                {/* Author Info */}
                <div 
                  onClick={() => openUserProfileModal(longAuthor)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md group-hover:scale-105 transition-transform"
                    style={{ background: longAuthor.color }}
                  >
                    {longAuthor.avatarImage ? (
                      <img src={longAuthor.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      longAuthor.avatar
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1 group-hover:text-[#00e5ff]">
                      {longAuthor.name}
                      {longAuthor.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
                    </div>
                    <div className="text-xs text-[#8a8aa8]">{longAuthor.followers.toLocaleString()} subscribers</div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.pop();
                    }}
                    className="ml-3 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs hover:scale-105 transition-transform"
                  >
                    Subscribe
                  </button>
                </div>

                {/* Actions (Like, Dislike, Share, Save) */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
                    <button 
                      onClick={() => sounds.like()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#ff2d95]" />
                      <span>{activeLongVideo.likes.toLocaleString()}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-white/10" />
                    <button 
                      onClick={() => sounds.pop()}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#8a8aa8] hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => openShareModal(activeLongVideo.title, `https://wevids.app/watch/${activeLongVideo.id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#00e5ff]" />
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => {
                      sounds.pop();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Description & Chapters */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-[#e8e8f4] space-y-2">
                <div className="flex items-center gap-4 text-[#8a8aa8] font-medium">
                  <span>{activeLongVideo.views} views</span>
                  <span>{activeLongVideo.timestamp}</span>
                  <span className="text-[#00e5ff] font-orbitron">#{activeLongVideo.category}</span>
                </div>
                <p className={`${isDescriptionOpen ? '' : 'line-clamp-2'} leading-relaxed`}>
                  {activeLongVideo.description}
                </p>
                
                {/* Chapters */}
                <div className="pt-2">
                  <div className="font-bold text-white mb-1.5 flex items-center gap-1.5">
                    <ListVideo className="w-3.5 h-3.5 text-[#ff2d95]" />
                    Video Chapters:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {activeLongVideo.chapters.map((ch, idx) => (
                      <div key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#00e5ff] cursor-pointer transition-colors">
                        {ch.label}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                  className="text-[11px] font-bold text-[#ff2d95] hover:underline pt-1 block"
                >
                  {isDescriptionOpen ? 'Show less' : '...Show more'}
                </button>
              </div>
            </div>

            {/* Nested Comments Section */}
            <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                Comments ({activeLongVideo.comments.length + 24})
              </h3>

              <div className="flex gap-3 items-start">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs flex-shrink-0"
                  style={{ background: currentUser.color }}
                >
                  {currentUser.avatar}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={longCommentText}
                    onChange={(e) => setLongCommentText(e.target.value)}
                    placeholder="Add a public comment or timestamp reaction..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setLongCommentText('')}
                      className="px-3 py-1.5 rounded-lg text-xs text-[#8a8aa8] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!longCommentText.trim()) return;
                        sounds.success();
                        setLongCommentText('');
                      }}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold text-xs"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample Comments List */}
              <div className="space-y-3 pt-2">
                {activeLongVideo.comments.map((cm) => (
                  <div key={cm.id} className="flex gap-3 items-start p-3 rounded-xl bg-white/5 border border-white/5">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs flex-shrink-0"
                      style={{ background: cm.userColor }}
                    >
                      {cm.userAvatar}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white">{cm.userName}</span>
                        <span className="text-[10px] text-[#8a8aa8]">{cm.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#e8e8f4]">{cm.text}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[#8a8aa8] pt-1">
                        <button className="flex items-center gap-1 hover:text-[#ff2d95]">
                          <ThumbsUp className="w-3 h-3" /> {cm.likes}
                        </button>
                        <button className="hover:text-white">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Recommendation Column */}
          <div className="space-y-4">
            <div className="liquid-glass rounded-2xl p-4 border border-white/10">
              <h3 className="font-orbitron font-bold text-sm text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff2d95]" />
                Recommended Next
              </h3>

              <div className="space-y-3">
                {longVideos.map((lv) => {
                  const author = allUsers[lv.userId] || currentUser;
                  const isCurrent = lv.id === selectedLongVideoId;
                  return (
                    <div
                      key={lv.id}
                      onClick={() => {
                        sounds.click();
                        setSelectedLongVideoId(lv.id);
                      }}
                      className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-[#ff2d95]/15 border border-[#ff2d95]/40' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <img src={lv.thumbnail} alt={lv.title} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                          {lv.duration}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight mb-1">
                          {lv.title}
                        </h4>
                        <div className="text-[11px] text-[#8a8aa8] truncate">{author.name}</div>
                        <div className="text-[10px] text-[#8a8aa8] mt-0.5 flex items-center gap-2">
                          <span>{lv.views} views</span>
                          <span>•</span>
                          <span>{lv.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};