import React, { useState } from 'react';
import { Radio, Lock, Flame, Zap } from 'lucide-react';
import { useWevids } from '../../context/WevidsContext';
import { FollowButton } from './FollowButton';
import { ChatWindow } from './ChatWindow';
import { ErrorBoundary } from './ErrorBoundary';
import { sounds } from '../../lib/soundFx';
import { isSupabaseConfigured } from '../../lib/supabase';

export const ChatInboxInner: React.FC = () => {
  const { 
    conversations, 
    activeConvId, 
    setActiveConvId, 
    currentUser, 
    allUsers,
    openUserProfileModal,
    isMutualFriend,
    acceptMessageRequest,
    declineMessageRequest,
    isBlocked
  } = useWevids();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  const safeConversations = conversations || [];

  const friendsChats = safeConversations.filter(c => 
    c &&
    (c.status === 'active' || isMutualFriend(c.members?.find(m => m !== currentUser.id))) &&
    !c.members?.some(m => isBlocked(m))
  );

  const pendingRequests = safeConversations.filter(c => 
    c &&
    c.status === 'pending_request' && 
    !isMutualFriend(c.members?.find(m => m !== currentUser.id)) &&
    !c.members?.some(m => isBlocked(m))
  );

  const availableCreators = Object.values(allUsers || {}).filter(u => u && u.id !== currentUser.id && !isBlocked(u.id));

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      <div className="rounded-3xl bg-slate-950/90 border border-cyan-400/30 h-[680px] flex overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative backdrop-blur-2xl">
        {/* Holographic Ambient Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:32px_32px] opacity-5 pointer-events-none" />

        {/* LEFT INBOX SIDEBAR */}
        <div className="w-80 border-r border-cyan-400/20 flex flex-col bg-slate-950/95 relative z-10">
          <div className="p-4 border-b border-cyan-400/20 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-orbitron font-bold text-xs text-white flex items-center gap-2 tracking-wider">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                CYBER INBOX ENGINE
              </h2>
              {isSupabaseConfigured() && (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> REALTIME
                </span>
              )}
            </div>

            {/* Friends vs Requests Selector */}
            <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10 text-xs font-orbitron font-bold">
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setActiveTab('friends');
                }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'friends' 
                    ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>LINKED ({friendsChats.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setActiveTab('requests');
                }}
                className={`flex-1 py-2 rounded-xl transition-all relative flex items-center justify-center gap-1 ${
                  activeTab === 'requests' 
                    ? 'bg-pink-500 text-slate-950 shadow-[0_0_15px_rgba(236,72,153,0.5)]' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>REQUESTS</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 p-2.5 scrollbar-none">
            {activeTab === 'friends' ? (
              friendsChats.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Lock className="w-8 h-8 text-cyan-400 mx-auto opacity-40 animate-pulse" />
                  <p className="font-orbitron font-bold text-white">No Linked Friends Yet</p>
                  <p className="text-[11px]">Follow creators back to establish reciprocal friends links and chat freely!</p>
                </div>
              ) : (
                friendsChats.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const partnerId = conv.members?.find(m => m !== currentUser.id) || '';
                  const partner = allUsers[partnerId];
                  const partnerName = partner?.name || (partnerId.startsWith('guest-') ? `Guest_${partnerId.replace('guest-', '')}` : 'Creator');
                  const streak = conv.streakCount || 0;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        sounds.click();
                        setActiveConvId(conv.id);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-transparent border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/5'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shrink-0 border border-white/30"
                        style={{ background: conv.color }}
                      >
                        {conv.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-bold text-white truncate">{partnerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{conv.time}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <p className="text-slate-400 truncate flex-1">{conv.lastMsg}</p>
                          {streak > 0 && (
                            <span className="text-[10px] font-bold text-amber-300 ml-1 bg-amber-500/15 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-500/30 shadow-sm animate-pulse">
                              <Flame className="w-3 h-3 text-orange-500 fill-current" />
                              <span>{streak}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No pending transmission requests.
                </div>
              ) : (
                pendingRequests.map(req => {
                  const requesterId = req.members?.find(m => m !== currentUser.id) || '';
                  const requester = allUsers[requesterId];
                  const requesterName = requester?.name || 'Creator';

                  return (
                    <div key={req.id} className="p-3 rounded-2xl bg-white/[0.04] border border-cyan-400/30 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs"
                          style={{ background: req.color }}
                        >
                          {req.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{requesterName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{req.lastMsg}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => acceptMessageRequest(req.id)}
                          className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold font-orbitron text-[10px] shadow-md"
                        >
                          ACCEPT LINK
                        </button>
                        <button
                          onClick={() => declineMessageRequest(req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 text-[10px]"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* Creators List */}
            <div className="pt-3 border-t border-cyan-400/20 space-y-2">
              <div className="px-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-orbitron flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" /> CREATOR NODES ({availableCreators.length})
              </div>

              {availableCreators.slice(0, 6).map(creator => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all text-xs"
                >
                  <div 
                    onClick={() => openUserProfileModal(creator)}
                    className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0 border border-white/30"
                      style={{ background: creator.color }}
                    >
                      {creator.avatar}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-white truncate text-[11px]">{creator.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{creator.handle}</div>
                    </div>
                  </div>

                  <FollowButton targetUserId={creator.id} targetUserName={creator.name} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CHAT WINDOW */}
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export const ChatInbox: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Chat Inbox System Recovery">
      <ChatInboxInner />
    </ErrorBoundary>
  );
};