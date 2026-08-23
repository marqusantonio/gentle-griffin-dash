import React, { useState, useEffect, useRef } from 'react';
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
  Pause, 
  Sparkles, 
  Gauge, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { RichCommentInput } from '../comments/RichCommentInput';
import { CreatePostModal } from '../feed/CreatePostModal';
import { sounds } from '../../lib/soundFx';
import { ShortClipItem, CommentItem } from '../../types/wevids';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

// High-speed, CORS-friendly MP4 vertical and high-compatibility streams
const RELIABLE_BACKUP_STREAMS = [
  'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-neon-city-at-night-42861-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-cyberpunk-look-of-a-man-in-a-futuristic-city-43187-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-gamer-playing-with-neon-lights-in-a-dark-room-43098-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-playing-a-video-game-in-a-dark-room-43100-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-at-a-club-party-43285-large.mp4'
];

const SPEED_OPTIONS = [1, 1.25, 1.5, 2];

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
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  // Compute playable source URL
  const baseSrc = clip.videoUrl || (clip as any).video_url;
  const rawVideoSrc = (fallbackIndex !== null)
    ? RELIABLE_BACKUP_STREAMS[fallbackIndex % RELIABLE_BACKUP_STREAMS.length]
    : (baseSrc && typeof baseSrc === 'string' && baseSrc.length > 8)
      ? baseSrc
      : RELIABLE_BACKUP_STREAMS[index % RELIABLE_BACKUP_STREAMS.length];

  // Dynamic Autoplay / Pause based on active viewport state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.playbackRate = playbackSpeed;
      video.muted = isMuted;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoadingVideo(false);
          })
          .catch(() => {
            // Autoplay policy fallback: mute and retry
            video.muted = true;
            video.play()
              .then(() => {
                setIsPlaying(true);
                setIsLoadingVideo(false);
              })
              .catch(() => {
                setIsPlaying(false);
                setIsLoadingVideo(false);
              });
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, playbackSpeed, rawVideoSrc, isMuted]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Sync speed multiplier
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || isSeeking) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setDuration(dur);
    setProgressPercent((cur / dur) * 100);
  };

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleDoubleTapLike = () => {
    sounds.like();
    setShowHeartOverlay(true);
    if (!clip.isLiked) {
      onToggleLike(clip.id);
    }
    setTimeout(() => setShowHeartOverlay(false), 800);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = (clickX / rect.width);
    const newTime = newPercent * (videoRef.current.duration || 1);
    videoRef.current.currentTime = newTime;
    setProgressPercent(newPercent * 100);
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVideoError = () => {
    if (fallbackIndex === null) {
      setFallbackIndex(index);
      setVideoError(false);
      setIsLoadingVideo(false);
    } else if (fallbackIndex < RELIABLE_BACKUP_STREAMS.length - 1) {
      setFallbackIndex(prev => (prev !== null ? prev + 1 : 0));
      setVideoError(false);
    } else {
      setVideoError(true);
      setIsLoadingVideo(false);
    }
  };

  return (
    <div 
      onDoubleClick={handleDoubleTapLike}
      className="shorts-snap-item relative w-full h-[calc(100vh-6.5rem)] max-h-[820px] rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex items-center justify-center bg-black video-hardware-accelerated select-none group"
    >
      {/* Heart Burst Animation */}
      {showHeartOverlay && (
        <div className="absolute z-40 inset-0 flex items-center justify-center pointer-events-none animate-spring-pop">
          <Heart className="w-28 h-28 text-[#ff2d95] fill-current drop-shadow-[0_0_35px_#ff2d95] animate-ping" />
        </div>
      )}

      {/* Loading Spinner */}
      {isLoadingVideo && !videoError && (
        <div className="absolute z-10 inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="w-10 h-10 text-[#00e5ff] animate-spin drop-shadow" />
        </div>
      )}

      {/* Video Element */}
      {videoError ? (
        <div className="p-8 text-center space-y-3 z-10 text-xs text-[#8a8aa8]">
          <div className="w-14 h-14 rounded-2xl bg-[#ff2d95]/20 border border-[#ff2d95]/40 flex items-center justify-center mx-auto text-[#ff2d95] animate-pulse">
            <RotateCcw className="w-7 h-7" />
          </div>
          <div className="font-orbitron font-bold text-white text-sm">Media Stream Reloading</div>
          <button
            onClick={() => {
              setFallbackIndex((prev) => ((prev ?? 0) + 1) % RELIABLE_BACKUP_STREAMS.length);
              setVideoError(false);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs hover:scale-105 transition-transform"
          >
            Switch Stream Mirror
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={rawVideoSrc}
          autoPlay={isActive}
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          onWaiting={() => setIsLoadingVideo(true)}
          onPlaying={() => setIsLoadingVideo(false)}
          onLoadedData={() => setIsLoadingVideo(false)}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
          onClick={handleTogglePlayPause}
          className="w-full h-full object-cover rounded-3xl cursor-pointer"
        />
      )}

      {/* Play/Pause Overlay Toggle */}
      {!isPlaying && !videoError && (
        <div 
          onClick={handleTogglePlayPause}
          className="absolute z-30 inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px] transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-black/70 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-current text-[#00e5ff] ml-1" />
          </div>
        </div>
      )}

      {/* Top Header Information & Speed Controller */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#00e5ff] border border-[#00e5ff]/30 font-orbitron flex items-center gap-1 shadow-md">
          <Sparkles className="w-3 h-3 text-[#ff2d95]" />
          CLIP {index + 1}/{totalClips}
        </span>

        {/* Speed Multiplier Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCycleSpeed();
          }}
          className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-[#fbbf24] border border-[#fbbf24]/40 font-orbitron flex items-center gap-1 hover:scale-105 transition-transform"
          title="Change playback speed"
        >
          <Gauge className="w-3 h-3" />
          <span>{playbackSpeed}x</span>
        </button>
      </div>

      {/* Top Right Action Tools */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {isMyClip && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClip(clip.id);
            }}
            className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-red-500 transition-all border border-white/10 shadow-lg"
            title="Delete My Clip"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onUploadClick();
          }}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#00e5ff] hover:text-slate-900 transition-all border border-white/10 shadow-lg"
          title="Upload New Vertical Clip"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95] transition-all border border-white/10 shadow-lg"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00e5ff]" />}
        </button>
      </div>

      {/* Bottom Content Metadata Overlay */}
      <div className="absolute bottom-4 left-0 right-16 p-5 z-20 bg-gradient-to-t from-black/95 via-black/50 to-transparent space-y-2 pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div 
            onClick={() => onProfileClick(authorUser)}
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md cursor-pointer hover:scale-105 transition-transform"
            style={{ background: authorUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
          >
            {authorUser?.avatarImage ? (
              <img src={authorUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              authorUser?.avatar || 'U'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div 
              onClick={() => onProfileClick(authorUser)}
              className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer hover:text-[#00e5ff]"
            >
              <span>{authorUser?.name || 'Creator'}</span>
              {authorUser?.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00e5ff]" />}
            </div>
            <div className="text-[10px] text-[#8a8aa8]">{authorUser?.handle || '@creator'}</div>
          </div>

          {!isMyClip && (
            <button
              onClick={() => onFollowToggle(authorUser.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold font-orbitron transition-all shadow-md flex items-center gap-1 ${
                isMutualFriendUser
                  ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900'
                  : isFollowingUser
                  ? 'bg-white/15 text-[#00e5ff] border border-[#00e5ff]/40'
                  : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900'
              }`}
            >
              {isMutualFriendUser ? 'Friends 🤝' : isFollowingUser ? 'Following' : '+ Follow'}
            </button>
          )}
        </div>

        <h2 className="text-sm font-bold text-white drop-shadow pointer-events-auto leading-snug">{clip.title}</h2>
        <p className="text-xs text-[#e8e8f4]/90 line-clamp-2 drop-shadow pointer-events-auto">{clip.description}</p>

        <div className="flex items-center gap-2 text-[11px] text-[#00e5ff] font-medium bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 inline-flex pointer-events-auto">
          <Music2 className="w-3 h-3 text-[#ff2d95] animate-pulse" />
          <span className="truncate max-w-[180px]">{clip.audioTrack || 'Original Audio Track'}</span>
        </div>
      </div>

      {/* Floating Action Column (Right Side) */}
      <div className="absolute right-3 bottom-8 z-20 flex flex-col items-center gap-3.5">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(clip.id);
          }} 
          className="flex flex-col items-center group"
        >
          <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
            clip.isLiked 
              ? 'bg-[#ff2d95] text-white scale-110 shadow-[0_0_20px_rgba(255,45,149,0.8)]' 
              : 'bg-black/60 text-white hover:bg-[#ff2d95]/40 border border-white/10'
          }`}>
            <Heart className={`w-5 h-5 ${clip.isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{(Number(clip.likes) || 0).toLocaleString()}</span>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleDislike(clip.id);
          }} 
          className="flex flex-col items-center group"
        >
          <div className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
            clip.isDisliked ? 'bg-slate-700 text-white' : 'bg-black/60 text-white hover:bg-white/10 border border-white/10'
          }`}>
            <ThumbsDown className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{clip.dislikes || 0}</span>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments(clip);
          }} 
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#00e5ff]/40 transition-all border border-white/10 shadow-lg">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">{clip.comments?.length || 0}</span>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(clip.id);
          }} 
          className="flex flex-col items-center group"
        >
          <div className={`p-3 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg ${clip.isBookmarked ? 'bg-[#fbbf24] text-slate-900' : 'bg-black/60 text-white hover:bg-white/10'}`}>
            <Bookmark className={`w-5 h-5 ${clip.isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">Save</span>
        </button>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onShare(clip.title, clip.id);
          }} 
          className="flex flex-col items-center group"
        >
          <div className="p-3 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-[#ff2d95]/40 transition-all border border-white/10 shadow-lg">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-white mt-1 drop-shadow">Share</span>
        </button>
      </div>

      {/* Interactive Seek Bar & Time Display */}
      <div 
        ref={progressBarRef}
        onClick={handleSeek}
        className="absolute bottom-0 left-0 right-0 h-2 bg-white/20 hover:h-3 cursor-pointer z-30 transition-all flex items-end"
      >
        <div 
          className="h-full bg-gradient-to-r from-[#ff2d95] via-[#00e5ff] to-[#10b981] transition-all duration-100 shadow-[0_0_12px_#00e5ff]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Seek Time Tooltip during playback */}
      {duration > 0 && (
        <span className="absolute bottom-3 right-4 text-[9px] font-mono text-white/70 bg-black/50 px-2 py-0.5 rounded backdrop-blur z-20 pointer-events-none">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      )}
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
  const [commentingClip, setCommentingClip] = useState<ShortClipItem | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync with Supabase on mount and subscribe to realtime clips updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('realtime_clips_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clips' },
        () => {
          syncWithSupabase(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // Filter valid clips
  const validClips = (clips || []).filter(c => {
    const src = c?.videoUrl || (c as any)?.video_url;
    return Boolean(src && typeof src === 'string' && src.length > 5 && !isBlocked(c.userId));
  });

  // Handle keyboard Up/Down arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'j', 'J'].includes(e.key)) {
        e.preventDefault();
        scrollToIndex(Math.min(validClips.length - 1, activeIndex + 1));
      } else if (['ArrowUp', 'k', 'K'].includes(e.key)) {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (['m', 'M'].includes(e.key)) {
        setIsMuted(m => !m);
        sounds.pop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, validClips.length]);

  // Scroll to index helper with smooth snap
  const scrollToIndex = (idx: number) => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('.shorts-snap-item');
    if (items[idx]) {
      items[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveIndex(idx);
    }
  };

  // IntersectionObserver to auto-detect centered visible video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.shorts-snap-item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(items).indexOf(entry.target);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6
      }
    );

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

  // Synchronized clip like with Supabase
  const handleToggleLikeWithCloudSync = async (clipId: string) => {
    toggleClipLike(clipId);
    if (!isSupabaseConfigured()) return;
    try {
      const targetClip = clips.find(c => c.id === clipId);
      const newLikes = targetClip?.isLiked ? Math.max(0, (targetClip.likes || 1) - 1) : ((targetClip?.likes || 0) + 1);
      await supabase
        .from('clips')
        .update({ likes: newLikes })
        .eq('id', clipId);
    } catch {
      // Handled in local state
    }
  };

  if (validClips.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-5">
        <div className="w-20 h-20 rounded-3xl liquid-glass border border-[#ff2d95]/40 flex items-center justify-center mx-auto text-[#ff2d95] shadow-2xl">
          <Film className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="font-orbitron font-bold text-2xl text-white">Upload Your First Short Clip</h2>
          <p className="text-xs text-[#8a8aa8]">
            Vertical short videos stream here in smooth 60FPS with snap-scroll controls.
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

  return (
    <div className="relative flex justify-center items-center pb-12 max-w-5xl mx-auto">
      {/* Navigation Buttons for Large Screens */}
      <div className="hidden lg:flex flex-col gap-3 fixed right-12 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="p-3 rounded-2xl liquid-glass hover:bg-[#00e5ff] text-white hover:text-slate-900 transition-all disabled:opacity-30 border border-white/20 shadow-xl"
          title="Previous Short (Arrow Up)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToIndex(Math.min(validClips.length - 1, activeIndex + 1))}
          disabled={activeIndex === validClips.length - 1}
          className="p-3 rounded-2xl liquid-glass hover:bg-[#ff2d95] text-white hover:text-slate-900 transition-all disabled:opacity-30 border border-white/20 shadow-xl"
          title="Next Short (Arrow Down)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Snap Scroll Vertical Viewport */}
      <div 
        ref={containerRef}
        className="shorts-snap-container no-scrollbar w-full max-w-[440px] h-[calc(100vh-6.5rem)] max-h-[820px] overflow-y-auto space-y-6"
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
              onToggleMute={() => {
                sounds.pop();
                setIsMuted(m => !m);
              }}
              onToggleLike={handleToggleLikeWithCloudSync}
              onToggleDislike={toggleClipDislike}
              onToggleBookmark={toggleClipBookmark}
              onShare={(title, id) => openShareModal(title, `https://wevids.app/clip/${id}`)}
              onOpenComments={(c) => setCommentingClip(c)}
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

      {/* Side Slide-out Comments Drawer */}
      {commentingClip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-md liquid-glass rounded-3xl p-5 border border-white/20 shadow-2xl flex flex-col h-[520px] animate-spring-pop">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#00e5ff]" />
                Comments ({commentingClip.comments?.length || 0})
              </h3>
              <button 
                onClick={() => setCommentingClip(null)} 
                className="p-1 rounded-lg text-[#8a8aa8] hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {!commentingClip.comments || commentingClip.comments.length === 0 ? (
                <div className="text-center py-16 text-xs text-[#8a8aa8]">
                  No comments yet! Be the first to share your reaction.
                </div>
              ) : (
                commentingClip.comments.map((c: CommentItem) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{c.userName}</span>
                      <span className="text-[10px] text-[#8a8aa8]">{c.timestamp}</span>
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
                  addClipComment(commentingClip.id, {
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

      {/* Upload Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultTarget="clips"
      />
    </div>
  );
};