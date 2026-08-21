import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { ViewName, UserProfile } from '../../types/wevids';
import { 
  FileCode2,
  FolderDown,
  Sparkles, 
  Gamepad2, 
  Headphones, 
  Clapperboard,
  ShoppingBag, 
  MessageSquareText, 
  UserCheck, 
  Volume2, 
  VolumeX, 
  Video,
  Bookmark,
  UserPlus,
  Check,
  ShieldCheck,
  X
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

interface NavItem {
  id: ViewName;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const mainNavItems: NavItem[] = [
  {
    id: 'clips',
    label: 'Clips',
    icon: Video,
  },
  {
    id: 'feed',
    label: 'Feed',
    icon: MessageSquareText,
  },
  {
    id: 'films',
    label: 'Films & Cinema',
    icon: Clapperboard,
    badge: '4K HDR',
    badgeColor: 'bg-gradient-to-r from-[#ff2d95] to-[#c026d3] text-white',
  },
  {
    id: 'audio',
    label: 'Audio & Beats',
    icon: Headphones,
    badge: 'MP3 DECK',
    badgeColor: 'bg-gradient-to-r from-[#00e5ff] to-[#3b82f6] text-slate-900',
  },
  {
    id: 'gaming',
    label: 'Gaming Hub (10+)',
    icon: Gamepad2,
    badge: 'PLAY',
    badgeColor: 'bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900',
  },
  {
    id: 'files',
    label: 'File Vault',
    icon: FolderDown,
  },
  {
    id: 'aihub',
    label: 'AI Hub',
    icon: Sparkles,
  },
  {
    id: 'roms',
    label: 'ROMs & Kernels',
    icon: FileCode2,
  },
  {
    id: 'mall',
    label: 'Mall',
    icon: ShoppingBag,
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquareText,
  },
  {
    id: 'bookmarks',
    label: 'Saved Vault',
    icon: Bookmark,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserCheck,
  }
];

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    currentUser, 
    soundEnabled, 
    setSoundEnabled,
    allUsers,
    toggleFollowUser,
    isFollowing,
    openUserProfileModal,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useWevids();

  const onlineProfiles = Object.values(allUsers || {}).filter(u => u && u.id && u.id !== currentUser?.id);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside className={`w-64 fixed top-0 bottom-0 left-0 z-50 flex flex-col liquid-glass p-4 transition-transform duration-300 md:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header with Liquid Droplet Lens */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div 
            onClick={() => {
              sounds.click();
              setActiveView('feed');
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 py-2 rounded-2xl cursor-pointer group transition-all"
          >
            <div 
              className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff2d95] to-[#00e5ff] flex items-center justify-center shadow-[0_0_25px_rgba(255,45,149,0.6)] group-hover:scale-110 transition-transform duration-300 border border-white/40"
            >
              <Video className="w-5 h-5 text-white drop-shadow-md" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#050512] animate-pulse" />
            </div>
            <div>
              <div className="font-orbitron font-bold text-xl tracking-wider neon-gradient-text flex items-center gap-1.5 drop-shadow">
                WEVIDS
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#00e5ff] font-sans font-semibold border border-white/20">v3.1</span>
              </div>
              <p className="text-[10px] text-[#9494b8] font-medium tracking-wide">Liquid Glass OS</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#9494b8] md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.click();
                  setActiveView(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs transition-all duration-250 group relative ${
                  isActive
                    ? 'liquid-glass border-white/30 text-white shadow-[0_8px_25px_rgba(0,0,0,0.5)] scale-[1.02]'
                    : 'text-[#9494b8] hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full bg-gradient-to-b from-[#ff2d95] to-[#00e5ff] shadow-[0_0_12px_#00e5ff]" />
                )}
                <Icon 
                  className={`w-4 h-4 transition-transform duration-300 group-hover:scale-115 ${
                    isActive ? 'text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]' : 'text-[#9494b8] group-hover:text-[#ff2d95]'
                  }`} 
                />
                <span className="flex-1 text-left tracking-wide font-semibold">{item.label}</span>

                {item.badge && (
                  <span className={`text-[9px] font-orbitron font-bold px-2 py-0.5 rounded-full shadow-md ${
                    item.badgeColor 
                      ? item.badgeColor 
                      : 'bg-white/10 text-[#00e5ff] border border-[#00e5ff]/40'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Live Community Members */}
          {onlineProfiles.length > 0 && (
            <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
              <div className="px-2 text-[10px] font-bold text-[#00e5ff] uppercase tracking-wider flex items-center justify-between font-orbitron">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#ff2d95]" />
                  Live Node ({onlineProfiles.length})
                </span>
              </div>

              <div className="space-y-1.5">
                {onlineProfiles.slice(0, 5).map((rec: UserProfile) => {
                  const following = isFollowing(rec.id);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all text-xs shadow-sm"
                    >
                      <div 
                        onClick={() => openUserProfileModal(rec)}
                        className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                      >
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-900 text-xs font-bold flex-shrink-0 border border-white/30"
                          style={{ background: rec.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                        >
                          {rec.avatar || rec.name?.charAt(0) || 'U'}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-white text-[11px] truncate flex items-center gap-1">
                            {rec.name}
                            {rec.verified && <ShieldCheck className="w-3 h-3 text-[#00e5ff]" />}
                          </div>
                          <div className="text-[9px] text-[#9494b8] truncate">{rec.handle || '@user'}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFollowUser(rec.id)}
                        className={`p-1.5 rounded-xl text-[10px] font-bold transition-transform hover:scale-108 flex-shrink-0 ml-1 shadow-sm ${
                          following
                            ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                            : 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900'
                        }`}
                        title={following ? 'Unfollow' : 'Follow Creator'}
                      >
                        {following ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Quick User Tile and Sound */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-[#9494b8]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#00e5ff] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <span>{currentUser?.isGuest ? 'Fluid Guest Mode' : 'Verified Account'}</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-[#9494b8] hover:text-[#ff2d95] transition-colors"
              title={soundEnabled ? 'Mute audio' : 'Enable audio'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#ff2d95]" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* User Card */}
          <div 
            onClick={() => {
              sounds.click();
              setActiveView('profile');
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl liquid-glass-pill cursor-pointer transition-all group hover:border-[#00e5ff]/50"
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs shadow-lg flex-shrink-0 border border-white/40"
              style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
            >
              {currentUser?.avatarImage ? (
                <img src={currentUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                currentUser?.avatar || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                {currentUser?.name || 'Creator'}
                {currentUser?.isGuest ? (
                  <span className="text-[8px] bg-white/15 text-[#9494b8] px-1.5 py-0.2 rounded-full font-sans">Guest</span>
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00e5ff] flex-shrink-0" />
                )}
              </div>
              <div className="text-[10px] text-[#00e5ff] font-orbitron truncate">
                {currentUser?.handle || '@user'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};