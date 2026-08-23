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
  Image as ImageIcon,
  Award,
  Sparkles,
  Check,
  Palette,
  Globe,
  Twitter,
  Github,
  Youtube,
  Crown
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80'
];

const FRAME_OPTIONS = [
  { id: 'neon_cyan', label: 'Neon Cyan', color: '#00e5ff' },
  { id: 'cyber_pink', label: 'Cyber Pink', color: '#ff2d95' },
  { id: 'gold_crown', label: 'Gold Crown', color: '#fbbf24' },
  { id: 'holo_matrix', label: 'Holo Matrix', color: '#10b981' },
  { id: 'plasma_fire', label: 'Plasma Fire', color: '#a855f7' }
];

const STATUS_EMOJIS = ['⚡', '🔥', '💎', '🎮', '🎧', '🚀', '👑', '🍵', '👾'];

const ALL_AVAILABLE_BADGES = [
  '⚡ Verified Creator',
  '💎 Alpha Contributor',
  '🛠 Kernel Dev',
  '🎮 Pro Gamer',
  '🎵 Audio Producer',
  '🎬 Cinema Director',
  '🚀 Early Adopter'
];

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
  const [profileTab, setProfileTab] = useState<'posts' | 'media' | 'customize' | 'settings'>('posts');

  const isGuestUser = currentUser?.isGuest || currentUser?.id === 'guest';

  // Customization Form State
  const [name, setName] = useState(currentUser?.name || 'Guest Creator');
  const [handle, setHandle] = useState(currentUser?.handle || '@guest');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || 'Earth Node');
  const [pronouns, setPronouns] = useState(currentUser?.pronouns || 'they/them');
  const [bioAudioTitle, setBioAudioTitle] = useState(currentUser?.bioAudioTitle || 'Ambient Neon Theme');
  const [statusMessage, setStatusMessage] = useState(currentUser?.statusMessage || 'Building on WEVIDS');
  const [statusEmoji, setStatusEmoji] = useState(currentUser?.statusEmoji || '⚡');
  const [profileFrame, setProfileFrame] = useState(currentUser?.frame || 'neon_cyan');
  const [coverBanner, setCoverBanner] = useState(currentUser?.coverBanner || COVER_PRESETS[0]);
  
  // Default badges: Empty for guest account unless explicitly set
  const [badges, setBadges] = useState<string[]>(
    currentUser?.badges || (isGuestUser ? [] : ['💎 Alpha Contributor'])
  );

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const myPosts = (posts || []).filter(p => p.userId === currentUser?.id || (currentUser?.isGuest && p.userId === 'guest'));
  const myMediaPosts = myPosts.filter(p => Boolean(p.mediaUrl));
  const myClips = (clips || []).filter(c => c.userId === currentUser?.id);

  const blockedUserIds = currentUser?.blockedUserIds || [];

  const followerCount = currentUser?.follower_count ?? currentUser?.followers ?? 0;
  const followingCount = currentUser?.following_count ?? currentUser?.following ?? 0;
  const likesCount = currentUser?.likes_count ?? currentUser?.likes ?? myPosts.reduce((acc, p) => acc + (Number(p.likes) || 0), 0);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateCurrentUser({ avatarImage: reader.result as string });
      toast.success('Profile avatar updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const bannerUrl = reader.result as string;
      setCoverBanner(bannerUrl);
      updateCurrentUser({ coverBanner: bannerUrl });
      toast.success('Cover banner image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleToggleBadge = (badge: string) => {
    sounds.click();
    setBadges(prev => {
      if (prev.includes(badge)) {
        return prev.filter(b => b !== badge);
      }
      return [...prev, badge];
    });
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
      bioAudioTitle,
      statusMessage,
      statusEmoji,
      frame: profileFrame,
      coverBanner,
      badges
    });
    setIsEditing(false);
    sounds.success();
    toast.success('Profile & customization saved!');
  };

  const frameBorderClass = {
    neon_cyan: 'ring-4 ring-[#00e5ff] shadow-[0_0_25px_#00e5ff]',
    cyber_pink: 'ring-4 ring-[#ff2d95] shadow-[0_0_25px_#ff2d95]',
    gold_crown: 'ring-4 ring-[#fbbf24] shadow-[0_0_25px_#fbbf24]',
    holo_matrix: 'ring-4 ring-[#10b981] shadow-[0_0_25px_#10b981]',
    plasma_fire: 'ring-4 ring-purple-500 shadow-[0_0_25px_#a855f7]'
  }[profileFrame] || 'ring-4 ring-[#00e5ff] shadow-[0_0_25px_#00e5ff]';

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Profile Card */}
      <div className="rounded-3xl liquid-glass border border-white/15 overflow-hidden shadow-2xl relative">
        
        {/* Cover Banner */}
        <div className="h-56 sm:h-64 relative bg-gradient-to-r from-[#ff2d95]/40 via-[#9333ea]/30 to-[#00e5ff]/40 flex items-end p-6">
          {coverBanner ? (
            <img src={coverBanner} alt="Cover Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#ff2d95_0%,transparent_60%),radial-gradient(circle_at_70%_70%,#00e5ff_0%,transparent_60%)] opacity-70 animate-pulse" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/40 to-transparent" />

          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <input
              type="file"
              ref={bannerInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all"
              title="Upload Custom Cover Image"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="hidden sm:inline">Upload Banner</span>
            </button>

            <button
              onClick={() => { sounds.click(); setProfileTab('customize'); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Customize Profile</span>
            </button>
          </div>

          {/* Badges Over Cover */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5">
            {badges.map((badge, idx) => (
              <span key={idx} className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#00e5ff] border border-[#00e5ff]/40 font-orbitron font-bold text-[10px] shadow-md flex items-center gap-1">
                <Award className="w-3 h-3 text-[#ff2d95]" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="px-6 pb-6 pt-2 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 mb-4">
            
            {/* Avatar + Status Emoji */}
            <div className="relative group">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#0a0a1a] shadow-2xl flex items-center justify-center font-bold text-slate-900 text-3xl overflow-hidden ${frameBorderClass}`}
                style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
              >
                {currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar || 'G'
                )}
              </div>

              <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-black/80 border border-white/30 backdrop-blur-md flex items-center justify-center text-sm shadow-lg z-20">
                {statusEmoji}
              </span>

              <label className="absolute bottom-1 left-1 p-2 rounded-full bg-[#ff2d95] text-slate-900 cursor-pointer shadow-lg hover:scale-110 transition-transform z-20">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            {/* Live Counter Badges */}
            <div className="flex items-center gap-4">
              <div className="text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                <div className="font-orbitron font-bold text-base text-[#00e5ff]">
                  {followerCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-semibold">Followers</div>
              </div>

              <div className="text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                <div className="font-orbitron font-bold text-base text-[#ff2d95]">
                  {followingCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-semibold">Following</div>
              </div>

              <div className="text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                <div className="font-orbitron font-bold text-base text-[#fbbf24] flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{likesCount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-semibold">Likes</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-orbitron text-white">{currentUser?.name || 'Creator'}</h1>
                {currentUser?.verified ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold border border-[#00e5ff]/30">
                    VERIFIED NODE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#8a8aa8] text-[10px] font-bold border border-white/10">
                    STANDARD NODE
                  </span>
                )}
              </div>
              <div className="text-xs text-[#8a8aa8] mt-0.5">
                {currentUser?.handle || '@guest'} · {currentUser?.pronouns || 'they/them'} · {currentUser?.location || 'Earth Node'}
              </div>

              {statusMessage && (
                <div className="mt-1 text-xs text-[#fbbf24] font-semibold flex items-center gap-1.5 italic">
                  <span>"{statusMessage}"</span>
                </div>
              )}
            </div>

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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
          <span>Media Shorts ({myMediaPosts.length + myClips.length})</span>
        </button>

        <button
          onClick={() => { sounds.click(); setProfileTab('customize'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'customize'
              ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Customize Profile Studio</span>
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

      {/* TAB: CUSTOMIZE STUDIO */}
      {profileTab === 'customize' && (
        <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-5">
            <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#ff2d95]" />
              Profile Customization & Appearance
            </h3>

            {/* Profile Frame Selector */}
            <div>
              <label className="text-xs font-bold text-[#8a8aa8] uppercase block mb-2">Animated Profile Frame</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {FRAME_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setProfileFrame(f.id)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      profileFrame === f.id
                        ? 'bg-white/15 border-white shadow-md font-bold text-white scale-105'
                        : 'bg-white/5 border-white/10 text-[#8a8aa8] hover:text-white'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full mx-auto block mb-1" style={{ background: f.color }} />
                    <span className="text-xs">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status Message & Emoji */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-[#8a8aa8] uppercase block mb-1">Status Emoji</label>
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {STATUS_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setStatusEmoji(em)}
                      className={`p-2 rounded-xl text-sm transition-transform ${statusEmoji === em ? 'bg-white/20 scale-125' : 'hover:bg-white/10'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#8a8aa8] uppercase block mb-1">Status Message / Motto</label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="e.g. Flashing HyperOS 2.0 & Overclocking Snapdragon!"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            {/* Banner Presets */}
            <div>
              <label className="text-xs font-bold text-[#8a8aa8] uppercase block mb-2">Cover Banner Presets</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COVER_PRESETS.map((bannerUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCoverBanner(bannerUrl)}
                    className={`h-20 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      coverBanner === bannerUrl ? 'border-[#00e5ff] scale-102 ring-2 ring-[#00e5ff]/30' : 'border-transparent hover:border-white/40'
                    }`}
                  >
                    <img src={bannerUrl} alt="Cover preset" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Picker */}
            <div>
              <label className="text-xs font-bold text-[#8a8aa8] uppercase block mb-2">Select Display Badges</label>
              <div className="flex flex-wrap gap-2">
                {ALL_AVAILABLE_BADGES.map((b) => {
                  const isSelected = badges.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => handleToggleBadge(b)}
                      className={`px-3 py-1.5 rounded-full text-xs font-orbitron font-bold transition-all ${
                        isSelected
                          ? 'bg-[#ff2d95] text-slate-900 shadow-md'
                          : 'bg-white/5 text-[#8a8aa8] border border-white/10 hover:text-white'
                      }`}
                    >
                      {b} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
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

            <div>
              <label className="text-[#8a8aa8] font-bold block mb-1">Bio Text</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform"
            >
              ⚡ PUBLISH PROFILE CUSTOMIZATION
            </button>
          </div>
        </form>
      )}

      {profileTab === 'posts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              You haven't posted any updates yet.
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
              </div>
            ))
          )}
        </div>
      )}

      {profileTab === 'media' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myMediaPosts.length === 0 && myClips.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              No photos or video clips uploaded yet.
            </div>
          ) : (
            <>
              {myClips.map((clip) => (
                <div key={clip.id} className="rounded-2xl overflow-hidden bg-black border border-white/10 relative group aspect-[9/14]">
                  <video src={clip.videoUrl} controls className="w-full h-full object-cover" />
                </div>
              ))}
              {myMediaPosts.map((post) => (
                <div key={post.id} className="rounded-2xl overflow-hidden bg-black border border-white/10 relative group aspect-[9/14]">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {profileTab === 'settings' && (
        <div className="space-y-6">
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-[#ff2d95]" />
              Blocked Accounts ({blockedUserIds.length})
            </h3>

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
                        className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold text-[11px]"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="liquid-glass rounded-3xl p-6 border border-red-500/20 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Account Management
            </h3>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={deactivateAccount}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Deactivate Profile
              </button>

              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold text-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-red-500/40 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold font-orbitron text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Account Deletion</span>
            </div>
            <p className="text-xs text-[#e8e8f4]">
              This action cannot be undone. All posts, media, and conversations will be wiped.
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
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-orbitron font-bold text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};