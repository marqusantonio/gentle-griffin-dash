import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  ShieldAlert, 
  Users, 
  FileText, 
  Film, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Award, 
  Search, 
  UserCheck, 
  UserX, 
  Activity, 
  Radio, 
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  BarChart3,
  Server
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const AdminConsole: React.FC = () => {
  const { 
    currentUser, 
    allUsers, 
    posts, 
    clips, 
    deletePost, 
    deleteClip, 
    blockUser, 
    unblockUser,
    updateCurrentUser
  } = useWevids();

  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'clips' | 'logs'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [userList, setUserList] = useState(Object.values(allUsers || {}));

  // Toggle user verification in local state + toast
  const handleToggleVerification = (userId: string) => {
    sounds.click();
    setUserList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.verified;
        toast.success(`${u.name} verification status set to ${nextState ? 'VERIFIED' : 'UNVERIFIED'}`);
        return { ...u, verified: nextState };
      }
      return u;
    }));
  };

  // Toggle admin permissions
  const handleToggleAdmin = (userId: string) => {
    sounds.click();
    setUserList(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.isAdmin;
        toast.success(`${u.name} admin status set to ${nextState ? 'ADMIN' : 'STANDARD'}`);
        return { ...u, isAdmin: nextState };
      }
      return u;
    }));
  };

  const filteredUsers = userList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.handle && u.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPosts = (posts || []).filter(p => 
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClips = (clips || []).filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/15 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#ff2d95]/20 via-[#00e5ff]/20 to-transparent blur-3xl -z-10" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-orbitron font-bold text-white">MODERATOR ADMIN CONSOLE</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold text-[10px] border border-red-500/30 font-mono">
                  LEVEL 4 ACCESS
                </span>
              </div>
              <p className="text-xs text-[#8a8aa8]">
                Real-time platform metrics, account moderation, verification badges, and content governance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00e5ff] bg-black/40 px-3.5 py-2 rounded-2xl border border-white/10">
            <Server className="w-4 h-4 text-[#10b981] animate-pulse" />
            <span>NODE_STATUS: ONLINE</span>
          </div>
        </div>

        {/* Quick Platform Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
            <div className="flex items-center justify-between text-[#8a8aa8] text-[10px] uppercase font-bold mb-1">
              <span>Total Accounts</span>
              <Users className="w-3.5 h-3.5 text-[#00e5ff]" />
            </div>
            <div className="font-orbitron font-bold text-xl text-white">{userList.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
            <div className="flex items-center justify-between text-[#8a8aa8] text-[10px] uppercase font-bold mb-1">
              <span>Active Posts</span>
              <FileText className="w-3.5 h-3.5 text-[#ff2d95]" />
            </div>
            <div className="font-orbitron font-bold text-xl text-white">{posts.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
            <div className="flex items-center justify-between text-[#8a8aa8] text-[10px] uppercase font-bold mb-1">
              <span>Media Clips</span>
              <Film className="w-3.5 h-3.5 text-[#fbbf24]" />
            </div>
            <div className="font-orbitron font-bold text-xl text-white">{clips.length}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
            <div className="flex items-center justify-between text-[#8a8aa8] text-[10px] uppercase font-bold mb-1">
              <span>Verified Nodes</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
            </div>
            <div className="font-orbitron font-bold text-xl text-white">
              {userList.filter(u => u.verified).length}
            </div>
          </div>
        </div>
      </div>

      {/* Console Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => { sounds.click(); setActiveTab('users'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-[#00e5ff] text-slate-900 shadow-md'
                : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Accounts ({userList.length})</span>
          </button>

          <button
            onClick={() => { sounds.click(); setActiveTab('posts'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'posts'
                ? 'bg-[#ff2d95] text-slate-900 shadow-md'
                : 'bg-white/5 text-[#8a8aa8] hover:text-[#ff2d95] border border-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Moderate Posts ({posts.length})</span>
          </button>

          <button
            onClick={() => { sounds.click(); setActiveTab('clips'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'clips'
                ? 'bg-[#fbbf24] text-slate-900 shadow-md'
                : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Moderate Clips ({clips.length})</span>
          </button>

          <button
            onClick={() => { sounds.click(); setActiveTab('logs'); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-[#10b981] text-slate-900 shadow-md'
                : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>System Audit Logs</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8a8aa8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search console..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-[#8a8aa8]"
          />
        </div>
      </div>

      {/* TAB 1: ACCOUNTS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
                No matching accounts found.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="liquid-glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm overflow-hidden"
                      style={{ background: user.color || '#00e5ff' }}
                    >
                      {user.avatarImage ? (
                        <img src={user.avatarImage} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        user.avatar || user.name.charAt(0)
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{user.name}</span>
                        {user.verified && (
                          <CheckCircle2 className="w-4 h-4 text-[#00e5ff]" />
                        )}
                        {user.isGuest && (
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] text-[#8a8aa8] font-mono">GUEST</span>
                        )}
                        {user.isAdmin && (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[9px] font-mono font-bold">ADMIN</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8a8aa8]">
                        {user.handle || '@user'} · Joined {user.joined || 'Recently'} · Wallet: {user.walletBalance || 0} WVDS
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleToggleVerification(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-orbitron transition-all ${
                        user.verified
                          ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 hover:bg-[#00e5ff] hover:text-slate-900'
                          : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                      }`}
                    >
                      {user.verified ? '✓ Verified' : '+ Verify User'}
                    </button>

                    <button
                      onClick={() => handleToggleAdmin(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-orbitron transition-all ${
                        user.isAdmin
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white'
                          : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                      }`}
                    >
                      {user.isAdmin ? 'Admin Rights' : 'Grant Admin'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POSTS MODERATION */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              No platform posts matching filter.
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="liquid-glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{post.authorName}</span>
                    <span className="text-[10px] text-[#8a8aa8]">{post.authorHandle}</span>
                    <span className="text-[10px] text-[#8a8aa8]">· {post.time}</span>
                  </div>
                  <p className="text-xs text-white/90 line-clamp-2">{post.content}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      deletePost(post.id);
                      toast.success('Post removed by Moderator');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CLIPS MODERATION */}
      {activeTab === 'clips' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredClips.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              No media clips available.
            </div>
          ) : (
            filteredClips.map((clip) => (
              <div key={clip.id} className="liquid-glass rounded-2xl p-3 border border-white/10 space-y-2">
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-black relative">
                  <video src={clip.videoUrl} controls className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-white truncate max-w-[160px]">{clip.title}</span>
                  <button
                    onClick={() => {
                      deleteClip(clip.id);
                      toast.success('Clip removed by Moderator');
                    }}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-[#00e5ff] font-bold">
            <Activity className="w-4 h-4" />
            <span>REAL-TIME AUDIT STREAM</span>
          </div>
          <div className="space-y-2 text-[#8a8aa8]">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span>[LOG_001] Security token generated for Guest User Node</span>
              <span className="text-[10px]">Just now</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span>[LOG_002] HyperOS 2.0 Official ROM verified in Repository</span>
              <span className="text-[10px]">5 mins ago</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
              <span>[LOG_003] Direct Messaging encrypted tunnel established</span>
              <span className="text-[10px]">12 mins ago</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};