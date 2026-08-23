import React from 'react';
import { useSocialSync } from '../../hooks/useSocialSync';
import { UserPlus, UserCheck, Heart, Loader2 } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

interface ProfileHeaderProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName: string;
  targetUserHandle: string;
  targetUserAvatar?: string;
  targetUserColor?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  currentUserId,
  targetUserId,
  targetUserName,
  targetUserHandle,
  targetUserAvatar = 'C',
  targetUserColor = 'linear-gradient(135deg, #ff2d95, #00e5ff)'
}) => {
  const {
    followerCount,
    followingCount,
    likesCount,
    isFollowing,
    isLiked,
    loading,
    toggleFollow,
    toggleLike
  } = useSocialSync({ currentUserId, targetUserId });

  const isMe = currentUserId === targetUserId;

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/20 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-xl shrink-0"
          style={{ background: targetUserColor }}
        >
          {targetUserAvatar}
        </div>

        {/* User Info & Counters */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h1 className="text-2xl font-bold font-orbitron text-white">{targetUserName}</h1>
            <div className="text-xs text-[#00e5ff] font-mono">{targetUserHandle}</div>
          </div>

          {/* Live Counters */}
          <div className="flex items-center justify-center sm:justify-start gap-6 pt-1 text-xs">
            <div>
              <span className="font-orbitron font-bold text-base text-white">{followerCount.toLocaleString()}</span>
              <span className="text-[#8a8aa8] block text-[10px] uppercase font-semibold">Followers</span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div>
              <span className="font-orbitron font-bold text-base text-white">{followingCount.toLocaleString()}</span>
              <span className="text-[#8a8aa8] block text-[10px] uppercase font-semibold">Following</span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div>
              <span className="font-orbitron font-bold text-base text-[#ff2d95]">{likesCount.toLocaleString()}</span>
              <span className="text-[#8a8aa8] block text-[10px] uppercase font-semibold">Likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isMe && (
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => {
              sounds.click();
              toggleFollow();
            }}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl font-orbitron font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isFollowing
                ? 'bg-white/10 border border-cyan-400/40 text-cyan-400 hover:bg-red-500/20 hover:text-red-400'
                : 'bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 hover:scale-102'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>FOLLOWING</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>+ FOLLOW</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              sounds.like();
              toggleLike();
            }}
            disabled={loading}
            className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isLiked
                ? 'bg-[#ff2d95] text-white shadow-[0_0_20px_rgba(255,45,149,0.7)] scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{isLiked ? 'LIKED' : 'LIKE'}</span>
          </button>
        </div>
      )}
    </div>
  );
};