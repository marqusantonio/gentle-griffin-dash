import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Home, 
  Film, 
  Bot, 
  Gamepad2, 
  MessageSquare, 
  User 
} from 'lucide-react';
import { ViewName } from '../../types/wevids';
import { sounds } from '../../lib/soundFx';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView } = useWevids();

  const navItems: { id: ViewName; label: string; icon: React.ReactNode }[] = [
    { id: 'feed', label: 'Feed', icon: <Home className="w-5 h-5" /> },
    { id: 'clips', label: 'Shorts', icon: <Film className="w-5 h-5 text-[#ff2d95]" /> },
    { id: 'aihub', label: 'AI Studio', icon: <Bot className="w-5 h-5 text-purple-400" /> },
    { id: 'gaming', label: 'Arcade', icon: <Gamepad2 className="w-5 h-5 text-[#fbbf24]" /> },
    { id: 'messages', label: 'Inbox', icon: <MessageSquare className="w-5 h-5 text-[#00e5ff]" /> },
    { id: 'profile', label: 'Studio', icon: <User className="w-5 h-5 text-[#ff2d95]" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden liquid-glass border-t border-white/15 px-2 py-1.5 flex items-center justify-around backdrop-blur-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              sounds.click();
              setActiveView(item.id);
            }}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-2xl transition-all ${
              isActive
                ? 'text-[#00e5ff] scale-110 font-bold'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-orbitron font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};