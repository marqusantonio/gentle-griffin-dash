import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { ViewName } from '../../types/wevids';
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
  Bookmark
} from 'lucide-react';

interface NavItem {
  id: ViewName;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  isLive?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    id: 'clips',
    label: 'Clips',
    icon: Video,
    isLive: false
  },
  {
    id: 'feed',
    label: 'Feed',
    icon: MessageSquareText,
    isLive: false
  },
  {
    id: 'films',
    label: 'Films & Cinema',
    icon: Clapperboard,
    badge: '4K HDR',
    badgeColor: 'bg-[#ff2d95] text-slate-900',
    isLive: false
  },
  {
    id: 'audio',
    label: 'Audio & Beats',
    icon: Headphones,
    badge: 'MP3 SYNC',
    badgeColor: 'bg-[#00e5ff] text-slate-900',
    isLive: false
  },
  {
    id: 'gaming',
    label: 'Gaming Hub (10+)',
    icon: Gamepad2,
    badge: 'NEW',
    badgeColor: 'bg-[#fbbf24] text-slate-900',
    isLive: false
  },
  {
    id: 'files',
    label: 'File Vault',
    icon: FolderDown,
    isLive: false
  },
  {
    id: 'aihub',
    label: 'AI Hub',
    icon: Sparkles,
    isLive: false
  },
  {
    id: 'roms',
    label: 'ROMs & Kernels',
    icon: FileCode2,
    isLive: false
  },
  {
    id: 'mall',
    label: 'Mall',
    icon: ShoppingBag,
    isLive: false
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageSquareText,
    isLive: false
  },
  {
    id: 'bookmarks',
    label: 'Saved Vault',
    icon: Bookmark,
    isLive: false
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserCheck,
    isLive: false
  }
];

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    currentUser, 
    soundEnabled, 
    setSoundEnabled,
    conversations
  } = useWevids();

  return (
    <aside className="w-64 fixed top-0 left-0 bottom-0 z-40 flex flex-col liquid-glass border-r border-white/10 p-4 transition-all duration-300">
      {/* Brand Header */}
      <div 
        onClick={() => setActiveView('clips')}
        className="flex items-center gap-3 px-3 py-3 mb-3 rounded-2xl cursor-pointer group hover:bg-white/5 transition-all"
      >
        <div 
          className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff2d95] to-[#00e5ff] flex items-center justify-center shadow-[0_0_20px_rgba(255,45,149,0.5)] group-hover:scale-105 transition-transform"
        >
          <Video className="w-5 h-5 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#0a0a1a] animate-pulse" />
        </div>
        <div>
          <div className="font-orbitron font-bold text-xl tracking-wider neon-gradient-text flex items-center gap-1.5">
            WEVIDS
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff2d95]/20 text-[#ff2d95] font-sans font-semibold border border-[#ff2d95]/30">v3.1</span>
          </div>
          <p className="text-[10px] text-[#8a8aa8] font-medium tracking-wide">Borderless World Network</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#ff2d95]/20 to-[#00e5ff]/15 text-white border border-[#ff2d95]/40 shadow-md'
                  : 'text-[#8a8aa8] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-gradient-to-b from-[#ff2d95] to-[#00e5ff]" />
              )}
              <Icon 
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-[#ff2d95]' : 'text-[#8a8aa8] group-hover:text-[#00e5ff]'
                }`} 
              />
              <span className="flex-1 text-left tracking-wide font-semibold">{item.label}</span>
              
              {item.isLive && (
                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  LIVE
                </span>
              )}

              {item.badge && !item.isLive && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  item.badgeColor 
                    ? item.badgeColor 
                    : 'bg-white/10 text-[#00e5ff] border border-[#00e5ff]/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick User Tile and Sound */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-[#8a8aa8]">
          <div className="flex items-center gap-1.5 text-[10px] text-[#00e5ff]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span>Encrypted Node v3.1</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded-lg hover:bg-white/10 text-[#8a8aa8] hover:text-[#ff2d95] transition-colors"
            title={soundEnabled ? 'Mute audio' : 'Enable audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#ff2d95]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* User Card */}
        <div 
          onClick={() => setActiveView('profile')}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all group"
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs shadow-md flex-shrink-0"
            style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
          >
            {currentUser?.avatarImage ? (
              <img src={currentUser.avatarImage} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              currentUser?.avatar || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1">
              {currentUser?.name || 'Loading...'}
            </div>
            <div className="text-[10px] text-[#00e5ff] font-orbitron truncate">
              {currentUser?.handle || '@loading'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};