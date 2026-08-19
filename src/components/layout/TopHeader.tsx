import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Search, 
  Radio, 
  ShoppingBag, 
  Bell, 
  Sparkles, 
  Plus, 
  Cpu, 
  Flame,
  Globe
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const TopHeader: React.FC = () => {
  const { 
    setActiveView, 
    cart, 
    setIsCartOpen, 
    currentUser, 
    openShareModal 
  } = useWevids();
  
  const [searchQuery, setSearchQuery] = useState('');
  const totalCartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sounds.pop();
    setActiveView('explore');
  };

  return (
    <header className="sticky top-0 z-30 ml-64 h-16 liquid-glass border-b border-white/10 px-6 flex items-center justify-between gap-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8aa8]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search HyperOS ROMs, clips, creators, Minecraft worlds..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/20 transition-all"
        />
      </form>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-3">
        {/* Global Node Presence */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8a8aa8]">
          <Globe className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>Nodes: <strong className="text-white">Active (v3.1)</strong></span>
        </div>

        {/* Go Live Studio CTA */}
        <button
          onClick={() => setActiveView('live')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-[#ff2d95] text-white text-xs font-bold font-orbitron tracking-wider shadow-[0_0_15px_rgba(255,45,149,0.4)] hover:scale-105 transition-all"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>GO LIVE</span>
        </button>

        {/* AI Video Generator Quick CTA */}
        <button
          onClick={() => setActiveView('aihub')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00e5ff]/20 to-[#9333ea]/20 text-[#00e5ff] border border-[#00e5ff]/30 text-xs font-semibold hover:border-[#00e5ff] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span>AI Studio</span>
        </button>

        {/* Shopping Cart Drawer Trigger */}
        <button
          onClick={() => {
            sounds.pop();
            setIsCartOpen(true);
          }}
          className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8a8aa8] hover:text-white transition-colors"
          title="Open Cart"
        >
          <ShoppingBag className="w-4 h-4" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ff2d95] text-slate-900 font-bold text-[10px] flex items-center justify-center shadow-lg animate-bounce">
              {totalCartCount}
            </span>
          )}
        </button>

        {/* Wallet Token Badge */}
        <div 
          onClick={() => setActiveView('profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff2d95]/15 to-[#00e5ff]/15 border border-[#ff2d95]/30 cursor-pointer hover:border-[#00e5ff] transition-all"
        >
          <span className="text-xs font-bold text-[#ff2d95] font-orbitron">
            ⚡ {currentUser.walletBalance.toFixed(0)} <span className="text-[10px] text-[#00e5ff]">WVDS</span>
          </span>
        </div>
      </div>
    </header>
  );
};