import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Search, 
  Radio, 
  ShoppingBag, 
  Database,
  LogIn
} from 'lucide-react';
import { isSupabaseConfigured, getStoredSession } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';

interface TopHeaderProps {
  onOpenSupabaseModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSupabaseModal }) => {
  const { 
    setActiveView, 
    cart, 
    setIsCartOpen, 
    currentUser
  } = useWevids();
  
  const [searchQuery, setSearchQuery] = useState('');
  const isCloudConnected = isSupabaseConfigured();
  const session = getStoredSession();
  const isLoggedInWithCloud = Boolean(session?.user);

  const totalCartCount = cart ? cart.reduce((acc, i) => acc + i.quantity, 0) : 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sounds.pop();
    setActiveView('explore');
  };

  const handleOpenAuthModal = () => {
    sounds.click();
    onOpenSupabaseModal?.();
  };

  return (
    <header className="sticky top-0 z-30 ml-64 h-16 liquid-glass border-b border-white/15 px-6 flex items-center justify-between gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
      {/* Search Input Bar with Liquid Glass Sheen */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9494b8]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search HyperOS ROMs, clips, films, audio stems, creators..."
          className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white/[0.06] border border-white/20 text-xs text-white placeholder-[#9494b8] focus:outline-none focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/25 transition-all shadow-inner"
        />
      </form>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-3">
        {/* Sign-in / User Status */}
        {!isLoggedInWithCloud ? (
          <button
            onClick={handleOpenAuthModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs shadow-[0_4px_15px_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
            title="Sign In with Google or Email"
          >
            <LogIn className="w-3.5 h-3.5 text-[#ff2d95]" />
            <span>Sign In</span>
          </button>
        ) : (
          <div 
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl liquid-glass-pill text-[#10b981] text-xs font-semibold cursor-pointer hover:border-[#10b981]/50 transition-all"
            title="Account Connected"
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="hidden sm:inline font-mono">{session?.user?.email?.split('@')[0]}</span>
          </div>
        )}

        {/* Supabase Cloud Connection Manager Button */}
        <button
          onClick={handleOpenAuthModal}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border text-xs font-semibold transition-all shadow-sm ${
            isCloudConnected 
              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/25' 
              : 'liquid-glass-pill text-[#9494b8] hover:text-white'
          }`}
          title="Manage Supabase Online Database & Auth"
        >
          <Database className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-[#10b981]' : 'text-[#9494b8]'}`} />
          <span className="hidden md:inline font-orbitron">{isCloudConnected ? 'Cloud Online' : 'Link Cloud'}</span>
        </button>

        {/* Go Live Studio CTA */}
        <button
          onClick={() => {
            sounds.pop();
            setActiveView('live');
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-red-600 via-[#ff2d95] to-[#ff2d95] text-white text-xs font-bold font-orbitron tracking-wider shadow-[0_0_20px_rgba(255,45,149,0.5)] border border-white/30 hover:scale-105 transition-all"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>GO LIVE</span>
        </button>

        {/* Shopping Cart Drawer Trigger */}
        <button
          onClick={() => {
            sounds.pop();
            setIsCartOpen(true);
          }}
          className="relative p-2.5 rounded-2xl liquid-glass-pill text-[#9494b8] hover:text-white transition-colors"
          title="Open Cart"
        >
          <ShoppingBag className="w-4 h-4 text-[#fbbf24]" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff2d95] text-slate-900 font-bold text-[9px] flex items-center justify-center shadow-md">
              {totalCartCount}
            </span>
          )}
        </button>

        {/* Wallet Token Badge */}
        <div 
          onClick={() => {
            sounds.click();
            setActiveView('profile');
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl liquid-glass-pill border-[#ff2d95]/40 cursor-pointer hover:border-[#00e5ff] transition-all"
        >
          <span className="text-xs font-bold text-[#ff2d95] font-orbitron">
            ⚡ {currentUser?.walletBalance?.toFixed(0) || '0'} <span className="text-[10px] text-[#00e5ff]">WVDS</span>
          </span>
        </div>
      </div>
    </header>
  );
};