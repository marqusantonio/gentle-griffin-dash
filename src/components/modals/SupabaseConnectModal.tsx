import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  LogOut,
  X,
  Sparkles,
  Database,
  Key,
  Copy,
  Check,
  Zap,
  Code,
  RefreshCw,
  TableProperties
} from 'lucide-react';
import { 
  getStoredSession,
  saveStoredSession,
  getSupabaseConfig,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  isSupabaseConfigured,
  SUPABASE_SQL_SCHEMA,
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
  const { updateCurrentUser, syncWithSupabase, isCloudSyncing, lastCloudSync, posts, clips } = useWevids();
  
  const [activeTab, setActiveTab] = useState<'auth' | 'database' | 'schema'>('database');
  
  // Auth state
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<string | null>(() => getStoredSession()?.user?.email || null);

  // Database credentials state
  const [supabaseUrl, setSupabaseUrl] = useState(() => getSupabaseConfig().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => getSupabaseConfig().anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const session = getStoredSession();
      setCurrentSessionUser(session?.user?.email || null);
      const conf = getSupabaseConfig();
      setSupabaseUrl(conf.url);
      setSupabaseAnonKey(conf.anonKey);
      if (isSupabaseConfigured()) {
        supabase.testConnection().then(setTestResult);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      toast.error('Please enter both Supabase Project URL and Anon Key');
      return;
    }

    setIsTesting(true);
    saveSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    const result = await supabase.testConnection();
    setIsTesting(false);
    setTestResult(result);

    if (result.ok) {
      sounds.success();
      toast.success('Connected to Supabase! Syncing tables...');
      syncWithSupabase();
    } else {
      toast.error(`Connection check: ${result.message}`);
    }
  };

  const handleManualSync = async () => {
    sounds.pop();
    toast.loading('Syncing all tables with Supabase...');
    await syncWithSupabase();
    toast.dismiss();
    toast.success('Supabase sync complete!');
  };

  const handleCopySchema = () => {
    sounds.click();
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    toast.success('SQL Schema copied! Paste into Supabase SQL Editor.');
    setTimeout(() => setCopiedSchema(false), 3000);
  };

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass rounded-3xl p-6 sm:p-7 border border-white/20 max-w-lg w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8aa8] hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00e5ff] to-[#ff2d95] flex items-center justify-center text-slate-900 shadow-md">
            <Database className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <div className="font-orbitron font-bold text-base text-white flex items-center gap-2">
              Supabase Cloud Database & Auth
            </div>
            <p className="text-xs text-[#8a8aa8]">Connect your Supabase project to sync posts, clips, files, and users in real-time</p>
          </div>
        </div>

        {/* Live Sync Status Banner */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured() ? 'bg-[#10b981] animate-ping' : 'bg-amber-400'}`} />
            <div>
              <span className="font-bold text-white">
                {isSupabaseConfigured() ? 'Supabase Connected' : 'Local Mode (No Supabase URL)'}
              </span>
              <div className="text-[10px] text-[#8a8aa8]">
                {lastCloudSync ? `Last synced: ${lastCloudSync}` : 'Ready to sync'} · {posts.length} Posts · {clips.length} Clips
              </div>
            </div>
          </div>

          {isSupabaseConfigured() && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isCloudSyncing}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#00e5ff] font-orbitron font-bold text-[10px] flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}
        </div>

        {/* Tabs Bar */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-orbitron font-bold">
          <button
            type="button"
            onClick={() => {
              sounds.click();
              setActiveTab('database');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'database' ? 'bg-[#00e5ff] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            Database Credentials
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.click();
              setActiveTab('schema');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'schema' ? 'bg-[#fbbf24] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            SQL Setup
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.click();
              setActiveTab('auth');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'auth' ? 'bg-[#ff2d95] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            User Auth
          </button>
        </div>

        {/* TAB 1: DATABASE CREDENTIALS */}
        {activeTab === 'database' && (
          <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Key className="w-4 h-4 text-[#00e5ff]" />
                Supabase Project API Configuration
              </div>
              <p className="text-[11px] text-[#8a8aa8]">
                Get your Project URL & Public Anon Key from Supabase Dashboard &rarr; Project Settings &rarr; API.
              </p>
            </div>

            <div>
              <label className="font-bold text-white block mb-1">Project URL</label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-[#00e5ff] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-bold text-white block mb-1">Public Anon Key (anon/public)</label>
              <textarea
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:border-[#00e5ff] focus:outline-none"
                required
              />
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                testResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {testResult.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-102 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isTesting ? 'TESTING CONNECTION...' : 'SAVE & CONNECT SUPABASE'}</span>
              </button>

              {isSupabaseConfigured() && (
                <button
                  type="button"
                  onClick={() => {
                    clearSupabaseCredentials();
                    setSupabaseUrl('');
                    setSupabaseAnonKey('');
                    setTestResult(null);
                    toast.info('Supabase credentials cleared. Using local sync.');
                  }}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: SQL SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#fbbf24]" />
                Supabase Tables SQL Script
              </div>
              <button
                onClick={handleCopySchema}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#fbbf24] text-slate-900 font-orbitron font-bold text-[11px] shadow hover:scale-105 transition-transform"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'COPIED!' : 'COPY SQL SCRIPT'}</span>
              </button>
            </div>

            <p className="text-[11px] text-[#8a8aa8]">
              Copy and execute this script once in your Supabase SQL Editor (supabase.com &rarr; Project &rarr; SQL Editor) to create the tables for posts, clips, audio, films, ROMs, files, and products.
            </p>

            <pre className="p-3 rounded-2xl bg-black/70 border border-white/10 text-[11px] text-[#00e5ff] font-mono overflow-x-auto max-h-60 leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}

        {/* TAB 3: AUTH */}
        {activeTab === 'auth' && (
          <div>
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
        )}
      </div>
    </div>
  );
};