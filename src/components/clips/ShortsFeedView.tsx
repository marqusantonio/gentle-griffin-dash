import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  ThumbsDown, 
  Send, 
  CheckCircle2, 
  UserPlus, 
  Check, 
  Sparkles,
  Music2,
  Image as ImageIcon,
  Smile
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const ShortsFeedView: React.FC = () => {
  const { 
    clips, 
    toggleClipLike, 
    toggleClipDislike, 
    addClipComment, 
    openShareModal, 
    allUsers, 
    currentUser,
    toggleFollowUser,
    isFollowing,
    isMutualFriend,
    openUserProfileModal
  } = useWevids();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const emojis = ['🔥', '❤️', '👏', '😍', '🚀', '✨', '😂', '🤯'];

  const activeClip = clips[currentIndex] || clips[0];
  const clipAuthor = allUsers[activeClip?.userId] || currentUser;
  const isUserFollowing = isFollowing(activeClip?.userId);
  const isFriend = isMutualFriend(activeClip?.userId);

  const handleNext = () => {
    sounds.pop();
    setCurrentIndex(prev => (prev + 1) % clips.length);
  };

  const handlePrev = () => {
    sounds.pop();
    setCurrentIndex(prev => (prev - 1 + clips.length) % clips.length);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addClipComment(activeClip.id, {
      user: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userColor: currentUser.color,
      text: commentText.trim(),
    });
    setCommentText('');
    toast.success('Comment added!');
  };

  const handleAddQuickEmoji = (em: string) => {
    sounds.pop();
    addClipComment(activeClip.id, {
      user: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userColor: currentUser.color,
      text: em,
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 justify-center items-start pb-20 max-w-5xl mx-auto">
      {/* Vertical Video Viewport */}
      <div className="relative w-full max-w-[440px] mx-auto h-[680px] rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex items-center justify-center bg-black">
        <video
          src={activeClip.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 font-orbitron">
            TRENDING CLIP {currentIndex + 1}/{clips.length}
          </span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => {
              sounds.pop();
              setIsMuted(!isMuted);
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95] transition-all border border-white/10 shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Vertical Swipe Navigation buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-black/70 hover:bg-[#00e5ff] text-white hover:text-slate-900 transition-all border border-white/10 shadow-lg"
            title="Previous Short"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-black/70 hover:bg-[#ff2d95] text-white transition-all border border-white/10 shadow-lg"
            title="Next Short"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Author & Music details */}
        <div className="absolute bottom-0 left-0 right-16 p-5 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent space-y-2">
          <div className="flex items-center gap-2.5">
            <div 
              onClick={() => openUserProfileModal(clipAuthor)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md cursor-pointer hover:scale-105 transition-transform"
              style={{ background: clipAuthor.color }}
            >
              {clipAuthor.avatarImage ? (
                <img src={clipAuthor.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                clipAuthor.avatar
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div 
                onClick={() => openUserProfileModal(clipAuthor)}
                className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-[#00e5ff]"
              >
                <span>{clipAuthor.name}</span>
                {clipAuthor.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
              </div>
              <div className="text-[10px] text-[#8a8aa8]">{clipAuthor.handle}</div>
            </div>

            {clipAuthor.id !== currentUser.id && (
              <button
                onClick={() => toggleFollowUser(clipAuthor.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold font-orbitron transition-all shadow-md flex items-center gap-1 ${
                  isFriend
                    ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900'
                    : isUserFollowing
                    ? 'bg-white/15 text-[#00e5ff] border border-[#00e5ff]/40'
                    : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900'
                }`}
              >
                {isFriend ? 'Friends 🤝' : isUserFollowing ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>

          <h2 className="text-sm font-bold text-white drop-shadow">{activeClip.title}</h2>
          <p className="text-xs text-[#e8e8f4]/90 line-clamp-2 drop-shadow">{activeClip.description}</p>

          <div className="flex items-center gap-2 text-[11px] text-[#00e5ff] font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 inline-flex">
            <Music2 className="w-3 h-3 text-[#ff2d95] animate-pulse" />
            <span className="truncate max-w-[200px]">{activeClip.audioTrack}</span>
          </div>
        </div>

        {/* Right Floating Actions (Like, Dislike, Comment, Share) */}
        <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-3.5">
          {/* Like */}
          <button
            onClick={() => toggleClipLike(activeClip.id)}
            className="flex flex-col items-center group"
          >
            <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
              activeClip.isLiked 
                ? 'bg-[#ff2d95] text-white scale-110 shadow-[0_0_18px_rgba(255,45,149,0.8)]' 
                : 'bg-black/60 text-white hover:bg-[#ff2d95]/40 border border-white/10'
            }`}>
              <Heart className={`w-5 h-5 ${activeClip.isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
              {activeClip.likes.toLocaleString()}
            </span>
          </button>

          {/* Dislike */}
          <button
            onClick={() => toggleClipDislike(activeClip.id)}
            className="flex flex-col items-center group"
          >
            <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
              activeClip.isDisliked
                ? 'bg-slate-700 text-white border border-white/30'
                : 'bg-black/60 text-white hover:bg-white/10 border border-white/10'
            }`}>
              <ThumbsDown className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
              {activeClip.dislikes || 0}
            </span>
          </button>

          {/* Comment */}
          <button
            onClick={() => {
              sounds.pop();
              setShowComments(!showComments);
            }}
            className="flex flex-col items-center group"
          >
            <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#00e5ff]/40 transition-all border border-white/10 shadow-lg">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">
              {activeClip.comments.length}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={() => openShareModal(activeClip.title, `https://wevids.app/clip/${activeClip.id}`)}
            className="flex flex-col items-center group"
          >
            <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95]/40 transition-all border border-white/10 shadow-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">Share</span>
          </button>
        </div>
      </div>

      {/* Slide-out Comments Drawer */}
      {showComments && (
        <div className="w-full lg:w-96 liquid-glass rounded-3xl p-5 border border-white/15 shadow-2xl flex flex-col h-[680px] animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
              Clip Comments ({activeClip.comments.length})
            </h3>
            <button
              onClick={() => setShowComments(false)}
              className="text-xs text-[#8a8aa8] hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          {/* Quick Reaction Emojis */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-2 border-b border-white/5 overflow-x-auto">
            {emojis.map(em => (
              <button
                key={em}
                onClick={() => handleAddQuickEmoji(em)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-sm transition-transform hover:scale-125"
              >
                {em}
              </button>
            ))}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {activeClip.comments.length === 0 ? (
              <div className="text-center py-20 text-xs text-[#8a8aa8]">
                No comments yet! Be the first to start the vibe.
              </div>
            ) : (
              activeClip.comments.map(c => (
                <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.userName}</span>
                    <span className="text-[10px] text-[#8a8aa8]">{c.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#e8e8f4] leading-relaxed">{c.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendComment} className="pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold text-xs hover:scale-105 transition-transform"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};