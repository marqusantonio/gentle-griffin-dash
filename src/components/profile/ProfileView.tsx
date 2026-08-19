import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  UserCheck, 
  Edit3, 
  Camera, 
  Music2, 
  Play, 
  Pause, 
  Sparkles,
  MessageSquare,
  UserPlus,
  ShieldCheck,
  Check
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUser, 
    startOrOpenChatWithUser 
  } = useWevids();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [pronouns, setPronouns] = useState(currentUser.pronouns || 'they/them');
  const [bioAudioTitle, setBioAudioTitle] = useState(currentUser.bioAudioTitle || 'Ambient Neon Theme');

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      audioRef.current.play();
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
  };

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
              {isEditing ? 'Cancel' : 'Edit Profile & Audio'}
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-2 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 mb-4">
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-full border-4 border-[#0a0a1a] shadow-2xl flex items-center justify-center font-bold text-slate-900 text-3xl overflow-hidden"
                style={{ background: currentUser.color }}
              >
                {currentUser.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser.avatar
                )}
              </div>

              {/* Upload avatar */}
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-[#ff2d95] text-slate-900 cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-orbitron font-bold text-sm text-[#00e5ff]">{(currentUser.followers || 0).toLocaleString()}</div>
                <div className="text-[10px] text-[#8a8aa8]">Followers</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-orbitron font-bold text-sm text-[#ff2d95]">{(currentUser.following || 0).toLocaleString()}</div>
                <div className="text-[10px] text-[#8a8aa8]">Following</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="font-orbitron font-bold text-sm text-[#fbbf24]">{currentUser.walletBalance.toFixed(0)} WVDS</div>
                <div className="text-[10px] text-[#8a8aa8]">Token Balance</div>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-orbitron text-white">{currentUser.name}</h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold">
                    VERIFIED CREATOR
                  </span>
                </div>
                <div className="text-xs text-[#8a8aa8] mt-0.5">
                  {currentUser.handle} · {currentUser.pronouns} · {currentUser.location}
                </div>
              </div>

              {/* Bio Audio / Voice Note player */}
              {currentUser.bioAudioUrl && (
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
                        <span>{currentUser.bioAudioTitle || 'Bio Audio Track'}</span>
                      </div>
                      <div className="text-[10px] text-[#8a8aa8]">Featured Creator Audio</div>
                    </div>
                  </div>
                  <audio ref={audioRef} src={currentUser.bioAudioUrl} onEnded={() => setIsPlayingAudio(false)} />
                </div>
              )}

              <p className="text-xs text-[#e8e8f4] max-w-2xl leading-relaxed pt-1">{currentUser.bio}</p>
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
    </div>
  );
};