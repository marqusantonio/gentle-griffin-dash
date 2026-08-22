import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Edit3, 
  Camera, 
  Music2, 
  Play, 
  Pause,
  FileText,
  Film,
  Trash2,
  Heart,
  ShieldBan,
  UserX,
  AlertTriangle,
  Settings,
  Lock
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUser,
    posts,
    clips,
    deletePost,
    unblockUser,
    deactivateAccount,
    deleteAccount,
    allUsers
  } = useWevids();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileTab, setProfileTab] = useState<'posts' | 'media' | 'settings'>('posts');
  
  // Edit profile state
  const [name, setName] = useState(currentUser?.name || 'Guest Creator');
  const [handle, setHandle] = useState(currentUser?.handle || '@guest');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || 'Earth Node');
  const [pronouns, setPronouns] = useState(currentUser?.pronouns || 'they/them');
  const [bioAudioTitle, setBioAudioTitle] = useState(currentUser?.bioAudioTitle || 'Ambient Neon Theme');

  // Deletion confirm modal
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync author's own posts dynamically
  const myPosts = (posts || []).filter(p => p.userId === currentUser?.id || (currentUser?.isGuest && p.userId === 'guest'));
  const myMediaPosts = myPosts.filter(p => Boolean(p.mediaUrl));
  const myClips = (clips || []).filter(c => c.userId === currentUser?.id);

  const blockedUserIds = currentUser?.blockedUserIds || [];

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateCurrentUser({ avatarImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleToggleBioAudio = () => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({ 
      name, 
      handle, 
      bio, 
      location, 
      pronouns, 
      bioAudioTitle 
    });
    setIsEditing(false);
    sounds.success();
    toast.success('Profile saved!');
  };

  const walletBalanceNumber = Number(currentUser?.walletBalance) || 50;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="rounded-3xl liquid-glass border border-white/15 overflow-hidden shadow-2xl">
        {/* Cover Banner */}
        <div className="h-44 bg-gradient-to-r from-[#ff2d95]/40 via-[#9333ea]/30 to-[#00e5ff]/40 relative flex items-end p-6">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white hover:bg-[#ff2d95] transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-2 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 mb-4">
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-full border-4 border-[#0a0a1a] shadow-2xl flex items-center justify-center font-bold text-slate-900 text-3xl overflow-hidden"
                style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
              >
                {currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar || 'G'
                )}
              </div>

              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-[#ff2d95] text-slate-900 cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-orbitron font-bold text-sm text-[#00e5ff]">{(currentUser?.followers || 0).toLocaleString()}</div>
                <div className="text-[10px] text-[#8a8aa8]">Followers</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-orbitron font-bold text-sm text-[#ff2d95]">{(currentUser?.following || 0).toLocaleString()}</div>
                <div className="text-[10px] text-[#8a8aa8]">Following</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-orbitron font-bold text-sm text-[#fbbf24]">{myPosts.length}</div>
                <div className="text-[10px] text-[#8a8aa8]">Posts</div>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-orbitron text-white">{currentUser?.name || 'Creator'}</h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold">
                    VERIFIED CREATOR
                  </span>
                </div>
                <div className="text-xs text-[#8a8aa8] mt-0.5">
                  {currentUser?.handle || '@guest'} · {currentUser?.pronouns || 'they/them'} · {currentUser?.location || 'Earth Node'}
                </div>
              </div>

              {/* Bio Audio / Voice Note player */}
              {currentUser?.bioAudioUrl && (
                <div className="p-3 rounded-2xl bg-white/5 border border-[#00e5ff]/30 flex items-center justify-between max-w-md">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleToggleBioAudio}
                      className="w-8 h-8 rounded-full bg-[#00e5ff] text-slate-900 flex items-center justify-center font-bold hover:scale-105 transition-transform"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-[#ff2d95]" />
                        <span>{currentUser?.bioAudioTitle || 'Bio Audio Track'}</span>
                      </div>
                      <div className="text-[10px] text-[#8a8aa8]">Featured Creator Audio</div>
                    </div>
                  </div>
                  <audio ref={audioRef} src={currentUser.bioAudioUrl} onEnded={() => setIsPlayingAudio(false)} />
                </div>
              )}

              <p className="text-xs text-[#e8e8f4] max-w-2xl leading-relaxed pt-1">{currentUser?.bio || 'Exploring WEVIDS social ecosystem.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">@handle</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Pronouns</label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g. they/them, she/her"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Bio Music Title</label>
                  <input
                    type="text"
                    value={bioAudioTitle}
                    onChange={(e) => setBioAudioTitle(e.target.value)}
                    placeholder="e.g. Tokyo Synth Dreams"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold"
              >
                Save Profile Updates
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tabs Selector: All Posts / Media Clips / Account Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { sounds.click(); setProfileTab('posts'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'posts'
              ? 'bg-[#00e5ff] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Posts ({myPosts.length})</span>
        </button>

        <button
          onClick={() => { sounds.click(); setProfileTab('media'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'media'
              ? 'bg-[#ff2d95] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Media Clips ({myMediaPosts.length + myClips.length})</span>
        </button>

        <button
          onClick={() => { sounds.click(); setProfileTab('settings'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'settings'
              ? 'bg-[#fbbf24] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Account & Safety</span>
        </button>
      </div>

      {/* TAB 1: MY POSTS STREAM */}
      {profileTab === 'posts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              You haven't posted any updates yet. Share something in the Feed!
            </div>
          ) : (
            myPosts.map((post) => (
              <div
                key={post.id}
                className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs"
                      style={{ background: currentUser?.color || '#00e5ff' }}
                    >
                      {currentUser?.avatar || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{currentUser?.name}</div>
                      <div className="text-[10px] text-[#8a8aa8]">{post.time}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 rounded-lg text-[#8a8aa8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-white/95 whitespace-pre-wrap">{post.content}</p>

                {post.mediaUrl && post.mediaType === 'image' && (
                  <img src={post.mediaUrl} alt="Attachment" className="rounded-2xl max-h-80 w-full object-cover" />
                )}

                {post.mediaUrl && post.mediaType === 'video' && (
                  <video src={post.mediaUrl} controls className="rounded-2xl max-h-80 w-full object-cover bg-black" />
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-[#8a8aa8]">
                  <span className="flex items-center gap-1 text-[#ff2d95] font-bold">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {(Number(post.likes) || 0).toLocaleString()} likes
                  </span>
                  <span>{post.comments?.length || 0} comments</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: MEDIA CLIPS */}
      {profileTab === 'media' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myMediaPosts.length === 0 && myClips.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              No photos or video clips uploaded to your profile yet.
            </div>
          ) : (
            <>
              {myClips.map((clip) => (
                <div key={clip.id} className="rounded-2xl overflow-hidden bg-black border border-white/10 relative group aspect-[9/14]">
                  <video src={clip.videoUrl} controls className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => deletePost(clip.id)}
                      className="p-1.5 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
                      title="Delete Clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {myMediaPosts.map((post) => (
                <div key={post.id} className="rounded-2xl overflow-hidden bg-black border border-white/10 relative group aspect-[9/14]">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* TAB 3: ACCOUNT MANAGEMENT & SAFETY TOOLS */}
      {profileTab === 'settings' && (
        <div className="space-y-6">
          {/* Blocked Users Section */}
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-[#ff2d95]" />
              Blocked Accounts ({blockedUserIds.length})
            </h3>
            <p className="text-xs text-[#8a8aa8]">
              Blocked accounts cannot view your profile or message you. Their posts and comments are completely hidden from your feed.
            </p>

            {blockedUserIds.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-[#8a8aa8] text-center">
                You haven't blocked any accounts.
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUserIds.map((id) => {
                  const u = allUsers[id];
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                          <UserX className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white">{u?.name || id}</span>
                      </div>
                      <button
                        onClick={() => unblockUser(id)}
                        className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px]"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deactivation & Permanent Delete */}
          <div className="liquid-glass rounded-3xl p-6 border border-red-500/20 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Account Deactivation & Permanent Data Purge
            </h3>
            <p className="text-xs text-[#8a8aa8] leading-relaxed">
              You can temporarily deactivate your profile or permanently purge all posts, clips, relationships, and data from the network.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={deactivateAccount}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Deactivate Profile (Hide Temporarily)
              </button>

              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold text-xs shadow-md"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-red-500/40 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold font-orbitron text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Permanent Account Deletion</span>
            </div>
            <p className="text-xs text-[#e8e8f4] leading-relaxed">
              This action <strong>cannot be undone</strong>. All your posts, uploaded media, direct messages, followers, and profile details will be permanently wiped from the database.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold text-xs shadow-lg"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};