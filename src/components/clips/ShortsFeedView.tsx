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
  TimerReset,
  Repeat2,
  MoreHorizontal,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from '../feed/CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { ShortClipItem, CommentItem } from '../../types/wevids';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { RELIABLE_VIDEO_STREAMS } from '../../lib/videoUtils';
import { toast } from 'sonner';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

const getClipStream = (clip: ShortClipItem, index: number): string => {
  const candidate = clip.videoUrl;
  if (candidate && candidate.startsWith('https://')) return candidate;
  return RELIABLE_VIDEO_STREAMS[index % RELIABLE_VIDEO_STREAMS.length];
};

type ReactionState = {
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
};

function useShortReaction(clip: ShortClipItem) {
  const [reaction, setReaction] = useState<ReactionState>(() => ({
    likes: Number(clip.likes) || 0,
    dislikes: Number(clip.dislikes) || 0,
    isLiked: Boolean(clip.isLiked),
    isDisliked: Boolean(clip.isDisliked),
  }));

  const lockedRef = useRef(false);
  const lastAppliedRef = useRef(
    `${clip.id}-${clip.likes}-${clip.dislikes}-${clip.isLiked}-${clip.isDisliked}`
  );

  useEffect(() => {
    const signature = `${clip.id}-${clip.likes}-${clip.dislikes}-${clip.isLiked}-${clip.isDisliked}`;
    if (lockedRef.current || signature === lastAppliedRef.current) return;
    lastAppliedRef.current = signature;
    setReaction({
      likes: Number(clip.likes) || 0,
      dislikes: Number(clip.dislikes) || 0,
      isLiked: Boolean(clip.isLiked),
      isDisliked: Boolean(clip.isDisliked),
    });
  }, [clip.id, clip.likes, clip.dislikes, clip.isLiked, clip.isDisliked]);

  const persist = useCallback(
    async (next: ReactionState) => {
      if (!isSupabaseConfigured()) return;
      try {
        await supabase
          .from('clips')
          .update({ likes: next.likes, dislikes: next.dislikes })
          .eq('id', clip.id);
      } catch (err) {
        console.warn('[Shorts] Reaction save skipped:', err);
      }
    },
    [clip.id]
  );

  const like = useCallback(async () => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    setReaction((prev) => {
      const nextLiked = !prev.isLiked;
      const next: ReactionState = {
        likes: nextLiked ? prev.likes + 1 : Math.max(0, prev.likes - 1),
        dislikes: nextLiked ? 0 : prev.dislikes,
        isLiked: nextLiked,
        isDisliked: false,
      };

      persist(next).finally(() => {
        lastAppliedRef.current = `${clip.id}-${next.likes}-${next.dislikes}-${next.isLiked}-${next.isDisliked}`;
        lockedRef.current = false;
      });

      return next;
    });
  }, [clip.id, persist]);

  const dislike = useCallback(async () => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    setReaction((prev) => {
      const nextDisliked = !prev.isDisliked;
      const next: ReactionState = {
        likes: nextDisliked ? 0 : prev.likes,
        dislikes: nextDisliked ? prev.dislikes + 1 : Math.max(0, prev.dislikes - 1),
        isLiked: false,
        isDisliked: nextDisliked,
      };

      persist(next).finally(() => {
        lastAppliedRef.current = `${clip.id}-${next.likes}-${next.dislikes}-${next.isLiked}-${next.isDisliked}`;
        lockedRef.current = false;
      });

      return next;
    });
  }, [clip.id, persist]);

  return { reaction, like, dislike };
}

interface ShortCardProps {
  clip: ShortClipItem;
  index: number;
  totalClips: number;
  isActive: boolean;
  isMuted: boolean;
  playbackSpeed: number;
  onSelectSpeed: (speed: number) => void;
  onToggleMute: () => void;
  onToggleBookmark: (id: string) => void;
  onShare: (title: string, id: string) => void;
  onOpenComments: (clip: ShortClipItem) => void;
  onDeleteClip: (id: string) => void;
  onUploadClick: () => void;
  onFollowToggle: (userId: string) => void;
  onProfileClick: (user: any) => void;
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
  onSelectSpeed,
  onToggleMute,
  onToggleBookmark,
  onShare,
  onOpenComments,
  onDeleteClip,
  onUploadClick,
  onFollowToggle,
  onProfileClick,
  isFollowingUser,
  isMutualFriendUser,
  isMyClip,
  authorUser,
}) => {
  const { reaction, like, dislike } = useShortReaction(clip);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressBarFillRef = useRef<HTMLDivElement | null>(null);
  const progressBarContainerRef = useRef<HTMLDivElement | null>(null);
  const timeLabelRef = useRef<HTMLSpanElement | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => getClipStream(clip, index));
  const [streamFailed, setStreamFailed] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const [isSpeedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);

  const clearLoadTimeout = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const closeMenus = () => {
    setSpeedMenuOpen(false);
    setMoreMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenus();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentSrc(getClipStream(clip, index));
    setStreamFailed(false);
    setIsLoading(false);
    setIsPlaying(false);
    clearLoadTimeout();
    closeMenus();
  }, [clip.id, clip.videoUrl, index]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playbackSpeed;
    video.muted = isMuted;

    if (isActive && !streamFailed) {
      setIsLoading(true);
      clearLoadTimeout();

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
    if (!streamFailed) {
      setStreamFailed(true);
      setCurrentSrc(RELIABLE_VIDEO_STREAMS[(index + 1) % RELIABLE_VIDEO_STREAMS.length]);
      setIsLoading(false);
    } else {
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

  const handleRestartClip = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => { setIsPlaying(true); setIsLoading(false); })
        .catch(() => { setIsPlaying(false); setIsLoading(false); });
    }
    sounds.pop();
    toast('Restarted clip');
    setMoreMenuOpen(false);
  };

  const handleDoubleTapLike = () => {
    if (reaction.isLiked) return;

    setShowHeartOverlay(true);
    setHeartPulse(true);
    like();
    setTimeout(() => {
      setShowHeartOverlay(false);
      setHeartPulse(false);
    }, 800);
  };

  const handleLikePress = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!reaction.isLiked) {
      setShowHeartOverlay(true);
      setHeartPulse(true);
      setTimeout(() => {
        setShowHeartOverlay(false);
        setHeartPulse(false);
      }, 800);
      sounds.pop();
    } else {
      sounds.click();
    }

    like();
  };

  const handleDislikePress = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.click();
    dislike();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarContainerRef.current || !videoRef.current) return;

    const rect = progressBarContainerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = clickX / rect.width;
    const newTime = newPercent * (videoRef.current.duration || 1);

    videoRef.current.currentTime = newTime;

    if (progressBarFillRef.current) {
      progressBarFillRef.current.style.width = `${newPercent * 100}%`;
    }
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

  const handleCopyLink = () => {
    sounds.click();
    navigator.clipboard?.writeText(`https://wevids.app/clip/${clip.id}`).catch(() => {});
    setMoreMenuOpen(false);
    toast.success('Clip link copied');
  };

  return (
    <div
      onDoubleClick={handleDoubleTapLike}
      className="shorts-snap-item relative w-full h-[calc(100vh-8rem)] max-h-[750px] min-h-[480px] rounded-[2rem] overflow-hidden liquid-glass border border-white/15 shadow-[0_0_60px_rgba(0,229,255,0.18)] flex items-center justify-center bg-slate-950 select-none group shrink-0"
    >
      {isActive && (
        <div className="absolute -inset-1 rounded-[2.1rem] pointer-events-none z-0 opacity-60">
          <div className="absolute inset-0 rounded-[2.1rem] bg-[conic-gradient(from_0deg,#ff2d95,#00e5ff,#10b981,#ff2d95)] blur-lg animate-spin-slow" />
        </div>
      )}

      {showHeartOverlay && (
        <div className="absolute z-40 inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <Heart className={`w-24 h-24 text-[#ff2d95] fill-current drop-shadow-[0_0_35px_#ff2d95] ${heartPulse ? 'animate-spring-pop' : ''}`} />
          </div>
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
        className="absolute inset-0 w-full h-full object-cover rounded-[2rem] cursor-pointer"
      />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin drop-shadow-[0_0_12px_#00e5ff]" />
              <div className="absolute inset-0 rounded-full border border-[#00e5ff]/30 animate-ping" />
            </div>
            <span className="text-[10px] font-orbitron text-white/70 tracking-widest">LOADING FEED</span>
          </div>
        </div>
      )}

      {streamFailed && !isLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 p-6 text-center">
          <div className="text-3xl mb-2">📡</div>
          <p className="text-xs text-white font-bold mb-3">Video stream unavailable</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:scale-105 transition-transform"
          >
            RETRY STREAM
          </button>
        </div>
      )}

      {isActive && !isPlaying && !isLoading && !streamFailed && (
        <div
          onClick={handleTogglePlayPause}
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/30 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-slate-950/75 border border-[#00e5ff]/40 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:scale-110 transition-transform">
            <Play className="w-7 h-7 fill-current text-[#00e5ff] ml-1" />
          </div>
        </div>
      )}

      {/* Compact top left controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 font-orbitron">
          <Sparkles className="w-3 h-3 text-[#ff2d95] inline mr-1 -mt-0.5" />
          {index + 1}/{totalClips}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.click();
              setSpeedMenuOpen((prev) => !prev);
              setMoreMenuOpen(false);
            }}
            className={`px-2 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-[10px] font-bold border font-orbitron flex items-center gap-1 hover:scale-105 transition-transform shadow-[0_0_8px_rgba(0,229,255,0.2)] ${
              playbackSpeed === 1
                ? 'text-[#fbbf24] border-[#fbbf24]/40'
                : 'text-[#ff2d95] border-[#ff2d95]/60'
            }`}
          >
            <Gauge className="w-3 h-3" />
            <span>{playbackSpeed}x</span>
          </button>

          {isSpeedMenuOpen && (
            <div className="absolute left-0 top-8 w-32 rounded-2xl liquid-glass border border-white/20 p-1.5 space-y-1 shadow-2xl z-50">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSpeed(speed);
                    setSpeedMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] font-orbitron font-bold transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-950'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {speed}x <span className="opacity-60">{speed === 0.5 ? 'slow' : speed === 3 ? 'turbo' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compact top right controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        {isMyClip && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteClip(clip.id); }}
            className="p-1.5 rounded-full bg-slate-950/60 backdrop-blur-md text-white hover:bg-red-500 transition-all border border-white/10"
            title="Delete My Clip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className="p-1.5 rounded-full bg-slate-950/60 backdrop-blur-md text-white hover:bg-[#ff2d95] transition-all border border-white/10"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sounds.click();
              setMoreMenuOpen((prev) => !prev);
              setSpeedMenuOpen(false);
            }}
            className="p-1.5 rounded-full bg-slate-950/60 backdrop-blur-md text-white hover:bg-[#fbbf24] transition-all border border-white/10"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-[#fbbf24]" />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute right-0 top-8 w-44 rounded-2xl liquid-glass border border-white/20 p-1.5 space-y-1 shadow-2xl z-50">
              <button
                type="button"
                onClick={handleRestartClip}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] text-white hover:bg-white/10 flex items-center gap-2"
              >
                <TimerReset className="w-3.5 h-3.5 text-[#10b981]" /> Restart Clip
              </button>
              <button
                type="button"
                onClick={() => {
                  onUploadClick();
                  setMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-[#00e5ff]" /> Upload Clip
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-[#00e5ff]" /> Copy Link
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(getClipStream(clip, index), '_blank', 'noopener,noreferrer');
                  setMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] text-white hover:bg-white/10 flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#10b981]" /> Full Video
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(clip.title, clip.id);
                  setMoreMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-[#ff2d95]" /> Share Clip
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact bottom info */}
      <div className="absolute bottom-3 left-3 right-14 z-20 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent px-3 pt-6 pb-2 rounded-b-[2rem] pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            onClick={() => onProfileClick(authorUser)}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px] shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
            style={{ background: authorUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
          >
            {authorUser?.avatarImage ? <img src={authorUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : authorUser?.avatar || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div onClick={() => onProfileClick(authorUser)} className="text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer hover:text-[#00e5ff]">
              <span className="truncate">{authorUser?.name || 'Creator'}</span>
              {authorUser?.verified && <CheckCircle2 className="w-3 h-3 text-[#00e5ff] shrink-0" />}
            </div>
            <div className="text-[9px] text-[#94a3b8]">{authorUser?.handle || '@creator'}</div>
          </div>
          {!isMyClip && (
            <button
              type="button"
              onClick={() => onFollowToggle(authorUser.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold font-orbitron transition-all shadow-md shrink-0 ${
                isMutualFriendUser
                  ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-950'
                  : isFollowingUser
                  ? 'bg-white/15 text-[#00e5ff] border border-[#00e5ff]/40'
                  : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-950'
              }`}
            >
              {isMutualFriendUser ? 'Friends' : isFollowingUser ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <h2 className="mt-1 text-xs font-bold text-white drop-shadow line-clamp-1 pointer-events-auto">{clip.title}</h2>
        <p className="text-[10px] text-[#e8e8f4]/90 line-clamp-1 drop-shadow pointer-events-auto">{clip.description}</p>

        <div className="mt-1 flex items-center gap-1.5 text-[9px] text-[#00e5ff] font-medium bg-slate-950/50 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 inline-flex pointer-events-auto">
          <Music2 className="w-2.5 h-2.5 text-[#ff2d95] animate-pulse" />
          <span className="truncate max-w-[150px]">{clip.audioTrack || 'Original Audio Track'}</span>
        </div>
      </div>

      {/* Compact right action column */}
      <div className="absolute right-2.5 bottom-10 z-20 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={handleLikePress}
          className="flex flex-col items-center group"
        >
          <div className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
            reaction.isLiked
              ? 'bg-[#ff2d95]/90 text-white scale-110 shadow-[0_0_18px_rgba(255,45,149,0.85)] border border-[#ff2d95]'
              : 'bg-slate-950/65 text-white hover:bg-[#ff2d95]/30 border border-white/15 hover:border-[#ff2d95]/60'
          }`}>
            <Heart className={`w-4 h-4 ${reaction.isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[9px] font-bold text-white mt-1 drop-shadow">{reaction.likes.toLocaleString()}</span>
        </button>

        <button
          type="button"
          onClick={handleDislikePress}
          className="flex flex-col items-center group"
        >
          <div className={`p-2.5 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg ${
            reaction.isDisliked ? 'bg-[#64748b] text-white border-[#64748b]' : 'bg-slate-950/65 text-white hover:bg-white/10'
          }`}>
            <ThumbsDown className={`w-4 h-4 ${reaction.isDisliked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[9px] font-bold text-white mt-1 drop-shadow">{reaction.dislikes.toLocaleString()}</span>
        </button>

        <button type="button" onClick={(e) => { e.stopPropagation(); onOpenComments(clip); }} className="flex flex-col items-center group">
          <div className="p-2.5 rounded-full bg-slate-950/65 backdrop-blur-md text-white hover:bg-[#00e5ff]/40 transition-all border border-white/10 shadow-lg">
            <MessageCircle className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold text-white mt-1 drop-shadow">{clip.comments?.length || 0}</span>
        </button>

        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleBookmark(clip.id); }} className="flex flex-col items-center group">
          <div className={`p-2.5 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg ${clip.isBookmarked ? 'bg-[#fbbf24] text-slate-950' : 'bg-slate-950/65 text-white hover:bg-white/10'}`}>
            <Bookmark className={`w-4 h-4 ${clip.isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[9px] font-bold text-white mt-1 drop-shadow">Save</span>
        </button>

        <button type="button" onClick={(e) => { e.stopPropagation(); onShare(clip.title, clip.id); }} className="flex flex-col items-center group">
          <div className="p-2.5 rounded-full bg-slate-950/65 backdrop-blur-md text-white hover:bg-[#ff2d95]/40 transition-all border border-white/10 shadow-lg">
            <Share2 className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-bold text-white mt-1 drop-shadow">Share</span>
        </button>
      </div>

      {/* Progress bar */}
      <div ref={progressBarContainerRef} onClick={handleSeek} className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 hover:h-2.5 cursor-pointer z-30 transition-all flex items-end">
        <div ref={progressBarFillRef} className="h-full bg-gradient-to-r from-[#ff2d95] via-[#00e5ff] to-[#10b981] transition-all duration-75 shadow-[0_0_8px_#00e5ff]" style={{ width: '0%' }} />
      </div>
      <span ref={timeLabelRef} className="absolute bottom-2 right-3 text-[8px] font-mono text-white/70 bg-slate-950/50 px-1.5 py-0.5 rounded backdrop-blur z-20 pointer-events-none">0:00 / 0:00</span>
    </div>
  );
};

export const ShortsFeedView: React.FC = () => {
  const {
    clips,
    deleteClip,
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
    syncWithSupabase,
  } = useWevids();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [commentingClipId, setCommentingClipId] = useState<string | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(false);
  const followLockRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase
      .channel('realtime_clips_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clips' }, () => syncWithSupabase(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [syncWithSupabase]);

  const validClips = useMemo(() => {
    return (clips || []).filter((c) => {
      if (!c || isBlocked(c.userId)) return false;
      return true;
    });
  }, [clips, isBlocked]);

  const activeCommentingClip = validClips.find((c) => c.id === commentingClipId) || null;

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
        setIsMuted((m) => !m);
        sounds.pop();
      } else if ([' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
        setAutoAdvance((a) => !a);
        sounds.click();
      } else if (['0', '1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const speedMap: Record<string, number> = {
          '0': 0.5,
          '1': 1,
          '2': 1.5,
          '3': 2,
          '4': 2.5,
          '5': 3,
          '6': 1,
        };
        if (speedMap[e.key] !== undefined) {
          setPlaybackSpeed(speedMap[e.key]);
          sounds.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToIndex]);

  useEffect(() => {
    if (!autoAdvance) return;
    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;
      const items = container.querySelectorAll('.shorts-snap-item');
      if (items.length === 0) return;
      const next = (activeIndex + 1) % items.length;
      const target = items[next] as HTMLElement;
      if (target) {
        container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
        setActiveIndex(next);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoAdvance, activeIndex, validClips.length]);

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(items).indexOf(entry.target);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [validClips.length]);

  const handleSelectSpeed = useCallback((speed: number) => {
    sounds.click();
    setPlaybackSpeed(speed);
  }, []);

  const handleFollowToggle = useCallback(async (userId: string) => {
    if (!currentUser?.id || currentUser.id === userId) return;
    if (followLockRef.current[userId]) return;
    followLockRef.current[userId] = true;
    try {
      await toggleFollowUser(userId);
    } finally {
      delete followLockRef.current[userId];
    }
  }, [currentUser?.id, toggleFollowUser]);

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
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-950 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> UPLOAD FIRST SHORT CLIP
        </button>
        <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} defaultTarget="clips" />
      </div>
    );
  }

  return (
    <div className="relative flex justify-center items-center pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-30">
        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-[#00e5ff] text-white hover:text-slate-950 transition-all disabled:opacity-30 border border-white/20 shadow-xl backdrop-blur-md"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => { sounds.click(); setAutoAdvance((a) => !a); }}
          className={`p-1.5 rounded-xl transition-all border shadow-xl backdrop-blur-md ${
            autoAdvance
              ? 'bg-[#00e5ff] text-slate-950 border-[#00e5ff] shadow-[0_0_16px_rgba(0,229,255,0.6)]'
              : 'bg-slate-950/80 text-white border-white/20 hover:bg-[#fbbf24] hover:text-slate-950'
          }`}
          title="Auto-advance every 5 seconds"
        >
          <Repeat2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === validClips.length - 1}
          className="p-1.5 rounded-xl bg-slate-950/80 hover:bg-[#ff2d95] text-white hover:text-slate-950 transition-all disabled:opacity-30 border border-white/20 shadow-xl backdrop-blur-md"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheelScroll}
        className="shorts-snap-container no-scrollbar w-full max-w-[420px] h-[calc(100vh-8rem)] max-h-[750px] min-h-[480px] overflow-y-auto relative rounded-[2rem]"
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
              onSelectSpeed={handleSelectSpeed}
              onToggleMute={() => { sounds.pop(); setIsMuted((m) => !m); }}
              onToggleBookmark={toggleClipBookmark}
              onShare={(title, id) => openShareModal(title, `https://wevids.app/clip/${id}`)}
              onOpenComments={(c) => setCommentingClipId(c.id)}
              onDeleteClip={deleteClip}
              onUploadClick={() => setIsCreateOpen(true)}
              onFollowToggle={handleFollowToggle}
              onProfileClick={openUserProfileModal}
              isFollowingUser={isFollowingUser}
              isMutualFriendUser={isMutualFriendUser}
              isMyClip={isMine}
              authorUser={authorUser}
            />
          );
        })}
      </div>

      {activeCommentingClip && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
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
                    mediaType: comment.mediaType,
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

export const resolveClipVideoUrl = (clip: ShortClipItem, fallbackIndex = 0): string => {
  const url = clip.videoUrl;
  if (url && url.startsWith('https://')) return url;
  return RELIABLE_VIDEO_STREAMS[fallbackIndex % RELIABLE_VIDEO_STREAMS.length];
};