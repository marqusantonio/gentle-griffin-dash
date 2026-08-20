import React, { useState, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Search, 
  Radio, 
  ShoppingBag, 
  Database,
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

  // Check for Google OAuth callback on load
  useEffect(() => {
    const parsedSession = supabase.parseOAuthCallback();
    if (parsedSession) {
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

  const handleGoogleQuickSignIn = async () => {
    sounds.click();
    if (!isCloudConnected) {
      toast.error('Please enter your Supabase URL & Public Anon Key in the Link Cloud popup first!');
      onOpenSupabaseModal?.();
      return;
    }
    toast.loading('Redirecting to Google Sign-In...');
    const res = await supabase.signInWithGoogle();
    if (res.error) {
      toast.error(res.error);
      onOpenSupabaseModal?.();
    }
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
        {/* Google Sign-in or User Status */}
        {!isLoggedInWithCloud ? (
          <button
            onClick={handleGoogleQuickSignIn}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs shadow-md transition-transform hover:scale-105"
            title="Sign In with Google OAuth"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span className="hidden sm:inline">Google Login</span>
          </button>
        ) : (
          <div 
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3ecf8e]/15 border border-[#3ecf8e]/40 text-[#3ecf8e] text-xs font-semibold cursor-pointer hover:bg-[#3ecf8e]/25 transition-all"
            title="Google Account Connected"
          >
            <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-ping" />
            <span className="hidden sm:inline font-mono">{session?.user?.email?.split('@')[0]}</span>
          </div>
        )}

        {/* Supabase Cloud Connection Manager Button */}
        <button
          onClick={() => {
            sounds.click();
            onOpenSupabaseModal?.();
          }}
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