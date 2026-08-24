import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Trash2,
  Play,
  Sparkles,
  Gauge,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from '../feed/CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { ShortClipItem, CommentItem } from '../../types/wevids';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { RELIABLE_VIDEO_STREAMS } from '../../lib/videoUtils';
import { toast } from 'sonner';

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

// Guaranteed playable source for a clip
const getClipStream = (clip: ShortClipItem, index: number): string => {
  const candidate = clip.videoUrl;
  if (candidate && candidate.startsWith('https://')) return candidate;
  return RELIABLE_VIDEO_STREAMS[index % RELIABLE_VIDEO_STREAMS.length];
};

interface ShortCardProps {
  clip: ShortClipItem;
  index: number;
  totalClips: number;
  isActive: boolean;
  isMuted: boolean;
  playbackSpeed: number;
  onToggleMute: () => void;
  onToggleLike: (id: string) => void;
  onToggleDislike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onShare: (title: string, id: string) => void;
  onOpenComments: (clip: ShortClipItem) => void;
  onDeleteClip: (id: string) => void;
  onUploadClick: () => void;
  onFollowToggle: (userId: string) => void;
  onProfileClick: (user: any) => void;
  onCycleSpeed: () => void;
  isFollowingUser: boolean;
  isMutualFriendUser: boolean;
  isMyClip: boolean;
  authorUser: any;
}

const SingleShortCard: React.FC<ShortCardProps> = ({
  clip,
  index,
  totalClips,
  isActive,
  isMuted,
  playbackSpeed,
  onToggleMute,
  onToggleLike,
  onToggleDislike,
  onToggleBookmark,
  onShare,
  onOpenComments,
  onDeleteClip,
  onUploadClick,
  onFollowToggle,
  onProfileClick,
  onCycleSpeed,
  isFollowingUser,
  isMutualFriendUser,
  isMyClip,
  authorUser
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarFillRef = useRef<HTMLDivElement | null>(null);
  const progressBarContainerRef = useRef<HTMLDivElement | null>(null);
  const timeLabelRef = useRef<HTMLSpanElement | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => getClipStream(clip, index));
  const [streamFailed, setStreamFailed] = useState(false);

  const clearLoadTimeout = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  // Reset when clip changes
  useEffect(() => {
    setCurrentSrc(getClipStream(clip, index));
    setStreamFailed(false);
    setIsLoading(false);
    setIsPlaying(false);
    clearLoadTimeout();
  }, [clip.id, clip.videoUrl, index]);

  // Playback control
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
    video.muted = isMuted;

    if (isActive && !streamFailed) {
      setIsLoading(true);
      clearLoadTimeout();

      // Auto-hide loading after 3 seconds no matter what
      loadTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsLoading(false);
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay muted fallback
            video.muted = true;
            video.play()
              .then(() => {
                setIsLoading(false);
                setIsPlaying(true);
              })
              .catch(() => {
                setIsLoading(false);
                setIsPlaying(false);
              });
          });
      }
    } else {
      clearLoadTimeout();
      video.pause();
      try { video.currentTime = 0; } catch {}
      setIsPlaying(false);
      setIsLoading(false);
    }

    return () => {
      clearLoadTimeout();
    };
  }, [isActive, isMuted, playbackSpeed, currentSrc, streamFailed]);

  const handleVideoError = () => {
    // Switch to reliable fallback only once
    if (!streamFailed) {
      setStreamFailed(true);
      setCurrentSrc(RELIABLE_VIDEO_STREAMS[(index + 1) % RELIABLE_VIDEO_STREAMS.length]);
      setIsLoading(false);
    } else {
      // Give up, show error but not loading
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    const cur = video.currentTime;
    const dur = video.duration || 1;
    const pct = Math.min(100, Math.max(0, (cur / dur) * 100));

    if (progressBarFillRef.current) progressBarFillRef.current.style.width = `${pct}%`;
    if (timeLabelRef.current) {
      const fmt = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };
      timeLabelRef.current.innerText = `${fmt(cur)} / ${fmt(dur)}`;
    }
  };

  const handleTogglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      setIsLoading(true);
      video.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(() => { setIsPlaying(false); setIsLoading(false); });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleDoubleTapLike = () => {
    sounds.like();
    setShowHeartOverlay(true);
    if (!clip.isLiked) onToggleLike(clip.id);
    setTimeout(() => setShowHeartOverlay(false), 800);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarContainerRef.current || !videoRef.current) return;
    const rect = progressBarContainerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = clickX / rect.width;
    const newTime = newPercent * (videoRef.current.duration || 1);
    videoRef.current.currentTime = newTime;
    if (progressBarFillRef.current) progressBarFillRef.current.style.width = `${newPercent * 100}%`;
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStreamFailed(false);
    setCurrentSrc(RELIABLE_VIDEO_STREAMS[index % RELIABLE_VIDEO_STREAMS.length]);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div
      onDoubleClick={handleDoubleTapLike}
      className="shorts-snap-item relative w-full h-[calc(100vh-8rem)] max-h-[750px] min-h-[480px] rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-2xl flex items-center justify-center bg-slate-900 select-none group shrink-0"
    >
      {showHeartOverlay && (
        <div className="absolute z-40 inset-0 flex items-center justify-center pointer-events-none animate-spring-pop">
          <Heart className="w-28 h-28 text-[#ff2d95] fill-current drop-shadow-[0_0_35px_#ff2d95] animate-ping" />
        </div>
      )}

      <video
        ref={videoRef}
        src={currentSrc}
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onCanPlayThrough={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        onPlaying={() => { setIsLoading(false); setIsPlaying(true); }}
        onWaiting={() => setIsLoading(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        onClick={handleTogglePlayPause}
        className="absolute inset-0 w-full h-full object-cover rounded-3xl cursor-pointer"
      />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/55 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin drop-shadow" />
            <span className="text-[10px] font-orbitron text-white/70 tracking-widest">LOADING FEED</span>
          </div>
        </div>
      )}

      {streamFailed && !isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-900/80 p-6 text-center">
          <div className="text-3xl mb-2">📡</div>
          <p className="text-xs text-white font-bold mb-3">Video stream unavailable</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-bold text-xs"
          >
            RETRY STREAM
          </button>
        </div>
      )}

      {isActive && !isPlaying && !isLoading && !streamFailed && (
        <div
          onClick={handleTogglePlayPause}
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/30 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-slate-900/75 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-current text-[#00e5ff] ml-1" />
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 font-orbitron flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-[#ff2d95]" />
          CLIP {index + 1}/{totalClips}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCycleSpeed(); }}
          className="px-2.5 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-[10px] font-bold text-[#fbbf24] border border-[#fbbf24]/40 font-orbitron flex items-center gap-1 hover:scale-105 transition-transform"
        >
          <Gauge className="w-3 h-3" />
          <span>{playbackSpeed}x</span>
        </button>
      </div>

      {/* Right controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {isMyClip && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteClip(clip.id); }}
            className="p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-red-500 transition-all border border-white/10 shadow-lg"
            title="Delete My Clip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUploadClick(); }}
          className="p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-[#00e5ff] hover:text-slate-900 transition-all border border-white/10 shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="p-2.5 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-[#ff2d95] transition-all border border-white/10 shadow-lg"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00e5ff]" />}
        </button>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-4 left-0 right-16 p-5 z-20 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent space-y-2 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div
            onClick={() => onProfileClick(authorUser)}
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md cursor-pointer hover:scale-105 transition-transform"
            style={{ background: authorUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
          >
            {authorUser?.avatarImage ? <img src={authorUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : authorUser?.avatar || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div onClick={() => onProfileClick(authorUser)} className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-[#00e5ff]">
              <span>{authorUser?.name || 'Creator'}</span>
              {authorUser?.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
            </div>
            <div className="text-[10px] text-[#94a3b8]">{authorUser?.handle || '@creator'}</div>
          </div>
          {!isMyClip && (
            <button
              type="button"
              onClick={() => onFollowToggle(authorUser.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold font-orbitron transition-all shadow-md flex items-center gap-1 ${
                isMutualFriendUser ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900' : isFollowingUser ? 'bg-white/15 text-[#00e5ff] border border-[#00e5ff]/40' : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900'
              }`}
            >
              {isMutualFriendUser ? 'Friends 🤝' : isFollowingUser ? 'Following' : '+ Follow'}
            </button>
          )}
        </div>
        <h2 className="text-sm font-bold text-white drop-shadow pointer-events-auto leading-snug">{clip.title}</h2>
        <p className="text-xs text-[#e8e8f4]/90 line-clamp-2 drop-shadow pointer-events-auto">{clip.description}</p>
        <div className="flex items-center gap-2 text-[11px] text-[#00e5ff] font-medium bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 inline-flex pointer-events-auto">
          <Music2 className="w-3 h-3 text-[#ff2d95] animate-pulse" />
          <span className="truncate max-w-[180px]">{clip.audioTrack || 'Original Audio Track'}</span>
        </div>
      </div>

      {/* Right action column */}
      <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-3.5">
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleLike(clip.id); }} className="flex flex-col items-center group">
          <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${clip.isLiked ? 'bg-[#ff2d95] text-white scale-110 shadow-[0_0_20px_rgba(255,45,149,0.8)]' : 'bg-slate-900/60 text-white hover:bg-[#ff2d95]/40 border border-white/10'}`}>
            <Heart className={`w-5 h-5 ${clip.isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{(Number(clip.likes) || 0).toLocaleString()}</span>
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleDislike(clip.id); }} className="flex flex-col items-center group">
          <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${clip.isDisliked ? 'bg-slate-700 text-white' : 'bg-slate-900/60 text-white hover:bg-white/10 border border-white/10'}`}>
            <ThumbsDown className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{clip.dislikes || 0}</span>
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onOpenComments(clip); }} className="flex flex-col items-center group">
          <div className="p-3 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-[#00e5ff]/40 transition-all border border-white/10 shadow-lg">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{clip.comments?.length || 0}</span>
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleBookmark(clip.id); }} className="flex flex-col items-center group">
          <div className={`p-3 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg ${clip.isBookmarked ? 'bg-[#fbbf24] text-slate-900' : 'bg-slate-900/60 text-white hover:bg-white/10'}`}>
            <Bookmark className={`w-5 h-5 ${clip.isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">Save</span>
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onShare(clip.title, clip.id); }} className="flex flex-col items-center group">
          <div className="p-3 rounded-full bg-slate-900/60 backdrop-blur-md text-white hover:bg-[#ff2d95]/40 transition-all border border-white/10 shadow-lg">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">Share</span>
        </button>
      </div>

      {/* Progress bar */}
      <div ref={progressBarContainerRef} onClick={handleSeek} className="absolute bottom-0 left-0 right-0 h-2 bg-white/20 hover:h-3 cursor-pointer z-30 transition-all flex items-end">
        <div ref={progressBarFillRef} className="h-full bg-gradient-to-r from-[#ff2d95] via-[#00e5ff] to-[#10b981] transition-all duration-75 shadow-[0_0_12px_#00e5ff]" style={{ width: '0%' }} />
      </div>
      <span ref={timeLabelRef} className="absolute bottom-3 right-4 text-[9px] font-mono text-white/70 bg-slate-900/50 px-2 py-0.5 rounded backdrop-blur z-20 pointer-events-none">0:00 / 0:00</span>
    </div>
  );
};

export const ShortsFeedView: React.FC = () => {
  const {
    clips,
    deleteClip,
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
    isBlocked,
    syncWithSupabase
  } = useWevids();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [commentingClipId, setCommentingClipId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase.channel('realtime_clips_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clips' }, () => syncWithSupabase(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [syncWithSupabase]);

  const validClips = useMemo(() => {
    return (clips || []).filter(c => {
      if (!c || isBlocked(c.userId)) return false;
      return true; // We'll handle invalid video as fallback
    });
  }, [clips, isBlocked]);

  const activeCommentingClip = validClips.find(c => c.id === commentingClipId) || null;

  const scrollToIndex = useCallback((idx: number) => {
    const safeIndex = Math.max(0, Math.min(validClips.length - 1, idx));
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.shorts-snap-item');
    const target = items[safeIndex] as HTMLElement;
    if (target) {
      container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
      setActiveIndex(safeIndex);
    }
  }, [validClips.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'j', 'J'].includes(e.key)) {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (['ArrowUp', 'k', 'K'].includes(e.key)) {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (['m', 'M'].includes(e.key)) {
        setIsMuted(m => !m);
        sounds.pop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToIndex]);

  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLockRef.current) return;
    if (Math.abs(e.deltaY) > 20) {
      wheelLockRef.current = true;
      const direction = e.deltaY > 0 ? 1 : -1;
      scrollToIndex(activeIndex + direction);
      setTimeout(() => { wheelLockRef.current = false; }, 450);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.shorts-snap-item');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Array.from(items).indexOf(entry.target);
          if (index !== -1) setActiveIndex(index);
        }
      });
    }, { root: container, threshold: 0.5 });
    items.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [validClips.length]);

  const cyclePlaybackSpeed = () => {
    sounds.click();
    setPlaybackSpeed(prev => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
  };

  const handleToggleLikeWithCloudSync = async (clipId: string) => {
    toggleClipLike(clipId);
    if (!isSupabaseConfigured()) return;
    try {
      const targetClip = clips.find(c => c.id === clipId);
      const newLikes = targetClip?.isLiked ? Math.max(0, (targetClip.likes || 1) - 1) : ((targetClip?.likes || 0) + 1);
      await supabase.from('clips').update({ likes: newLikes }).eq('id', clipId);
    } catch {}
  };

  if (validClips.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl liquid-glass border border-[#ff2d95]/40 flex items-center justify-center mx-auto text-[#ff2d95] shadow-2xl">
          <Film className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="font-orbitron font-bold text-2xl text-white">Upload Your First Short Clip</h2>
        <p className="text-xs text-[#94a3b8]">Vertical short videos stream here in smooth 60FPS with snap-scroll controls.</p>
        <button
          type="button"
          onClick={() => { sounds.pop(); setIsCreateOpen(true); }}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> UPLOAD FIRST SHORT CLIP
        </button>
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} defaultTarget="clips" />
      </div>
    );
  }

  return (
    <div className="relative flex justify-center items-center pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3.5 absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-[#00e5ff] text-white hover:text-slate-900 transition-all disabled:opacity-30 border border-white/20 shadow-2xl backdrop-blur-md"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === validClips.length - 1}
          className="p-3 rounded-2xl bg-slate-900/80 hover:bg-[#ff2d95] text-white hover:text-slate-900 transition-all disabled:opacity-30 border border-white/20 shadow-2xl backdrop-blur-md"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheelScroll}
        className="shorts-snap-container no-scrollbar w-full max-w-[420px] h-[calc(100vh-8rem)] max-h-[750px] min-h-[480px] overflow-y-auto relative rounded-3xl"
      >
        {validClips.map((clip, index) => {
          const authorUser = allUsers[clip.userId] || currentUser;
          const isMine = clip.userId === currentUser?.id;
          const isFollowingUser = isFollowing(clip.userId);
          const isMutualFriendUser = isMutualFriend(clip.userId);

          return (
            <SingleShortCard
              key={clip.id}
              clip={clip}
              index={index}
              totalClips={validClips.length}
              isActive={index === activeIndex}
              isMuted={isMuted}
              playbackSpeed={playbackSpeed}
              onToggleMute={() => { sounds.pop(); setIsMuted(m => !m); }}
              onToggleLike={handleToggleLikeWithCloudSync}
              onToggleDislike={toggleClipDislike}
              onToggleBookmark={toggleClipBookmark}
              onShare={(title, id) => openShareModal(title, `https://wevids.app/clip/${id}`)}
              onOpenComments={(c) => setCommentingClipId(c.id)}
              onDeleteClip={deleteClip}
              onUploadClick={() => setIsCreateOpen(true)}
              onFollowToggle={toggleFollowUser}
              onProfileClick={openUserProfileModal}
              onCycleSpeed={cyclePlaybackSpeed}
              isFollowingUser={isFollowingUser}
              isMutualFriendUser={isMutualFriendUser}
              isMyClip={isMine}
              authorUser={authorUser}
            />
          );
        })}
      </div>

      {activeCommentingClip && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-md liquid-glass rounded-3xl p-5 border border-white/20 shadow-2xl flex flex-col h-[520px] animate-spring-pop">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                Comments ({activeCommentingClip.comments?.length || 0})
              </h3>
              <button type="button" onClick={() => setCommentingClipId(null)} className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {!activeCommentingClip.comments || activeCommentingClip.comments.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#94a3b8]">No comments yet! Be the first to share your reaction.</div>
              ) : (
                activeCommentingClip.comments.map((c: CommentItem) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{c.userName}</span>
                      <span className="text-[10px] text-[#94a3b8]">{c.timestamp}</span>
                    </div>
                    {c.text && <p className="text-xs text-[#e8e8f4] leading-relaxed">{c.text}</p>}
                    {c.media && (
                      <div className="rounded-xl overflow-hidden max-h-32 border border-white/10 mt-1">
                        <img src={c.media} alt="Comment media" className="w-full h-full object-cover max-h-32" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="pt-2 border-t border-white/10">
              <RichCommentInput
                onSend={(comment) => {
                  addClipComment(activeCommentingClip.id, {
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
        </div>
      )}

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} defaultTarget="clips" />
    </div>
  );
};

// Export resolution helper for DualFeedView compatibility
export const resolveClipVideoUrl = (clip: ShortClipItem, fallbackIndex = 0): string => {
  const url = clip.videoUrl;
  if (url && url.startsWith('https://')) return url;
  return RELIABLE_VIDEO_STREAMS[fallbackIndex % RELIABLE_VIDEO_STREAMS.length];
};