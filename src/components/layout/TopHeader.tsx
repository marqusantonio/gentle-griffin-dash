import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Search, 
  Radio, 
  ShoppingBag, 
  Database,
  LogIn,
  Menu,
  Zap,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { isSupabaseConfigured, getStoredSession } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';

interface TopHeaderProps {
  onOpenSupabaseModal?: () => void;
  onOpenPerfModal?: () => void;
  perfMode: 'entry' | 'highend';
  onTogglePerfMode: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ 
  onOpenSupabaseModal, 
  onOpenPerfModal, 
  perfMode, 
  onTogglePerfMode 
}) => {
  const { 
    setActiveView, 
    cart, 
    setIsCartOpen, 
    currentUser,
    setIsMobileSidebarOpen,
    syncWithSupabase,
    isCloudSyncing,
    lastCloudSync
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
    <header className="sticky top-0 z-30 w-full h-16 liquid-glass border-b border-white/15 px-4 sm:px-6 flex items-center justify-between gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
      {/* Mobile Hamburger Menu */}
      <button
        type="button"
        onClick={() => {
          sounds.click();
          setIsMobileSidebarOpen(true);
        }}
        className="p-2 rounded-xl liquid-glass-pill md:hidden text-white hover:text-[#00e5ff] transition-colors"
        title="Open Navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search Input Bar with Liquid Glass Sheen */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:block">
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
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Supabase Auto-Sync Heartbeat Indicator */}
        <button
          type="button"
          onClick={() => {
            sounds.click();
            syncWithSupabase();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-orbitron font-bold transition-all shadow-sm ${
            isCloudConnected 
              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/25' 
              : 'liquid-glass-pill text-[#9494b8] hover:text-white'
          }`}
          title={isCloudConnected ? `Supabase Live Synced (Last: ${lastCloudSync || 'Active'}). Click to sync now.` : 'Click to configure Supabase Connection'}
        >
          {isCloudConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline text-[11px]">Auto-Sync Live</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-[#9494b8]" />
              <span className="hidden md:inline text-[11px]">Connect Supabase</span>
            </>
          )}
        </button>

        {/* Graphics Performance Mode Switch */}
        <button
          type="button"
          onClick={() => {
            sounds.click();
            onTogglePerfMode();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-orbitron font-bold transition-all shadow-sm ${
            perfMode === 'entry'
              ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/50'
              : 'bg-[#ff2d95]/20 text-[#ff2d95] border-[#ff2d95]/50'
          }`}
          title={perfMode === 'entry' ? 'Running Fast Mode. Click to enable Liquid Glass.' : 'Running Liquid Glass. Click to switch to Fast Mode.'}
        >
          {perfMode === 'entry' ? (
            <>
              <Zap className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="hidden xs:inline">Fast FPS</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#ff2d95]" />
              <span className="hidden xs:inline">Liquid Glass</span>
            </>
          )}
        </button>

        {/* Sign-in / User Status */}
        {!isLoggedInWithCloud ? (
          <button
            onClick={handleOpenAuthModal}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs shadow-[0_4px_15px_rgba(255,255,255,0.3)] transition-transform hover:scale-105"
            title="Sign In with Google or Email"
          >
            <LogIn className="w-3.5 h-3.5 text-[#ff2d95]" />
            <span className="hidden xs:inline">Sign In</span>
          </button>
        ) : (
          <div 
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl liquid-glass-pill text-[#10b981] text-xs font-semibold cursor-pointer hover:border-[#10b981]/50 transition-all"
            title="Account Connected"
          >
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="hidden sm:inline font-mono">{session?.user?.email?.split('@')[0]}</span>
          </div>
        )}

        {/* Go Live Studio CTA */}
        <button
          onClick={() => {
            sounds.pop();
            setActiveView('live');
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-red-600 via-[#ff2d95] to-[#ff2d95] text-white text-xs font-bold font-orbitron tracking-wider shadow-[0_0_20px_rgba(255,45,149,0.5)] border border-white/30 hover:scale-105 transition-all"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">GO LIVE</span>
        </button>

        {/* Shopping Cart Drawer Trigger */}
        <button
          onClick={() => {
            sounds.pop();
            setIsCartOpen(true);
          }}
          className="relative p-2 rounded-2xl liquid-glass-pill text-[#9494b8] hover:text-white transition-colors"
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl liquid-glass-pill border-[#ff2d95]/40 cursor-pointer hover:border-[#00e5ff] transition-all"
        >
          <span className="text-xs font-bold text-[#ff2d95] font-orbitron">
            ⚡ {currentUser?.walletBalance ? Number(currentUser.walletBalance).toFixed(0) : '0'} <span className="text-[10px] text-[#00e5ff] hidden xs:inline">WVDS</span>
          </span>
        </div>
      </div>
    </header>
  );
};