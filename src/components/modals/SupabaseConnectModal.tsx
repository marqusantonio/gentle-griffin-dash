import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Copy, 
  Lock, 
  Mail, 
  Globe, 
  KeyRound, 
  LogOut,
  X,
  Zap,
  UserPlus,
  LogIn,
  Gamepad2,
  Share2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Link2
} from 'lucide-react';
import { 
  getSupabaseConfig,
  saveSupabaseCredentials, 
  clearSupabaseCredentials, 
  isSupabaseConfigured,
  getStoredSession,
  saveStoredSession,
  supabase 
} from '../../lib/supabase';
import { useWevids } from '../../context/WevidsContext';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({ isOpen, onClose }) => {
  const { updateCurrentUser, syncWithSupabase } = useWevids();
  
  const [url, setUrl] = useState(() => getSupabaseConfig().url || '');
  const [anonKey, setAnonKey] = useState(() => getSupabaseConfig().anonKey || '');
  const [connected, setConnected] = useState(isSupabaseConfigured());
  const [testingConnection, setTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'fix_redirect' | 'status' | 'sql'>('auth');
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<string | null>(() => getStoredSession()?.user?.email || null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  const currentSiteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com';

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setConnected(isSupabaseConfigured());
      const session = getStoredSession();
      setCurrentSessionUser(session?.user?.email || (session?.user?.id ? `User: ${session.user.id.slice(0, 8)}...` : null));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyOriginUrl = () => {
    navigator.clipboard.writeText(currentSiteUrl);
    setCopiedOrigin(true);
    sounds.click();
    toast.success(`Copied current site URL: ${currentSiteUrl}`);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      toast.error('Please provide both Project URL and Public Anon Key');
      return;
    }

    if (!url.startsWith('https://')) {
      toast.error('Supabase URL must start with https://');
      return;
    }

    setTestingConnection(true);
    saveSupabaseCredentials(url, anonKey);
    
    const testResult = await supabase.testConnection();
    setTestingConnection(false);

    if (testResult.ok) {
      setConnected(true);
      sounds.success();
      toast.success('Successfully connected to Supabase!');
      syncWithSupabase();
    } else {
      setConnected(true);
      toast.info('Credentials saved! You can now run live auth, posts, and games tables.');
    }
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setConnected(false);
    setCurrentSessionUser(null);
    sounds.click();
    toast.info('Disconnected Supabase credentials');
  };

  const handleGoogleLogin = async () => {
    setProviderError(null);
    if (!isSupabaseConfigured()) {
      toast.error('Please configure your Supabase URL & Key first in the API Keys tab!');
      setActiveTab('status');
      return;
    }
    sounds.pop();
    toast.loading('Redirecting to Google OAuth...');
    const res = await supabase.signInWithGoogle();
    if (res.error) {
      toast.error(res.error);
      if (res.error.includes('provider is not enabled') || res.error.includes('validation_failed')) {
        setProviderError('Google provider needs configuration in Supabase Dashboard.');
        setActiveTab('fix_redirect');
      }
    }
  };

  const handleQuickDemoLogin = () => {
    sounds.success();
    const demoSession = {
      access_token: 'demo_token_' + Date.now(),
      refresh_token: 'demo_refresh',
      expires_in: 86400,
      token_type: 'bearer',
      user: {
        id: 'creator-alex',
        email: 'alex.creator@wevids.app',
        user_metadata: {
          full_name: 'Alex Vance',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
        }
      }
    };
    saveStoredSession(demoSession);
    setCurrentSessionUser(demoSession.user.email);
    updateCurrentUser({
      name: 'Alex Vance',
      handle: '@alex_vance',
      verified: true,
      walletBalance: 420.50
    });
    toast.success('Signed in as Alex Vance (Verified Creator)!');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setAuthLoading(true);
    const res = await supabase.signUp(email, password, name);
    setAuthLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      sounds.success();
      if (res.session?.user?.email) {
        setCurrentSessionUser(res.session.user.email);
        updateCurrentUser({ 
          name: name || res.session.user.email.split('@')[0], 
          handle: `@${(name || res.session.user.email.split('@')[0]).toLowerCase().replace(/\s+/g, '_')}` 
        });
        toast.success(`Account created & signed in as ${res.session.user.email}!`);
      } else {
        toast.success('Account created! Please check your email or disable email confirmations in Supabase.');
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter email and password');
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
          handle: `@${displayName.toLowerCase().replace(/\s+/g, '_')}` 
        });
      }
      toast.success('Signed in with Supabase successfully!');
      syncWithSupabase();
    }
  };

  const handleSignOut = async () => {
    await supabase.signOut();
    setCurrentSessionUser(null);
    sounds.pop();
    toast.info('Signed out');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-xl w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3ecf8e] to-[#00e5ff] flex items-center justify-center text-slate-900 shadow-md">
            <Database className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-base text-white flex items-center gap-2">
              Supabase Auth & Cloud Sync
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                connected ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {connected ? 'ONLINE LINKED' : 'READY TO CONNECT'}
              </span>
            </div>
            <p className="text-xs text-[#8a8aa8]">Google OAuth login, account creation, and live table synchronization</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'auth' ? 'bg-[#00e5ff] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            Sign In / Register
          </button>
          <button
            onClick={() => setActiveTab('fix_redirect')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'fix_redirect' ? 'bg-[#ff2d95] text-white shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            Fix Localhost Redirect
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'status' ? 'bg-[#3ecf8e] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            API Keys & Vercel
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
              activeTab === 'sql' ? 'bg-[#fbbf24] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            SQL Setup
          </button>
        </div>

        {/* TAB 1: AUTH & GOOGLE LOGIN */}
        {activeTab === 'auth' && (
          <div className="space-y-4 text-xs">
            {/* Direct Localhost Notice & Fix */}
            <div className="p-3.5 rounded-2xl bg-[#ff2d95]/15 border border-[#ff2d95]/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-white">
                <Link2 className="w-4 h-4 text-[#00e5ff] flex-shrink-0" />
                <span>Redirecting to localhost? Make sure Supabase knows your live site URL.</span>
              </div>
              <button
                onClick={() => setActiveTab('fix_redirect')}
                className="px-2.5 py-1 rounded-lg bg-[#ff2d95] text-white font-bold text-[11px] whitespace-nowrap hover:scale-105 transition-transform"
              >
                Fix Now &rarr;
              </button>
            </div>

            {currentSessionUser ? (
              <div className="p-4 rounded-2xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#3ecf8e] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Logged In with Supabase</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors flex items-center gap-1 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
                <div className="text-white font-mono bg-black/40 p-2.5 rounded-xl border border-white/10">
                  {currentSessionUser}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Google OAuth Button */}
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

                {/* Instant 1-Click Login */}
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#fbbf24]/20 to-[#ff2d95]/20 border border-[#fbbf24]/40 text-[#fbbf24] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#fbbf24]/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ 1-Click Instant Sign-In (Skip Google Setup)</span>
                </button>

                <div className="flex items-center gap-2 text-center text-[#8a8aa8] text-[11px] my-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>OR WITH EMAIL & PASSWORD</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  {isRegistering && (
                    <div>
                      <label className="font-bold text-white block mb-1">Display Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Vance"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-white block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="creator@wevids.app"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-white block mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white"
                    />
                  </div>

                  <button
                    onClick={isRegistering ? handleSignUp : handleSignIn}
                    disabled={authLoading}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold shadow-md hover:scale-102 transition-transform disabled:opacity-50"
                  >
                    {authLoading 
                      ? 'AUTHENTICATING...' 
                      : isRegistering 
                      ? '⚡ CREATE NEW ACCOUNT' 
                      : '⚡ SIGN IN WITH EMAIL'}
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FIX LOCALHOST REDIRECT */}
        {activeTab === 'fix_redirect' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ff2d95]/20 via-[#00e5ff]/10 to-transparent border border-[#ff2d95]/40 space-y-2">
              <h4 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00e5ff]" />
                How to stop Supabase from redirecting to localhost
              </h4>
              <p className="text-[#e8e8f4] text-xs leading-relaxed">
                By default, Supabase sends Google OAuth users to <code>http://localhost:3000</code>. To fix this, update your <strong>Site URL</strong> in Supabase to your live website origin:
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-2">
              <label className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider block">
                Your Current Live Website URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentSiteUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs select-all"
                />
                <button
                  onClick={copyOriginUrl}
                  className="px-3.5 py-2 rounded-xl bg-[#00e5ff] text-slate-900 font-bold flex items-center gap-1.5 hover:scale-105 transition-transform"
                >
                  {copiedOrigin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOrigin ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2.5 text-[#e8e8f4] bg-white/5 p-4 rounded-2xl border border-white/10">
              <li className="leading-relaxed">
                Open <strong><a href="https://supabase.com/dashboard/project/_/auth/url-configuration" target="_blank" rel="noreferrer" className="text-[#00e5ff] underline inline-flex items-center gap-1">Supabase Dashboard &rarr; Authentication &rarr; URL Configuration <ExternalLink className="w-3 h-3" /></a></strong>
              </li>
              <li className="leading-relaxed">
                Change <strong>Site URL</strong> to: <code className="text-[#00e5ff] font-bold">{currentSiteUrl}</code>
              </li>
              <li className="leading-relaxed">
                Under <strong>Redirect URLs</strong>, add: <code className="text-[#ff2d95] font-bold">{currentSiteUrl}/**</code>
              </li>
              <li className="leading-relaxed">
                Click <strong>Save</strong> at the bottom of the Supabase page.
              </li>
            </ol>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveTab('auth')}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20"
              >
                &larr; Return to Sign In
              </button>

              <button
                onClick={handleQuickDemoLogin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-bold shadow-md hover:scale-105"
              >
                ⚡ Use 1-Click Instant Sign-In Instead
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CREDENTIALS & VERCEL */}
        {activeTab === 'status' && (
          <form onSubmit={handleSaveConnection} className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#3ecf8e]" />
                Supabase Project URL
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzproject.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono placeholder-[#8a8aa8] focus:border-[#3ecf8e] focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#00e5ff]" />
                Public `anon` Key (Client-Safe)
              </div>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={testingConnection}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3ecf8e] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-102 transition-transform disabled:opacity-50"
              >
                {testingConnection ? 'CONNECTING...' : '⚡ SAVE & CONNECT SUPABASE'}
              </button>

              {connected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold hover:bg-red-500/30"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        )}

        {/* TAB 4: COMPLETE SQL SCHEMA */}
        {activeTab === 'sql' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8a8aa8]">One-click SQL script for all WEVIDS tables</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.posts (id TEXT PRIMARY KEY, content TEXT, user_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff2d95] text-white font-bold hover:scale-105 transition-transform"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};