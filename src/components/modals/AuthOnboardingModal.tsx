import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  LogIn, 
  UserPlus, 
  X, 
  Database, 
  ShieldCheck, 
  Lock, 
  UserCheck,
  CheckCircle2,
  Zap,
  Globe
} from 'lucide-react';
import { 
  getStoredSession, 
  saveStoredSession, 
  supabase, 
  getSupabaseConfig, 
  isSupabaseConfigured 
} from '../../lib/supabase';
import { useWevids } from '../../context/WevidsContext';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface AuthOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthOnboardingModal: React.FC<AuthOnboardingModalProps> = ({ isOpen, onClose }) => {
  const { updateCurrentUser, syncWithSupabase } = useWevids();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleOAuth = async () => {
    sounds.pop();
    toast.loading('Redirecting to Google OAuth...');
    const config = getSupabaseConfig();
    if (config.url && typeof window !== 'undefined') {
      const redirectUrl = `${config.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
      window.location.href = redirectUrl;
    } else {
      toast.dismiss();
      toast.error('Supabase URL required for Google OAuth');
    }
  };

  const handleGuestAccount = () => {
    sounds.success();
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const guestSession = {
      access_token: 'guest_token_' + Date.now(),
      refresh_token: 'guest_refresh',
      expires_in: 86400 * 30,
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
    updateCurrentUser({
      name: `Guest_${guestNum}`,
      handle: `@guest_${guestNum}`,
      avatar: 'G',
      verified: false,
      isGuest: true
    });

    localStorage.setItem('wevids_onboarding_completed_v3', 'true');
    toast.success(`Welcome to WEVIDS as Guest_${guestNum}!`);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in email and password');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const res = await supabase.signUp(email, password, name);
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
      } else {
        sounds.success();
        const displayName = name || email.split('@')[0];
        updateCurrentUser({
          name: displayName,
          handle: `@${displayName.toLowerCase().replace(/\s+/g, '_')}`,
          verified: true,
          isGuest: false,
          email
        });
        localStorage.setItem('wevids_onboarding_completed_v3', 'true');
        toast.success(`Account created! Welcome, ${displayName}!`);
        syncWithSupabase();
        onClose();
      }
    } else {
      const res = await supabase.signIn(email, password);
      setLoading(false);
      if (res.error) {
        toast.error(res.error);
      } else {
        sounds.success();
        if (res.user?.email) {
          const displayName = res.user.user_metadata?.full_name || res.user.email.split('@')[0];
          updateCurrentUser({
            name: displayName,
            handle: `@${displayName.toLowerCase().replace(/\s+/g, '_')}`,
            verified: true,
            isGuest: false,
            email: res.user.email
          });
        }
        localStorage.setItem('wevids_onboarding_completed_v3', 'true');
        toast.success('Signed in successfully!');
        syncWithSupabase();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/20 max-w-md w-full space-y-5 shadow-[0_0_80px_rgba(0,229,255,0.3)] relative animate-spring-pop max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.pop();
            localStorage.setItem('wevids_onboarding_completed_v3', 'true');
            onClose();
          }}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#ff2d95]/20 to-[#00e5ff]/20 border border-[#00e5ff]/40 text-[#00e5ff] font-orbitron font-bold text-[10px] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#ff2d95] animate-spin" />
            <span>WELCOME TO WEVIDS OS v3.1</span>
          </div>

          <h2 className="text-2xl font-bold font-orbitron text-white neon-gradient-text tracking-wide">
            {isSignUp ? 'Create Your Account' : 'Sign In to WEVIDS'}
          </h2>

          <p className="text-xs text-[#8a8aa8] max-w-xs mx-auto">
            Connect to sync custom ROMs, short clips, audio stems, and multiplayer games across devices.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleGoogleOAuth}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-transform"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Guest Account Button */}
          <button
            type="button"
            onClick={handleGuestAccount}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00e5ff]/20 via-[#ff2d95]/20 to-[#fbbf24]/20 border border-[#00e5ff]/40 hover:border-[#ff2d95] text-white font-orbitron font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-102 transition-all"
          >
            <Zap className="w-4 h-4 text-[#fbbf24]" />
            <span>⚡ Temporary Guest Account (Instant)</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-center text-[#8a8aa8] text-[11px]">
          <div className="flex-1 h-px bg-white/10" />
          <span>OR WITH EMAIL & PASSWORD</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isSignUp && (
            <div>
              <label className="font-bold text-[#8a8aa8] block mb-1">Creator Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Cyber"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="font-bold text-[#8a8aa8] block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@wevids.app"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="font-bold text-[#8a8aa8] block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs tracking-wider shadow-lg hover:scale-102 transition-transform disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : isSignUp ? '⚡ REGISTER NEW ACCOUNT' : '⚡ SIGN IN'}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="text-center pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              sounds.click();
              setIsSignUp(!isSignUp);
            }}
            className="text-xs text-[#00e5ff] hover:underline font-medium"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};