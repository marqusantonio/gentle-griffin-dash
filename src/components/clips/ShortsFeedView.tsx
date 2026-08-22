import React, { useState, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown, 
  ThumbsDown, 
  CheckCircle2, 
  Music2,
  Plus,
  Film,
  Bookmark,
  Trash2
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from '../feed/CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

export const ShortsFeedView: React.FC = () => {
  const { 
    clips, 
    addClip,
    deletePost,
    toggleClipLike, 
    toggleClipDislike, 
    toggleClipBookmark,
    addClipComment, 
    openShareModal, 
    allUsers, 
    currentUser,
    toggleFollowUser,
    isFollowing,
    isMutualFriend,
    openUserProfileModal,
    isBlocked
  } = useWevids();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // STRICT VIDEO FILTER: Exclude any items that do not possess a genuine videoUrl
  const validClips = (clips || []).filter(c => 
    Boolean(c?.videoUrl && c.videoUrl.length > 5 && !isBlocked(c.userId))
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('clips-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'clips' },
        (payload: any) => {
          if (payload?.new && payload.new.videoUrl) {
            sounds.success();
            toast.info(`New short clip: "${payload.new.title}"!`);
            addClip(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (validClips.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl liquid-glass border border-[#ff2d95]/40 flex items-center justify-center mx-auto text-[#ff2d95] shadow-2xl">
          <Film className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="font-orbitron font-bold text-2xl text-white">No Video Clips Uploaded Yet</h2>
          <p className="text-xs text-[#8a8aa8]">
            Vertical short videos appear here in full 60FPS. Pure text posts are strictly routed to the Community Feed.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.pop();
            setIsCreateOpen(true);
          }}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>UPLOAD FIRST SHORT CLIP</span>
        </button>

        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          defaultTarget="clips"
        />
      </div>
    );
  }

  const activeClip = validClips[currentIndex] || validClips[0];
  const clipAuthor = allUsers[activeClip?.userId] || currentUser;
  const isUserFollowing = isFollowing(activeClip?.userId);
  const isFriend = isMutualFriend(activeClip?.userId);
  const isMine = activeClip?.userId === currentUser?.id;

  const handleNext = () => {
    sounds.pop();
    setCurrentIndex(prev => (prev + 1) % validClips.length);
  };

  const handlePrev = () => {
    sounds.pop();
    setCurrentIndex(prev => (prev - 1 + validClips.length) % validClips.length);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 justify-center items-start pb-20 max-w-5xl mx-auto">
      <div className="relative w-full max-w-[440px] mx-auto h-[680px] rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex items-center justify-center bg-black">
        <video
          key={activeClip.id}
          src={activeClip.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />

        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 font-orbitron">
            CLIP {currentIndex + 1}/{validClips.length}
          </span>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {isMine && (
            <button
              onClick={() => deletePost(activeClip.id)}
              className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-red-500 transition-all border border-white/10 shadow-lg"
              title="Delete My Clip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              sounds.pop();
              setIsCreateOpen(true);
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#00e5ff] hover:text-slate-900 transition-all border border-white/10 shadow-lg"
            title="Upload Clip"
          >
            <Plus className="w-4 h-4" />
          </button>

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

        {validClips.length > 1 && (
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
        )}

        <div className="absolute bottom-0 left-0 right-16 p-5 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent space-y-2">
          <div className="flex items-center gap-2.5">
            <div 
              onClick={() => openUserProfileModal(clipAuthor)}
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md cursor-pointer hover:scale-105 transition-transform"
              style={{ background: clipAuthor?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
            >
              {clipAuthor?.avatarImage ? (
                <img src={clipAuthor.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                clipAuthor?.avatar || 'U'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div 
                onClick={() => openUserProfileModal(clipAuthor)}
                className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-[#00e5ff]"
              >
                <span>{clipAuthor?.name || 'Creator'}</span>
                {clipAuthor?.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
              </div>
              <div className="text-[10px] text-[#8a8aa8]">{clipAuthor?.handle || '@creator'}</div>
            </div>

            {clipAuthor?.id !== currentUser?.id && (
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

        {/* Right Floating Actions */}
        <div className="absolute right-3 bottom-6 z-20 flex flex-col items-center gap-3.5">
          <button onClick={() => toggleClipLike(activeClip.id)} className="flex flex-col items-center group">
            <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
              activeClip.isLiked 
                ? 'bg-[#ff2d95] text-white scale-110 shadow-[0_0_18px_rgba(255,45,149,0.8)]' 
                : 'bg-black/60 text-white hover:bg-[#ff2d95]/40 border border-white/10'
            }`}>
              <Heart className={`w-5 h-5 ${activeClip.isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{(Number(activeClip.likes) || 0).toLocaleString()}</span>
          </button>

          <button onClick={() => toggleClipDislike(activeClip.id)} className="flex flex-col items-center group">
            <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
              activeClip.isDisliked ? 'bg-slate-700 text-white' : 'bg-black/60 text-white hover:bg-white/10 border border-white/10'
            }`}>
              <ThumbsDown className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{activeClip.dislikes || 0}</span>
          </button>

          <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center group">
            <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#00e5ff]/40 transition-all border border-white/10 shadow-lg">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{activeClip.comments?.length || 0}</span>
          </button>

          <button onClick={() => toggleClipBookmark(activeClip.id)} className="flex flex-col items-center group">
            <div className={`p-3 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg ${activeClip.isBookmarked ? 'bg-[#fbbf24] text-slate-900' : 'bg-black/60 text-white hover:bg-white/10'}`}>
              <Bookmark className={`w-5 h-5 ${activeClip.isBookmarked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white mt-1 drop-shadow">Save</span>
          </button>

          <button onClick={() => openShareModal(activeClip.title, `https://wevids.app/clip/${activeClip.id}`)} className="flex flex-col items-center group">
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
              Clip Comments ({activeClip.comments?.length || 0})
            </h3>
            <button onClick={() => setShowComments(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {!activeClip.comments || activeClip.comments.length === 0 ? (
              <div className="text-center py-20 text-xs text-[#8a8aa8]">
                No comments yet! Post a reaction.
              </div>
            ) : (
              activeClip.comments.map(c => (
                <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.userName}</span>
                    <span className="text-[10px] text-[#8a8aa8]">{c.timestamp}</span>
                  </div>
                  {c.text && <p className="text-xs text-[#e8e8f4] leading-relaxed">{c.text}</p>}
                </div>
              ))
            )}
          </div>

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
              placeholder="Write a comment..."
            />
          </div>
        </div>
      )}

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultTarget="clips"
      />
    </div>
  );
};