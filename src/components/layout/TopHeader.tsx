import React, { useState, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Search, 
  Radio, 
  ShoppingBag, 
  Database,
  LogIn
} from 'lucide-react';
import { isSupabaseConfigured, getStoredSession, supabase } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface TopHeaderProps {
  onOpenSupabaseModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSupabaseModal }) => {
  const { 
    setActiveView, 
    cart, 
    setIsCartOpen, 
    currentUser,
    updateCurrentUser
  } = useWevids();
  
  const [searchQuery, setSearchQuery] = useState('');
  const isCloudConnected = isSupabaseConfigured();
  const session = getStoredSession();
  const isLoggedInWithCloud = Boolean(session?.user);

  // Check for Google OAuth callback or provider error on load
  useEffect(() => {
    const callbackResult = supabase.parseOAuthCallback();
    if (callbackResult?.error) {
      toast.error(`Google Login: ${callbackResult.error}`);
      onOpenSupabaseModal?.();
    } else if (callbackResult?.session) {
      sounds.success();
      toast.success('Successfully authenticated with Google!');
      supabase.getUser().then((res) => {
        if (res.user) {
          const name = res.user.user_metadata?.full_name || res.user.user_metadata?.name || res.user.email?.split('@')[0] || 'Google Creator';
          const avatar = res.user.user_metadata?.avatar_url || res.user.user_metadata?.picture;
          updateCurrentUser({
            name,
            handle: `@${name.toLowerCase().replace(/\s+/g, '_')}`,
            avatarImage: avatar,
            verified: true,
          });
        }
      });
    }
  }, []);

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
    <header className="sticky top-0 z-30 ml-64 h-16 liquid-glass border-b border-white/10 px-6 flex items-center justify-between gap-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8aa8]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search HyperOS ROMs, clips, films, audio stems, creators..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/20 transition-all"
        />
      </form>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-3">
        {/* Sign-in / User Status */}
        {!isLoggedInWithCloud ? (
          <button
            onClick={handleOpenAuthModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs shadow-md transition-transform hover:scale-105"
            title="Sign In with Google or Email"
          >
            <LogIn className="w-3.5 h-3.5 text-[#ff2d95]" />
            <span>Sign In</span>
          </button>
        ) : (
          <div 
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3ecf8e]/15 border border-[#3ecf8e]/40 text-[#3ecf8e] text-xs font-semibold cursor-pointer hover:bg-[#3ecf8e]/25 transition-all"
            title="Account Connected"
          >
            <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-ping" />
            <span className="hidden sm:inline font-mono">{session?.user?.email?.split('@')[0]}</span>
          </div>
        )}

        {/* Supabase Cloud Connection Manager Button */}
        <button
          onClick={handleOpenAuthModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isCloudConnected 
              ? 'bg-[#3ecf8e]/15 border-[#3ecf8e]/40 text-[#3ecf8e] hover:bg-[#3ecf8e]/25' 
              : 'bg-white/5 border-white/10 text-[#8a8aa8] hover:text-white'
          }`}
          title="Manage Supabase Online Database & Auth"
        >
          <Database className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-[#3ecf8e]' : 'text-[#8a8aa8]'}`} />
          <span className="hidden md:inline">{isCloudConnected ? 'Cloud Online' : 'Link Cloud'}</span>
        </button>

        {/* Go Live Studio CTA */}
        <button
          onClick={() => setActiveView('live')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-[#ff2d95] text-white text-xs font-bold font-orbitron tracking-wider shadow-[0_0_15px_rgba(255,45,149,0.4)] hover:scale-105 transition-all"
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
          className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8a8aa8] hover:text-white transition-colors"
          title="Open Cart"
        >
          <ShoppingBag className="w-4 h-4 text-[#fbbf24]" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff2d95] text-slate-900 font-bold text-[9px] flex items-center justify-center">
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
            ⚡ {currentUser?.walletBalance?.toFixed(0) || '0'} <span className="text-[10px] text-[#00e5ff]">WVDS</span>
          </span>
        </div>
      </div>
    </header>
  );
};