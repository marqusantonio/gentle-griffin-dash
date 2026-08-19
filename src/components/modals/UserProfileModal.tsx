import React, { useRef, useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  CheckCircle2, 
  MessageSquare, 
  Music2, 
  Play, 
  Pause, 
  UserPlus, 
  Check, 
  X
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const UserProfileModal: React.FC = () => {
  const { 
    viewingProfileUser, 
    closeUserProfileModal, 
    toggleFollowUser, 
    isFollowing, 
    isMutualFriend, 
    startOrOpenChatWithUser,
    currentUser
  } = useWevids();

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!viewingProfileUser) return null;

  const following = isFollowing(viewingProfileUser.id);
  const mutualFriend = isMutualFriend(viewingProfileUser.id);
  const isMe = viewingProfileUser.id === currentUser.id;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      sounds.pop();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-md w-full space-y-4 shadow-2xl relative animate-slide-in">
        <button
          onClick={closeUserProfileModal}
          className="absolute top-4 right-4 text-xs text-[#8a8aa8] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-slate-900 text-xl shadow-lg flex-shrink-0"
            style={{ background: viewingProfileUser.color }}
          >
            {viewingProfileUser.avatarImage ? (
              <img src={viewingProfileUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              viewingProfileUser.avatar
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white flex items-center gap-1">
              {viewingProfileUser.name}
              {viewingProfileUser.verified && <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />}
            </h2>
            <div className="text-xs text-[#8a8aa8]">{viewingProfileUser.handle} · {viewingProfileUser.location}</div>
            {mutualFriend && (
              <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/20 px-2 py-0.5 rounded-full border border-[#10b981]/40 mt-1 inline-block">
                Mutual Friends 🤝
              </span>
            )}
          </div>
        </div>

        {/* Bio Audio Player */}
        {viewingProfileUser.bioAudioUrl && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAudio}
                className="w-7 h-7 rounded-full bg-[#ff2d95] text-slate-900 flex items-center justify-center font-bold"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <Music2 className="w-3 h-3 text-[#00e5ff]" />
                  <span>{viewingProfileUser.bioAudioTitle || 'Bio Audio Clip'}</span>
                </div>
                <div className="text-[9px] text-[#8a8aa8]">Voice Note / Music</div>
              </div>
            </div>
            <audio ref={audioRef} src={viewingProfileUser.bioAudioUrl} onEnded={() => setIsPlaying(false)} />
          </div>
        )}

        <p className="text-xs text-[#e8e8f4] leading-relaxed">{viewingProfileUser.bio}</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="font-bold font-orbitron text-[#00e5ff]">{viewingProfileUser.followers.toLocaleString()}</div>
            <div className="text-[10px] text-[#8a8aa8]">Followers</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="font-bold font-orbitron text-[#ff2d95]">{viewingProfileUser.likes.toLocaleString()}</div>
            <div className="text-[10px] text-[#8a8aa8]">Likes</div>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="font-bold font-orbitron text-[#fbbf24]">{viewingProfileUser.views}</div>
            <div className="text-[10px] text-[#8a8aa8]">Views</div>
          </div>
        </div>

        {/* Actions */}
        {!isMe && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => toggleFollowUser(viewingProfileUser.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-orbitron font-bold flex items-center justify-center gap-1.5 transition-transform hover:scale-102 ${
                mutualFriend
                  ? 'bg-[#10b981] text-slate-900 shadow-md'
                  : following
                  ? 'bg-white/10 text-[#00e5ff] border border-[#00e5ff]/40'
                  : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
              }`}
            >
              {mutualFriend ? 'Friends 🤝' : following ? 'Following' : '+ Follow'}
            </button>

            <button
              onClick={() => {
                closeUserProfileModal();
                startOrOpenChatWithUser(viewingProfileUser.id);
              }}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00e5ff]" />
              Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};