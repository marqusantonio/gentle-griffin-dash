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
  Eye,
  Sparkles
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
    startOrOpenChatWithUser,
    currentUser,
    clips,
    posts,
    conversations,
    setActiveView
  } = useWevids();

  const [activeTab, setActiveTab] = useState<'videos' | 'posts'>('videos');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!viewingProfileUser) return null;

  const following = isFollowing(viewingProfileUser.id);
  const mutualFriend = isMutualFriend(viewingProfileUser.id);
  const isMe = viewingProfileUser.id === currentUser.id;

  // Filter user's clips and posts
  const userClips = clips.filter(c => c.userId === viewingProfileUser.id);
  const userPosts = posts.filter(p => p.userId === viewingProfileUser.id);

  // Calculate dynamic total likes from all content + profile baseline
  const dynamicClipLikes = userClips.reduce((acc, c) => acc + (c.likes || 0), 0);
  const dynamicPostLikes = userPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalLikes = Math.max(
    viewingProfileUser.likes || 0,
    dynamicClipLikes + dynamicPostLikes
  );

  // Check if a request is already pending
  const existingConv = conversations.find(c =>
    !c.isGroup &&
    c.members.includes(viewingProfileUser.id) &&
    c.members.includes(currentUser.id)
  );
  const isRequestPending = !mutualFriend && existingConv?.status === 'pending_request' && existingConv.requestedBy === currentUser.id;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
      sounds.pop();
    }
  };

  const handleMessageClick = () => {
    sounds.click();
    closeUserProfileModal();
    startOrOpenChatWithUser(viewingProfileUser.id);

    if (mutualFriend) {
      toast.success(`Connected with ${viewingProfileUser.name}! You are mutual friends and can chat freely. 🤝`);
    } else if (isRequestPending) {
      toast.info('Message request already pending approval from this creator.');
    } else {
      toast.info(`Message request mode: You can send 1 message until ${viewingProfileUser.name} follows you back or accepts your request.`);
    }
  };

  const handleOpenClip = (clipId: string) => {
    sounds.pop();
    closeUserProfileModal();
    setActiveView('clips');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-slide-in">
        <button
          onClick={closeUserProfileModal}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
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
            <h2 className="text-base font-bold text-white flex items-center gap-1.5 truncate">
              {viewingProfileUser.name}
              {viewingProfileUser.verified && <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />}
            </h2>
            <div className="text-xs text-[#8a8aa8]">{viewingProfileUser.handle} · {viewingProfileUser.location}</div>
            
            {/* Status Badges */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {mutualFriend ? (
                <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/20 px-2.5 py-0.5 rounded-full border border-[#10b981]/40 flex items-center gap-1">
                  🤝 Mutual Friends · Chat Freely
                </span>
              ) : following ? (
                <span className="text-[10px] text-[#00e5ff] bg-[#00e5ff]/15 px-2.5 py-0.5 rounded-full border border-[#00e5ff]/30 font-semibold">
                  Following (Awaiting follow back)
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

        {/* Dynamic Stats Row with Total Likes */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="font-bold font-orbitron text-[#00e5ff]">{(viewingProfileUser.followers || 0).toLocaleString()}</div>
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
            <div className="font-bold font-orbitron text-[#fbbf24]">{userClips.length + userPosts.length}</div>
            <div className="text-[10px] text-[#8a8aa8]">Uploads</div>
          </div>
        </div>

        {/* Action Buttons: Follow & Message */}
        {!isMe && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => toggleFollowUser(viewingProfileUser.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-orbitron font-bold flex items-center justify-center gap-1.5 transition-transform hover:scale-102 ${
                mutualFriend
                  ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900 shadow-md'
                  : following
                  ? 'bg-white/10 text-[#00e5ff] border border-[#00e5ff]/40'
                  : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
              }`}
            >
              {mutualFriend ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{mutualFriend ? 'Friends 🤝' : following ? 'Following' : '+ Follow'}</span>
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
                  <span>Request Chat (1 msg)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* User Uploads Tab Selector */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => {
                sounds.click();
                setActiveTab('videos');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                activeTab === 'videos'
                  ? 'bg-[#00e5ff] text-slate-900 shadow-md'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Clips & Videos ({userClips.length})</span>
            </button>

            <button
              onClick={() => {
                sounds.click();
                setActiveTab('posts');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                activeTab === 'posts'
                  ? 'bg-[#ff2d95] text-slate-900 shadow-md'
                  : 'bg-white/5 text-[#8a8aa8] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Posts ({userPosts.length})</span>
            </button>
          </div>

          {/* Videos Grid */}
          {activeTab === 'videos' && (
            <div>
              {userClips.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                  <Video className="w-6 h-6 text-[#00e5ff] mx-auto opacity-50" />
                  <p>No video clips uploaded yet by this creator.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {userClips.map((clip) => (
                    <div
                      key={clip.id}
                      onClick={() => handleOpenClip(clip.id)}
                      className="relative aspect-[9/14] rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer group shadow-md"
                    >
                      <video
                        src={clip.videoUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-2.5 space-y-1">
                        <div className="text-[11px] font-bold text-white line-clamp-1 group-hover:text-[#00e5ff] transition-colors">
                          {clip.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#ff2d95]">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-current" />
                            {clip.likes || 0}
                          </span>
                          <span className="text-[#8a8aa8]">▶ View</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Posts Grid */}
          {activeTab === 'posts' && (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {userPosts.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-2xl border border-white/5">
                  No written posts yet.
                </div>
              ) : (
                userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs"
                  >
                    <p className="text-[#e8e8f4] line-clamp-2">{post.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#8a8aa8]">
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
        </div>
      </div>
    </div>
  );
};