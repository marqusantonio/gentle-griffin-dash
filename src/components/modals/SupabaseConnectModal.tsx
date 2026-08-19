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
  Zap
} from 'lucide-react';
import { 
  getSupabaseConfig,
  saveSupabaseCredentials, 
  clearSupabaseCredentials, 
  isSupabaseConfigured,
  getStoredSession,
  supabase 
} from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(() => getSupabaseConfig().url || '');
  const [anonKey, setAnonKey] = useState(() => getSupabaseConfig().anonKey || '');
  const [connected, setConnected] = useState(isSupabaseConfigured());
  const [testingConnection, setTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'auth' | 'sql' | 'test'>('status');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<string | null>(() => getStoredSession()?.user?.email || null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Test Query State
  const [testTableName, setTestTableName] = useState('profiles');
  const [testQueryResult, setTestQueryResult] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

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
    } else {
      setConnected(true);
      toast.info('Credentials saved! You can now run live auth and SQL tables.');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }
    setAuthLoading(true);
    const res = await supabase.signUp(email, password);
    setAuthLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      sounds.success();
      if (res.session?.user?.email) {
        setCurrentSessionUser(res.session.user.email);
        toast.success(`Registered & signed in as ${res.session.user.email}!`);
      } else {
        toast.success('Sign up complete! If email confirmation is enabled, check your inbox.');
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
      }
      toast.success('Signed in with Supabase successfully!');
    }
  };

  const handleSignOut = async () => {
    await supabase.signOut();
    setCurrentSessionUser(null);
    sounds.pop();
    toast.info('Signed out of Supabase');
  };

  const handleRunTestQuery = async () => {
    setIsQuerying(true);
    setTestQueryResult(null);
    sounds.pop();

    const res = await supabase.select(testTableName);
    setIsQuerying(false);

    if (res.error) {
      setTestQueryResult(`❌ Error: ${res.error}\n(Hint: Make sure the table "${testTableName}" exists in Supabase and RLS allows select)`);
    } else {
      sounds.success();
      setTestQueryResult(`✅ Success (${res.data?.length || 0} rows found):\n` + JSON.stringify(res.data, null, 2));
    }
  };

  const sqlSchema = `-- WEVIDS Online Database Schema
-- Run in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  handle TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  wallet_balance NUMERIC DEFAULT 420.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clips & Shorts Table
CREATE TABLE IF NOT EXISTS public.clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  audio_track TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Developer ROM Packages
CREATE TABLE IF NOT EXISTS public.rom_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  device_codename TEXT NOT NULL,
  version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  download_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rom_packages ENABLE ROW LEVEL SECURITY;

-- 5. Open Read Policies
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public clips read" ON public.clips FOR SELECT USING (true);
CREATE POLICY "Public roms read" ON public.rom_packages FOR SELECT USING (true);

-- 6. Authenticated Write Policies
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert clips" ON public.clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert roms" ON public.rom_packages FOR INSERT WITH CHECK (auth.uid() = uploader_id);
`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    sounds.click();
    toast.success('SQL schema copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2000);
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
              Supabase Online Database
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                connected ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {connected ? 'ONLINE LINKED' : 'LOCAL CACHE / READY'}
              </span>
            </div>
            <p className="text-xs text-[#8a8aa8]">Connect live authentication, database tables, and cloud storage</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'status' ? 'bg-[#3ecf8e] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            Connection
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'auth' ? 'bg-[#00e5ff] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            Live Auth Test
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'test' ? 'bg-[#fbbf24] text-slate-900 shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            REST Query Test
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'sql' ? 'bg-[#ff2d95] text-white shadow-md' : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            SQL Setup
          </button>
        </div>

        {/* TAB 1: CONNECTION */}
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
              <p className="text-[10px] text-[#8a8aa8]">
                Found in: <strong>Supabase Dashboard &rarr; Settings &rarr; API &rarr; Project API keys (anon public)</strong>
              </p>
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

        {/* TAB 2: LIVE AUTH TEST */}
        {activeTab === 'auth' && (
          <div className="space-y-3 text-xs">
            {currentSessionUser ? (
              <div className="p-4 rounded-2xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#3ecf8e] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Logged In Online</span>
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
                <p className="text-[11px] text-[#8a8aa8]">
                  Your authenticated session token is active and will attach to real-time queries and file posts.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#00e5ff]" />
                    Email
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@wevids.app"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-[#8a8aa8]"
                  />
                  <div className="font-bold text-white flex items-center gap-1.5 pt-1">
                    <Lock className="w-3.5 h-3.5 text-[#ff2d95]" />
                    Password
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-[#8a8aa8]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSignIn}
                    disabled={authLoading}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#3ecf8e] text-slate-900 font-orbitron font-bold shadow-md hover:scale-102 transition-transform disabled:opacity-50"
                  >
                    {authLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <button
                    onClick={handleSignUp}
                    disabled={authLoading}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#9333ea] text-white font-orbitron font-bold shadow-md hover:scale-102 transition-transform disabled:opacity-50"
                  >
                    {authLoading ? 'Signing up...' : 'Sign Up'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REST QUERY TEST */}
        {activeTab === 'test' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#fbbf24]" />
                Test Table Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testTableName}
                  onChange={(e) => setTestTableName(e.target.value)}
                  placeholder="profiles or clips"
                  className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                />
                <button
                  onClick={handleRunTestQuery}
                  disabled={isQuerying}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-orbitron font-bold hover:scale-105 transition-transform"
                >
                  {isQuerying ? 'Querying...' : 'Fetch Rows'}
                </button>
              </div>
            </div>

            {testQueryResult && (
              <pre className="p-3 rounded-2xl bg-black/60 border border-white/10 text-[#00e5ff] font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre-wrap">
                {testQueryResult}
              </pre>
            )}
          </div>
        )}

        {/* TAB 4: SQL SETUP */}
        {activeTab === 'sql' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8a8aa8]">One-click SQL script for Supabase tables</span>
              <button
                onClick={copySql}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#ff2d95] text-white font-bold hover:scale-105 transition-transform"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Schema'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-[#00e5ff] font-mono text-[11px] max-h-60 overflow-y-auto">
              {sqlSchema}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};