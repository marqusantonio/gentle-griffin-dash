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
  ShieldAlert
} from 'lucide-react';
import { ViewName } from '../../types/wevids';
import { sounds } from '../../lib/soundFx';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, currentUser } = useWevids();

  const navItems: { id: ViewName; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'feed', label: 'Feed', icon: <Home className="w-4 h-4" /> },
    { id: 'clips', label: 'Shorts', icon: <Film className="w-4 h-4 text-[#ff2d95]" />, badge: 'HOT' },
    { id: 'explore', label: 'Explore', icon: <Compass className="w-4 h-4" /> },
    { id: 'files', label: 'File Share', icon: <FolderArchive className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'aihub', label: 'AI Studio', icon: <Bot className="w-4 h-4 text-purple-400" /> },
    { id: 'gaming', label: 'Arcade', icon: <Gamepad2 className="w-4 h-4 text-[#fbbf24]" /> },
    { id: 'audio', label: 'Audio Engine', icon: <Music className="w-4 h-4 text-pink-400" /> },
    { id: 'films', label: 'Cinema', icon: <Clapperboard className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'live', label: 'Live Stream', icon: <Radio className="w-4 h-4 text-red-500 animate-pulse" /> },
    { id: 'roms', label: 'ROM Repository', icon: <Cpu className="w-4 h-4 text-[#10b981]" /> },
    { id: 'mall', label: 'Digital Mall', icon: <ShoppingBag className="w-4 h-4 text-[#fbbf24]" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4 text-[#00e5ff]" /> },
    { id: 'bookmarks', label: 'Collections', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'profile', label: 'My Studio', icon: <User className="w-4 h-4 text-[#ff2d95]" /> },
    { id: 'admin', label: 'Mod Console', icon: <ShieldAlert className="w-4 h-4 text-red-400" />, badge: 'ADMIN' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 space-y-1.5 py-2 sticky top-16 h-[calc(100vh-5rem)] overflow-y-auto scrollbar-none">
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              sounds.click();
              setActiveView(item.id);
            }}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-orbitron font-medium transition-all ${
              isActive
                ? 'bg-gradient-to-r from-[#ff2d95]/20 to-[#00e5ff]/20 text-white border border-[#00e5ff]/40 shadow-lg scale-102'
                : 'text-[#8a8aa8] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                item.badge === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#ff2d95]/20 text-[#ff2d95]'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
};