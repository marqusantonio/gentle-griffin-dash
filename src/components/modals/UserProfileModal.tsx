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
  Users,
  Award,
  Globe,
  Github,
  Twitter,
  Youtube,
  Coins,
  Sparkles,
  MapPin,
  Calendar,
  Zap,
  Bookmark
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

  const [activeTab, setActiveTab] = useState<'posts' | 'clips' | 'badges' | 'followers'>('posts');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [tipAmount, setTipAmount] = useState('10');
  const [showTipModal, setShowTipModal] = useState(false);

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

  const handleSendTip = () => {
    const amount = Number(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid WVDS tip amount');
      return;
    }
    if ((currentUser.walletBalance || 0) < amount) {
      toast.error('Insufficient WVDS token balance');
      return;
    }

    sounds.success();
    toast.success(`Sent ${amount} WVDS tokens to ${viewingProfileUser.name}!`);
    setShowTipModal(false);
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

  const defaultBadges = viewingProfileUser.badges && viewingProfileUser.badges.length > 0
    ? viewingProfileUser.badges
    : ['⚡ Verified Creator', '💎 Alpha Contributor', '🛠 Kernel Dev', '🎮 Pro Gamer'];

  // Frame Styles
  const frameBorderClass = {
    neon_cyan: 'ring-4 ring-[#00e5ff] shadow-[0_0_25px_#00e5ff]',
    cyber_pink: 'ring-4 ring-[#ff2d95] shadow-[0_0_25px_#ff2d95]',
    gold_crown: 'ring-4 ring-[#fbbf24] shadow-[0_0_25px_#fbbf24]',
    holo_matrix: 'ring-4 ring-[#10b981] shadow-[0_0_25px_#10b981]',
    plasma_fire: 'ring-4 ring-purple-500 shadow-[0_0_25px_#a855f7]'
  }[viewingProfileUser.profileFrame || 'neon_cyan'] || 'ring-4 ring-[#00e5ff] shadow-[0_0_25px_#00e5ff]';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="liquid-glass rounded-3xl border border-white/20 max-w-4xl w-full h-[92vh] flex flex-col justify-between shadow-[0_0_90px_rgba(0,229,255,0.35)] relative overflow-hidden animate-spring-pop">
        
        {/* Header Close Button */}
        <button
          onClick={closeUserProfileModal}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 text-[#8a8aa8] hover:text-white hover:bg-red-500 transition-all border border-white/10 shadow-lg"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          
          {/* Cover Banner Stage */}
          <div className="h-56 sm:h-64 relative bg-gradient-to-r from-[#ff2d95]/40 via-[#9333ea]/40 to-[#00e5ff]/40 overflow-hidden">
            {viewingProfileUser.coverBanner ? (
              <img
                src={viewingProfileUser.coverBanner}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#ff2d95_0%,transparent_60%),radial-gradient(circle_at_70%_70%,#00e5ff_0%,transparent_60%)] opacity-70 animate-pulse" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/40 to-transparent" />

            {/* Badges Over Cover */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5">
              {defaultBadges.map((badge, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#00e5ff] border border-[#00e5ff]/40 font-orbitron font-bold text-[10px] shadow-md flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#ff2d95]" />
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Profile Header Details */}
          <div className="px-6 sm:px-8 pb-6 relative z-10 -mt-16 sm:-mt-20">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-5">
              
              {/* Avatar + Frame + Status */}
              <div className="flex items-end gap-4">
                <div className="relative">
                  <div
                    className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#0a0a1a] flex items-center justify-center font-bold text-slate-900 text-3xl overflow-hidden ${frameBorderClass}`}
                    style={{ background: avatarColor }}
                  >
                    {viewingProfileUser.avatarImage ? (
                      <img src={viewingProfileUser.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      viewingProfileUser.avatar || displayName.charAt(0) || 'U'
                    )}
                  </div>

                  {/* Status Emoji Badge */}
                  <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/80 border border-white/30 backdrop-blur-md flex items-center justify-center text-sm shadow-lg">
                    {viewingProfileUser.statusEmoji || '⚡'}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold font-orbitron text-white">{displayName}</h1>
                    {viewingProfileUser.verified && (
                      <CheckCircle2 className="w-6 h-6 text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]" />
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-[#8a8aa8] flex items-center gap-2">
                    <span className="font-mono text-[#00e5ff]">{handleName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#ff2d95]" />
                      {locationName}
                    </span>
                  </div>

                  {viewingProfileUser.statusMessage && (
                    <div className="mt-1 text-xs text-[#fbbf24] font-semibold flex items-center gap-1.5 italic">
                      <span>"{viewingProfileUser.statusMessage}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Tip */}
              {!isMe && (
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <button
                    onClick={() => toggleFollowUser(targetId)}
                    className={`flex-1 md:flex-none px-5 py-3 rounded-2xl text-xs font-orbitron font-bold flex items-center justify-center gap-1.5 transition-transform hover:scale-105 ${
                      mutualFriend
                        ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900 shadow-md'
                        : following
                        ? 'bg-white/10 text-[#00e5ff] border border-[#00e5ff]/40'
                        : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                    }`}
                  >
                    {mutualFriend ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{mutualFriend ? 'Friends 🤝' : following ? 'Following' : '+ Follow'}</span>
                  </button>

                  <button
                    onClick={handleMessageClick}
                    className={`flex-1 md:flex-none px-5 py-3 rounded-2xl font-orbitron font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      mutualFriend
                        ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md hover:scale-105'
                        : isRequestPending
                        ? 'bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24]'
                        : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                  >
                    {mutualFriend ? (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat Freely</span>
                      </>
                    ) : isRequestPending ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Request Pending</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#00e5ff]" />
                        <span>Send Request</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowTipModal(true)}
                    className="p-3 rounded-2xl bg-[#fbbf24]/20 hover:bg-[#fbbf24] text-[#fbbf24] hover:text-slate-900 border border-[#fbbf24]/40 font-bold transition-all shadow-md"
                    title="Tip Creator WVDS Tokens"
                  >
                    <Coins className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowBlockConfirm(true)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-red-500/20 text-[#8a8aa8] hover:text-red-400 border border-white/10 transition-colors"
                    title="Block / Report Creator"
                  >
                    <ShieldBan className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Social Links & Bio Audio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              {/* Audio Theme */}
              {viewingProfileUser.bioAudioUrl ? (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-[#00e5ff]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAudio}
                      className="w-9 h-9 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-[#00e5ff]" />
                        <span>{viewingProfileUser.bioAudioTitle || 'Creator Theme Audio'}</span>
                      </div>
                      <div className="text-[10px] text-[#8a8aa8]">Personal Voice Note or Music Track</div>
                    </div>
                  </div>
                  <audio ref={audioRef} src={viewingProfileUser.bioAudioUrl} onEnded={() => setIsPlayingAudio(false)} />
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-2 text-xs text-[#8a8aa8]">
                  <Sparkles className="w-4 h-4 text-[#ff2d95]" />
                  <span>No custom audio theme uploaded yet.</span>
                </div>
              )}

              {/* Socials Row */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs">
                <span className="text-[#8a8aa8] font-bold">Socials:</span>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white">
                  <Twitter className="w-4 h-4 text-[#00e5ff]" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white">
                  <Github className="w-4 h-4 text-white" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white">
                  <Youtube className="w-4 h-4 text-red-500" />
                </a>
              </div>
            </div>

            {/* Bio text */}
            <p className="text-xs sm:text-sm text-[#e8e8f4] leading-relaxed max-w-3xl mb-4">
              {viewingProfileUser.bio || 'WEVIDS community creator. Flashing custom HyperOS ROMs, gaming clips, and cyberpunk music.'}
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveTab('followers')}>
                <div className="font-bold font-orbitron text-lg text-[#00e5ff]">{followersCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-bold">Followers</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-bold font-orbitron text-lg text-[#ff2d95] flex items-center justify-center gap-1">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{totalLikes.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-bold">Total Likes</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-bold font-orbitron text-lg text-[#fbbf24]">{userPosts.length}</div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-bold">Posts Published</div>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="font-bold font-orbitron text-lg text-[#10b981]">{userClips.length}</div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-bold">Video Shorts</div>
              </div>
            </div>

            {/* Tip Tokens Modal */}
            {showTipModal && (
              <div className="mt-4 p-4 rounded-2xl bg-[#fbbf24]/15 border border-[#fbbf24]/30 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#fbbf24] font-orbitron flex items-center gap-1.5">
                    <Coins className="w-4 h-4" /> Tip WVDS Tokens to {displayName}
                  </span>
                  <button onClick={() => setShowTipModal(false)} className="text-white hover:text-red-400">✕</button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono font-bold text-xs flex-1"
                    placeholder="Amount of WVDS"
                  />
                  <button
                    onClick={handleSendTip}
                    className="px-5 py-2 rounded-xl bg-[#fbbf24] text-slate-900 font-orbitron font-bold shadow-md hover:scale-105 transition-transform"
                  >
                    SEND TIP
                  </button>
                </div>
              </div>
            )}

            {/* Block Confirmation Drawer */}
            {showBlockConfirm && (
              <div className="mt-4 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 space-y-2.5 text-xs animate-fade-in">
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

            {/* Content Tabs Navigation */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => { sounds.click(); setActiveTab('posts'); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                    activeTab === 'posts'
                      ? 'bg-[#00e5ff] text-slate-900 shadow-md'
                      : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Posts ({userPosts.length})</span>
                </button>

                <button
                  onClick={() => { sounds.click(); setActiveTab('clips'); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                    activeTab === 'clips'
                      ? 'bg-[#ff2d95] text-slate-900 shadow-md'
                      : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Media Shorts ({userClips.length})</span>
                </button>

                <button
                  onClick={() => { sounds.click(); setActiveTab('badges'); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                    activeTab === 'badges'
                      ? 'bg-[#fbbf24] text-slate-900 shadow-md'
                      : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Badges & Trophies</span>
                </button>

                <button
                  onClick={() => { sounds.click(); setActiveTab('followers'); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
                    activeTab === 'followers'
                      ? 'bg-[#10b981] text-slate-900 shadow-md'
                      : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Followers ({followersCount})</span>
                </button>
              </div>

              {/* TAB 1: POSTS */}
              {activeTab === 'posts' && (
                <div className="space-y-3">
                  {userPosts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5">
                      No feed posts published by this creator yet.
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <div key={post.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs hover:border-white/20 transition-all">
                        <p className="text-white/95 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        {post.mediaUrl && post.mediaType === 'image' && (
                          <img src={post.mediaUrl} alt="Media" className="rounded-xl max-h-60 object-cover w-full" />
                        )}
                        {post.mediaUrl && post.mediaType === 'video' && (
                          <video src={post.mediaUrl} controls className="rounded-xl max-h-60 object-cover w-full bg-black" />
                        )}
                        <div className="flex items-center justify-between text-[10px] text-[#8a8aa8] pt-1">
                          <span>{post.time}</span>
                          <span className="text-[#ff2d95] flex items-center gap-1 font-bold">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            {post.likes || 0} Likes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: CLIPS */}
              {activeTab === 'clips' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userClips.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5">
                      No vertical video shorts published yet.
                    </div>
                  ) : (
                    userClips.map((clip) => (
                      <div
                        key={clip.id}
                        className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-black border border-white/10 group shadow-md"
                      >
                        <video src={clip.videoUrl} controls className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3 pointer-events-none">
                          <div className="text-xs font-bold text-white line-clamp-1">{clip.title}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: BADGES */}
              {activeTab === 'badges' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {defaultBadges.map((badge, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs font-bold text-white shadow-md">
                      <Award className="w-6 h-6 text-[#fbbf24] shrink-0" />
                      <span>{badge}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: FOLLOWERS */}
              {activeTab === 'followers' && (
                <div className="space-y-2">
                  {followersList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5">
                      No followers registered yet.
                    </div>
                  ) : (
                    followersList.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
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
                          className="px-3.5 py-1.5 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] text-xs font-bold font-orbitron hover:bg-[#00e5ff] hover:text-slate-900 transition-colors"
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
      </div>
    </div>
  );
};