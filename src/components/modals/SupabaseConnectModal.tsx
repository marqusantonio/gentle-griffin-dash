import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Mail, 
  LogOut,
  X,
  Sparkles,
  User,
  ShieldCheck,
  Zap,
  LogIn,
  UserPlus
} from 'lucide-react';
import { 
  getStoredSession,
  saveStoredSession,
  supabase,
  isSupabaseConfigured
} from '../../lib/supabase';
import { useWevids } from '../../context/WevidsContext';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({ isOpen, onClose }) => {
  const { updateCurrentUser, syncWithSupabase, currentUser } = useWevids();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<string | null>(() => getStoredSession()?.user?.email || null);

  useEffect(() => {
    if (isOpen) {
      const session = getStoredSession();
      setCurrentSessionUser(session?.user?.email || null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    sounds.pop();
    toast.loading('Connecting with Google...');
    const res = await supabase.signInWithGoogle();
    if (res.error) {
      toast.dismiss();
      toast.error(res.error);
    }
  };

  const handleQuickGuestSignIn = () => {
    sounds.success();
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestSession = {
      access_token: 'guest_token_' + Date.now(),
      refresh_token: 'guest_refresh',
      expires_in: 86400 * 7,
      token_type: 'bearer',
      user: {
        id: `guest-${guestNum}`,
        email: `guest_${guestNum}@wevids.app`,
        user_metadata: {
          full_name: `Guest_${guestNum}`,
        }
      }
    };
    saveStoredSession(guestSession);
    setCurrentSessionUser(guestSession.user.email);
    updateCurrentUser({
      name: `Guest_${guestNum}`,
      handle: `@guest_${guestNum}`,
      avatar: 'G',
      verified: false,
    });
    toast.success(`Logged in as Guest_${guestNum}!`);
    onClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter an email and password');
      return;
    }
    setAuthLoading(true);
    const res = await supabase.signUp(email, password, name);
    setAuthLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      sounds.success();
      const displayName = name || email.split('@')[0];
      setCurrentSessionUser(email);
      updateCurrentUser({ 
        name: displayName, 
        handle: `@${displayName.toLowerCase().replace(/\s+/g, '_')}`,
        verified: true
      });
      toast.success(`Account created! Welcome, ${displayName}!`);
      onClose();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter an email and password');
      return;
    }
    setAuthLoading(true);
    const res = await supabase.signIn(email, password);
    setAuthLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      sounds.success();
      if (res.user?.email) {
        setCurrentSessionUser(res.user.email);
        const displayName = res.user.user_metadata?.full_name || res.user.email.split('@')[0];
        updateCurrentUser({ 
          name: displayName, 
          handle: `@${displayName.toLowerCase().replace(/\s+/g, '_')}`,
          verified: true
        });
      }
      toast.success('Signed in successfully!');
      syncWithSupabase();
      onClose();
    }
  };

  const handleSignOut = async () => {
    await supabase.signOut();
    setCurrentSessionUser(null);
    sounds.pop();
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    updateCurrentUser({
      name: `Guest_${guestNum}`,
      handle: `@guest_${guestNum}`,
      avatar: 'G',
      verified: false
    });
    toast.info('Signed out. Switched back to Guest mode.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/20 max-w-md w-full space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff2d95] to-[#00e5ff] flex items-center justify-center text-slate-900 shadow-md">
            <User className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-base text-white flex items-center gap-2">
              WEVIDS Account Access
            </div>
            <p className="text-xs text-[#8a8aa8]">Sync clips, bookmarks, messages, and game scores</p>
          </div>
        </div>

        {currentSessionUser ? (
          <div className="p-4 rounded-2xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#3ecf8e] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Currently Signed In</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#3ecf8e]/20 text-[#3ecf8e] text-[10px] font-bold font-orbitron">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-white font-mono truncate">
              {currentSessionUser}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 font-bold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Return to Guest Mode</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs">
            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-transform hover:scale-102"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Instant 1-Click Guest Sign-In */}
            <button
              type="button"
              onClick={handleQuickGuestSignIn}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#00e5ff]/15 to-[#ff2d95]/15 border border-[#00e5ff]/30 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span>⚡ Generate New Guest Profile</span>
            </button>

            <div className="flex items-center gap-2 text-center text-[#8a8aa8] text-[11px] my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span>OR EMAIL & PASSWORD</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={isRegistering ? handleSignUp : handleSignIn} className="space-y-3">
              {isRegistering && (
                <div>
                  <label className="font-bold text-white block mb-1 text-[11px]">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Creator Name"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-white block mb-1 text-[11px]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1 text-[11px]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-1 py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-102 transition-transform disabled:opacity-50"
              >
                {authLoading 
                  ? 'CONNECTING...' 
                  : isRegistering 
                  ? '⚡ CREATE NEW ACCOUNT' 
                  : '⚡ SIGN IN'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-[#00e5ff] hover:underline"
                >
                  {isRegistering 
                    ? 'Already have an account? Sign In' 
                    : 'Don’t have an account? Create Account'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
</dyad-file>

<dyad-write path="src/components/layout/TopHeader.tsx" description="Clean up TopHeader to show user status cleanly without confusing cloud buttons">
import React, { useState, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Search, 
  Radio, 
  ShoppingBag, 
  User,
  LogIn
} from 'lucide-react';
import { getStoredSession, supabase } from '../../lib/supabase';
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
  const session = getStoredSession();
  const isLoggedInWithCloud = Boolean(session?.user);

  // Check for Google OAuth callback or provider error on load
  useEffect(() => {
    const callbackResult = supabase.parseOAuthCallback();
    if (callbackResult?.error) {
      toast.error(`Login: ${callbackResult.error}`);
    } else if (callbackResult?.session) {
      sounds.success();
      toast.success('Signed in successfully with Google!');
      supabase.getUser().then((res) => {
        if (res.user) {
          const name = res.user.user_metadata?.full_name || res.user.user_metadata?.name || res.user.email?.split('@')[0] || 'Creator';
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
          placeholder="Search ROMs, clips, films, audio stems, creators..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/20 transition-all"
        />
      </form>

      {/* Action Badges & Buttons */}
      <div className="flex items-center gap-3">
        {/* Sign In / Account Status */}
        <button
          onClick={handleOpenAuthModal}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-transform hover:scale-105 shadow-md ${
            isLoggedInWithCloud
              ? 'bg-[#3ecf8e]/15 border border-[#3ecf8e]/40 text-[#3ecf8e] hover:bg-[#3ecf8e]/25'
              : 'bg-white hover:bg-gray-100 text-gray-900'
          }`}
          title="Manage Account / Sign In"
        >
          {isLoggedInWithCloud ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-ping" />
              <span className="font-mono text-xs max-w-[120px] truncate">{currentUser?.name}</span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 text-[#ff2d95]" />
              <span>Sign In / Account</span>
            </>
          )}
        </button>

        {/* Go Live Studio CTA */}
        <button
          onClick={() => setActiveView('live')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-[#ff2d95] text-white text-xs font-bold font-orbitron tracking-wider shadow-[0_0_15px_rgba(255,45,149,0.4)] hover:scale-105 transition-all"
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
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95]/15 to-[#00e5ff]/15 border border-[#ff2d95]/30 cursor-pointer hover:border-[#00e5ff] transition-all"
        >
          <span className="text-xs font-bold text-[#ff2d95] font-orbitron">
            ⚡ {currentUser?.walletBalance?.toFixed(0) || '0'} <span className="text-[10px] text-[#00e5ff]">WVDS</span>
          </span>
        </div>
      </div>
    </header>
  );
};