import React, { useRef, useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  CheckCircle2, 
  MessageSquare, 
  Music2, 
  Play, 
  Pause, 
  Lock,
  X,
  Heart,
  Film,
  Video,
  FileText,
  UserPlus,
  UserCheck,
  Send,
  ShieldAlert,
  ShieldBan,
  Users
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const UserProfileModal: React.FC = () => {
  const { 
    viewingProfileUser, 
    closeUserProfileModal, 
    toggleFollowUser, 
    isFollowing, 
    isMutualFriend, 
    blockUser,
    unblockUser,
    isBlocked,
    startOrOpenChatWithUser,
    currentUser,
    clips,
    posts,
    conversations,
    allUsers,
    setActiveView
  } = useWevids();

  const [activeTab, setActiveTab] = useState<'all' | 'clips' | 'followers'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!viewingProfileUser) return null;

  const targetId = viewingProfileUser.id || 'unknown';
  const currentUserId = currentUser?.id || 'guest';
  const following = isFollowing(targetId);
  const mutualFriend = isMutualFriend(targetId);
  const blocked = isBlocked(targetId);
  const isMe = targetId === currentUserId;

  const userClips = (clips || []).filter(c => c && c.userId === targetId && Boolean(c.videoUrl));
  const userPosts = (posts || []).filter(p => p && p.userId === targetId);

  const dynamicLikes = userPosts.reduce((acc, p) => acc + (Number(p?.likes) || 0), 0) + 
                       userClips.reduce((acc, c) => acc + (Number(c?.likes) || 0), 0);
  const totalLikes = Math.max(Number(viewingProfileUser.likes) || 0, dynamicLikes);

  const existingConv = (conversations || []).find(c =>
    c &&
    !c.isGroup &&
    Array.isArray(c.members) &&
    c.members.includes(targetId) &&
    c.members.includes(currentUserId)
  );
  const isRequestPending = !mutualFriend && existingConv?.status === 'pending_request' && existingConv.requestedBy === currentUserId;

  // List followers
  const followersList = Object.values(allUsers).filter(u => 
    (u.followingIds || []).includes(targetId)
  );

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
      sounds.pop();
    }
  };

  const handleMessageClick = () => {
    sounds.click();
    closeUserProfileModal();
    startOrOpenChatWithUser(targetId);

    if (mutualFriend) {
      toast.success(`Friends mode unlocked with ${viewingProfileUser.name || 'creator'}! Chat freely 🤝`);
    } else if (isRequestPending) {
      toast.info('Message request already pending approval from this creator.');
    } else {
      toast.info(`Message request mode: You can send 1 message until ${viewingProfileUser.name || 'this creator'} accepts or follows back.`);
    }
  };

  const handleBlockToggle = () => {
    if (blocked) {
      unblockUser(targetId);
      setShowBlockConfirm(false);
    } else {
      blockUser(targetId);
      setShowBlockConfirm(false);
      closeUserProfileModal();
    }
  };

  const avatarColor = viewingProfileUser.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)';
  const displayName = viewingProfileUser.name || 'Creator';
  const handleName = viewingProfileUser.handle || `@${displayName.toLowerCase().replace(/\s+/g, '_')}`;
  const locationName = viewingProfileUser.location || 'Earth Node';
  const followersCount = Number(viewingProfileUser.followers) || followersList.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-in">
        <button
          onClick={closeUserProfileModal}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-slate-900 text-xl shadow-lg flex-shrink-0"
            style={{ background: avatarColor }}
          >
            {viewingProfileUser.avatarImage ? (
              <img src={viewingProfileUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              viewingProfileUser.avatar || displayName.charAt(0) || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 truncate">
              <span>{displayName}</span>
              {viewingProfileUser.verified && <CheckCircle2 className="w-4 h-4 text-[#00e5ff] flex-shrink-0" />}
            </h2>
            <div className="text-xs text-[#8a8aa8] truncate">{handleName} · {locationName}</div>
            
            {/* Status Badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {mutualFriend ? (
                <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/20 px-2.5 py-0.5 rounded-full border border-[#10b981]/40 flex items-center gap-1">
                  🤝 Mutual Friends · Unrestricted Messaging
                </span>
              ) : following ? (
                <span className="text-[10px] text-[#00e5ff] bg-[#00e5ff]/15 px-2.5 py-0.5 rounded-full border border-[#00e5ff]/30 font-semibold">
                  Requested / Following (1 Msg Limit)
                </span>
              ) : isRequestPending ? (
                <span className="text-[10px] text-[#fbbf24] bg-[#fbbf24]/15 px-2.5 py-0.5 rounded-full border border-[#fbbf24]/30 font-semibold">
                  ⏳ 1 Message Request Sent
                </span>
              ) : null}
            </div>
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
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <Music2 className="w-3 h-3 text-[#00e5ff]" />
                  <span>{viewingProfileUser.bioAudioTitle || 'Bio Audio Clip'}</span>
                </div>
                <div className="text-[9px] text-[#8a8aa8]">Creator Voice Note / Music</div>
              </div>
            </div>
            <audio ref={audioRef} src={viewingProfileUser.bioAudioUrl} onEnded={() => setIsPlayingAudio(false)} />
          </div>
        )}

        <p className="text-xs text-[#e8e8f4] leading-relaxed">{viewingProfileUser.bio || 'WEVIDS creator and community member.'}</p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10" onClick={() => setActiveTab('followers')}>
            <div className="font-bold font-orbitron text-[#00e5ff]">{followersCount.toLocaleString()}</div>
            <div className="text-[10px] text-[#8a8aa8]">Followers</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="font-bold font-orbitron text-[#ff2d95] flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{totalLikes.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-[#8a8aa8]">Total Likes</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="font-bold font-orbitron text-[#fbbf24]">{userPosts.length}</div>
            <div className="text-[10px] text-[#8a8aa8]">Total Posts</div>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        {!isMe && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => toggleFollowUser(targetId)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-orbitron font-bold flex items-center justify-center gap-1.5 transition-transform hover:scale-102 ${
                mutualFriend
                  ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900 shadow-md'
                  : following
                  ? 'bg-white/10 text-[#00e5ff] border border-[#00e5ff]/40'
                  : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
              }`}
            >
              {mutualFriend ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{mutualFriend ? 'Friends 🤝' : following ? 'Requested / Following' : '+ Follow'}</span>
            </button>

            <button
              onClick={handleMessageClick}
              className={`flex-1 py-2.5 rounded-xl font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                mutualFriend
                  ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md hover:scale-102'
                  : isRequestPending
                  ? 'bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24]'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              {mutualFriend ? (
                <>
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Freely</span>
                </>
              ) : isRequestPending ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Request Pending</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#00e5ff]" />
                  <span>Send Request</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowBlockConfirm(true)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-[#8a8aa8] hover:text-red-400 border border-white/10 transition-colors"
              title="Block / Report Creator"
            >
              <ShieldBan className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Block Confirmation Drawer */}
        {showBlockConfirm && (
          <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 space-y-2.5 text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>{blocked ? `Unblock ${displayName}?` : `Block ${displayName}?`}</span>
            </div>
            <p className="text-[#8a8aa8] leading-relaxed">
              {blocked 
                ? 'Unblocking will allow you to see their posts and receive messages.'
                : 'Blocking will instantly hide all posts, comments, and direct messages from this user.'}
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockToggle}
                className="px-3.5 py-1.5 rounded-lg bg-red-500 text-white font-bold"
              >
                {blocked ? 'Confirm Unblock' : 'Confirm Block'}
              </button>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => { sounds.click(); setActiveTab('all'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#00e5ff] text-slate-900 shadow-md'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Posts ({userPosts.length})</span>
            </button>

            <button
              onClick={() => { sounds.click(); setActiveTab('clips'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                activeTab === 'clips'
                  ? 'bg-[#ff2d95] text-slate-900 shadow-md'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Clips ({userClips.length})</span>
            </button>

            <button
              onClick={() => { sounds.click(); setActiveTab('followers'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                activeTab === 'followers'
                  ? 'bg-[#fbbf24] text-slate-900 shadow-md'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Followers</span>
            </button>
          </div>

          {activeTab === 'all' && (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {userPosts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5">
                  No posts published yet.
                </div>
              ) : (
                userPosts.map((post) => (
                  <div key={post.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
                    <p className="text-white/90 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#8a8aa8] pt-1">
                      <span>{post.time}</span>
                      <span className="text-[#ff2d95] flex items-center gap-1 font-bold">
                        <Heart className="w-3 h-3 fill-current" />
                        {post.likes || 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'clips' && (
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {userClips.length === 0 ? (
                <div className="col-span-2 p-6 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                  <Video className="w-6 h-6 text-[#00e5ff] mx-auto opacity-50" />
                  <p>No video clips uploaded yet.</p>
                </div>
              ) : (
                userClips.map((clip) => (
                  <div
                    key={clip.id}
                    onClick={() => closeUserProfileModal()}
                    className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer group shadow-md"
                  >
                    <video src={clip.videoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-2.5 space-y-1">
                      <div className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-[#00e5ff]">
                        {clip.title}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {followersList.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5">
                  No followers recorded yet. Follow creators to build your community network!
                </div>
              ) : (
                followersList.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs" style={{ background: f.color }}>
                        {f.avatar || f.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{f.name}</div>
                        <div className="text-[10px] text-[#8a8aa8]">{f.handle}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollowUser(f.id)}
                      className="px-3 py-1 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold font-orbitron hover:bg-[#00e5ff] hover:text-slate-900 transition-colors"
                    >
                      {isFollowing(f.id) ? 'Following' : '+ Follow'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};