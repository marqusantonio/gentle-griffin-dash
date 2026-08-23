import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Home, 
  Film, 
  Compass, 
  FolderArchive, 
  Bot, 
  Gamepad2, 
  Music, 
  Clapperboard, 
  Radio, 
  Cpu, 
  ShoppingBag, 
  MessageSquare, 
  Bookmark, 
  User,
  ShieldAlert,
  Sparkles,
  X,
  Play
} from 'lucide-react';
import { ViewName } from '../../types/wevids';
import { sounds } from '../../lib/soundFx';

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    currentUser, 
    isMobileSidebarOpen, 
    setIsMobileSidebarOpen,
    triggerEasterEggClick
  } = useWevids();

  const isAuthorizedMod = Boolean(
    currentUser?.handle?.toLowerCase().includes('7550') || 
    currentUser?.name?.toLowerCase().includes('7550') || 
    currentUser?.id?.includes('7550') ||
    currentUser?.isAdmin
  );

  const navItems: { id: ViewName; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'feed', label: 'Feed', icon: <Home className="w-4 h-4" /> },
    { id: 'clips', label: 'Shorts', icon: <Film className="w-4 h-4 text-[#ff2d95]" />, badge: 'HOT' },
    { id: 'explore', label: 'Explore', icon: <Compass className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'files', label: 'File Share', icon: <FolderArchive className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'aihub', label: 'AI Studio', icon: <Bot className="w-4 h-4 text-purple-400" />, badge: 'v3.1' },
    { id: 'gaming', label: 'Arcade', icon: <Gamepad2 className="w-4 h-4 text-[#fbbf24]" /> },
    { id: 'audio', label: 'Audio Engine', icon: <Music className="w-4 h-4 text-pink-400" /> },
    { id: 'films', label: 'Cinema', icon: <Clapperboard className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'live', label: 'Live Stream', icon: <Radio className="w-4 h-4 text-red-500 animate-pulse" />, badge: 'LIVE' },
    { id: 'roms', label: 'ROM Repo', icon: <Cpu className="w-4 h-4 text-[#10b981]" /> },
    { id: 'mall', label: 'Digital Mall', icon: <ShoppingBag className="w-4 h-4 text-[#fbbf24]" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'bookmarks', label: 'Collections', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'profile', label: 'My Studio', icon: <User className="w-4 h-4 text-[#ff2d95]" /> },
  ];

  if (isAuthorizedMod) {
    navItems.push({ id: 'admin', label: 'Mod Console', icon: <ShieldAlert className="w-4 h-4 text-red-400" />, badge: 'ADMIN' });
  }

  const handleNavClick = (id: ViewName) => {
    sounds.click();
    setActiveView(id);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* DESKTOP STICKY SIDEBAR */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 sticky top-20 h-[calc(100vh-6rem)] rounded-3xl liquid-glass p-3 space-y-1.5 overflow-y-auto scrollbar-none border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
        
        {/* WEVIDS BRAND LOGO HEADER + 5-CLICK GUBBY EASTER EGG */}
        <div 
          onClick={triggerEasterEggClick}
          className="px-3 py-2.5 mb-1.5 rounded-2xl bg-white/[0.04] border border-white/15 flex items-center justify-between cursor-pointer hover:border-[#ff2d95]/60 hover:bg-white/[0.08] transition-all group select-none shadow-md"
          title="WEVIDS v3.1 (Tap 5 times for Easter Egg 🤫)"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff2d95] via-[#9333ea] to-[#00e5ff] p-[1.5px] shadow-[0_0_15px_rgba(255,45,149,0.5)] group-hover:scale-110 transition-transform">
              <div className="w-full h-full bg-[#0a0a1a] rounded-[10.5px] flex items-center justify-center text-white">
                <Play className="w-3.5 h-3.5 fill-current text-[#00e5ff] ml-0.5 group-hover:text-[#ff2d95] transition-colors" />
              </div>
            </div>
            <div>
              <div className="font-orbitron font-extrabold text-sm text-white tracking-wider flex items-center gap-1">
                <span>WEVIDS</span>
                <span className="text-[10px] text-[#00e5ff] font-normal">v3.1</span>
              </div>
              <div className="text-[9px] text-[#8a8aa8] font-mono tracking-tight">Social Video OS</div>
            </div>
          </div>

          <Sparkles className="w-4 h-4 text-[#ff2d95] group-hover:rotate-45 transition-transform animate-pulse" />
        </div>

        {/* Navigation Links */}
        <div className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-orbitron font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ff2d95]/30 via-[#9333ea]/30 to-[#00e5ff]/30 text-white border border-[#00e5ff]/60 shadow-[0_0_20px_rgba(0,229,255,0.35)] scale-102 font-bold'
                    : 'liquid-glass-pill text-[#9494b8] hover:text-white hover:border-white/30 hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]' : ''}`}>
                    {item.icon}
                  </div>
                  <span className={isActive ? 'text-white font-bold' : ''}>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider shadow-sm ${
                    item.badge === 'LIVE'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : item.badge === 'HOT'
                      ? 'bg-[#ff2d95]/20 text-[#ff2d95] border border-[#ff2d95]/40'
                      : item.badge === 'ADMIN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Profile Mini-Card in Liquid Glass */}
        <div className="pt-2 border-t border-white/10">
          <div 
            onClick={() => handleNavClick('profile')}
            className="p-2.5 rounded-2xl liquid-glass-pill border border-white/15 hover:border-[#00e5ff]/50 transition-all cursor-pointer flex items-center gap-2.5 group"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shadow-md shrink-0 border border-white/30 group-hover:scale-105 transition-transform"
              style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
            >
              {currentUser?.avatar || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-white truncate group-hover:text-[#00e5ff] transition-colors">
                {currentUser?.name || 'Creator'}
              </div>
              <div className="text-[10px] text-[#8a8aa8] truncate font-mono">
                {currentUser?.handle || '@guest'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md flex">
          <div className="w-72 h-full liquid-glass border-r border-white/20 p-4 flex flex-col justify-between shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4 overflow-y-auto pr-1">
              {/* MOBILE BRAND LOGO */}
              <div 
                onClick={triggerEasterEggClick}
                className="flex items-center gap-2.5 pb-3 border-b border-white/10 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff2d95] via-[#9333ea] to-[#00e5ff] p-[1.5px] shadow-md">
                  <div className="w-full h-full bg-[#0a0a1a] rounded-[10.5px] flex items-center justify-center text-[#00e5ff]">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
                <div>
                  <div className="font-orbitron font-bold text-sm text-white">WEVIDS</div>
                  <div className="text-[9px] text-[#8a8aa8] font-mono">Tap 5x for Easter Egg</div>
                </div>
              </div>

              <div className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-orbitron font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#ff2d95]/40 to-[#00e5ff]/40 text-white border border-[#00e5ff] font-bold shadow-md'
                          : 'liquid-glass-pill text-[#9494b8] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#00e5ff]/20 text-[#00e5ff]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <div 
                onClick={() => handleNavClick('profile')}
                className="p-2.5 rounded-2xl liquid-glass-pill flex items-center gap-2.5 cursor-pointer"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shrink-0"
                  style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                >
                  {currentUser?.avatar || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-white truncate">{currentUser?.name || 'Creator'}</div>
                  <div className="text-[10px] text-[#8a8aa8] truncate">{currentUser?.handle || '@guest'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}
    </>
  );
};