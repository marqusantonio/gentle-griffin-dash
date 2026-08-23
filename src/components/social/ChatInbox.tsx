import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquareText, 
  Send, 
  Mic, 
  Video, 
  CheckCheck, 
  Image as ImageIcon,
  Film,
  Sparkles,
  Search,
  X,
  Lock,
  UserCheck,
  UserX,
  ShieldBan,
  Clock,
  Radio,
  Flame,
  Zap,
  Volume2
} from 'lucide-react';
import { useWevids } from '../../context/WevidsContext';
import { FollowButton } from './FollowButton';
import { MessageRequestBanner } from './MessageRequestBanner';
import { sounds } from '../../lib/soundFx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

const GIF_GALLERY = [
  { id: 'g1', title: 'Cyber Cheer', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
  { id: 'g2', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'g3', title: 'Matrix Code', url: 'https://media.giphy.com/media/A06UFEx8jxEwU/giphy.gif' },
  { id: 'g4', title: 'Hacker Speed', url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif' },
  { id: 'g5', title: 'Neon Cat', url: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif' },
  { id: 'g6', title: 'Win GG', url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif' },
];

export const ChatInbox: React.FC = () => {
  const { 
    conversations, 
    activeConvId, 
    setActiveConvId, 
    sendMessage, 
    currentUser, 
    allUsers,
    openVideoCall,
    startOrOpenChatWithUser,
    openUserProfileModal,
    isMutualFriend,
    acceptMessageRequest,
    declineMessageRequest,
    blockMessageUser,
    isBlocked,
    syncWithSupabase
  } = useWevids();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // REAL-TIME SUPABASE LISTENER WITH STRICT CLEANUP HOOK
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isSubscribed = true;

    const channel = supabase
      .channel(`realtime-cyber-chat-${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (isSubscribed && payload?.new) {
            sounds.pop();
            syncWithSupabase(true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'follows' },
        () => {
          if (isSubscribed) {
            syncWithSupabase(true);
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, syncWithSupabase]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0] || null;
  const otherMemberId = activeConv?.members?.find(id => id !== currentUser.id) || '';
  
  const otherUser = otherMemberId ? (allUsers[otherMemberId] || {
    id: otherMemberId,
    name: otherMemberId.startsWith('guest-') ? `Guest_${otherMemberId.replace('guest-', '')}` : (activeConv?.groupName || 'Creator'),
    handle: `@${otherMemberId.replace('guest-', 'guest_')}`,
    avatar: otherMemberId.startsWith('guest-') ? 'G' : (activeConv?.avatar || 'C'),
    color: activeConv?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    location: 'Earth Node',
    bio: 'WEVIDS community member',
    followers: 0,
    following: 0,
    videos: 0,
    likes: 0,
    views: '0',
    joined: '2026',
    walletBalance: 0,
    isGuest: otherMemberId.startsWith('guest-')
  }) : null;

  const isFriend = otherMemberId ? isMutualFriend(otherMemberId) : false;

  const friendsChats = conversations.filter(c => 
    (c.status === 'active' || isMutualFriend(c.members.find(m => m !== currentUser.id))) &&
    !c.members.some(m => isBlocked(m))
  );

  const pendingRequests = conversations.filter(c => 
    c.status === 'pending_request' && 
    !isMutualFriend(c.members.find(m => m !== currentUser.id)) &&
    !c.members.some(m => isBlocked(m))
  );

  const availableCreators = Object.values(allUsers).filter(u => u.id !== currentUser.id && !isBlocked(u.id));

  // Determine if messaging is locked (non-friends who sent 1 request message)
  const isMessageLocked = !isFriend && 
    activeConv?.status === 'pending_request' && 
    activeConv?.requestedBy === currentUser.id && 
    (activeConv?.messages?.length || 0) >= 1;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      sounds.pop();
      toast.success('Image attached to transmission!');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || isMessageLocked) return;
    if (!messageText.trim() && !attachedImage) return;

    await sendMessage(activeConv.id, {
      text: messageText.trim() || undefined,
      mediaUrl: attachedImage || undefined,
      type: attachedImage ? 'image' : 'text',
    });

    setMessageText('');
    setAttachedImage(null);
    setShowGifPicker(false);
  };

  const handleSelectGif = (url: string) => {
    if (!activeConv || isMessageLocked) return;
    sounds.success();
    sendMessage(activeConv.id, {
      mediaUrl: url,
      type: 'gif',
      text: 'GIF',
    });
    setShowGifPicker(false);
  };

  const handleAcceptRequest = async () => {
    if (!activeConv) return;
    setIsAccepting(true);
    await acceptMessageRequest(activeConv.id);
    setIsAccepting(false);
  };

  const handleDeclineRequest = async () => {
    if (!activeConv) return;
    await declineMessageRequest(activeConv.id);
  };

  const filteredGifs = GIF_GALLERY.filter(g => 
    g.title.toLowerCase().includes(gifSearch.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-20">
      <div className="rounded-3xl bg-[#030712] border border-[#06b6d4]/30 h-[680px] flex overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative backdrop-blur-2xl">
        {/* Holographic Ambient Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:32px_32px] opacity-5 pointer-events-none" />

        {/* LEFT INBOX SIDEBAR */}
        <div className="w-80 border-r border-[#06b6d4]/20 flex flex-col bg-[#030712]/90 relative z-10">
          <div className="p-4 border-b border-[#06b6d4]/20 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-orbitron font-bold text-xs text-white flex items-center gap-2 tracking-wider">
                <Radio className="w-4 h-4 text-[#06b6d4] animate-pulse" />
                CYBER INBOX ENGINE
              </h2>
              {isSupabaseConfigured() && (
                <span className="flex items-center gap-1 text-[9px] text-[#10b981] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" /> REALTIME
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
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#a855f7] text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                    : 'text-[#94a3b8] hover:text-white'
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
                    ? 'bg-[#ec4899] text-slate-950 shadow-[0_0_15px_rgba(236,72,153,0.5)]' 
                    : 'text-[#94a3b8] hover:text-white'
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
                <div className="p-8 text-center text-xs text-[#94a3b8] space-y-2">
                  <Lock className="w-8 h-8 text-[#06b6d4] mx-auto opacity-40 animate-pulse" />
                  <p className="font-orbitron font-bold text-white">No Linked Friends Yet</p>
                  <p className="text-[11px]">Follow creators back to establish reciprocal friends links and chat freely!</p>
                </div>
              ) : (
                friendsChats.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const partnerId = conv.members.find(m => m !== currentUser.id) || '';
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
                          ? 'bg-gradient-to-r from-[#06b6d4]/20 via-[#a855f7]/20 to-transparent border border-[#06b6d4]/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
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
                          <span className="text-[10px] text-[#94a3b8] font-mono">{conv.time}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <p className="text-[#94a3b8] truncate flex-1">{conv.lastMsg}</p>
                          {streak > 0 && (
                            <span className="text-[10px] font-bold text-amber-300 ml-1 bg-amber-500/15 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.4)] animate-pulse">
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
              /* Message Requests Stream */
              pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#94a3b8]">
                  No pending transmission requests.
                </div>
              ) : (
                pendingRequests.map(req => {
                  const requesterId = req.members.find(m => m !== currentUser.id) || '';
                  const requester = allUsers[requesterId];
                  const requesterName = requester?.name || 'Creator';

                  return (
                    <div key={req.id} className="p-3 rounded-2xl bg-white/[0.04] border border-[#06b6d4]/30 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs"
                          style={{ background: req.color }}
                        >
                          {req.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{requesterName}</div>
                          <div className="text-[10px] text-[#94a3b8] truncate">{req.lastMsg}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => acceptMessageRequest(req.id)}
                          className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#a855f7] text-slate-950 font-bold font-orbitron text-[10px] shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        >
                          ACCEPT LINK
                        </button>
                        <button
                          onClick={() => declineMessageRequest(req.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#94a3b8] text-[10px]"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* Creators Network */}
            <div className="pt-3 border-t border-[#06b6d4]/20 space-y-2">
              <div className="px-1 text-[10px] font-bold text-[#06b6d4] uppercase tracking-wider font-orbitron flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#a855f7]" /> CREATOR NODES ({availableCreators.length})
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
                      <div className="text-[9px] text-[#94a3b8] truncate">{creator.handle}</div>
                    </div>
                  </div>

                  <FollowButton targetUserId={creator.id} targetUserName={creator.name} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACTIVE CHAT CONVERSATION VIEWPORT */}
        {activeConv && otherUser ? (
          <div className="flex-1 flex flex-col justify-between bg-black/60 relative z-10">
            {/* Chat Room Header with Plasma Flame Streak Visualizer */}
            <div className="p-4 border-b border-[#06b6d4]/20 flex items-center justify-between bg-white/[0.02] backdrop-blur-md">
              <div 
                onClick={() => openUserProfileModal(otherUser)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0 group-hover:scale-105 transition-transform"
                  style={{ background: activeConv.color }}
                >
                  {activeConv.avatar}
                </div>

                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2 group-hover:text-[#06b6d4] transition-colors">
                    <span>{otherUser.name}</span>

                    {/* Plasma Flame Streak Badge */}
                    {(activeConv.streakCount || 0) > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-[#ec4899] text-slate-950 font-orbitron font-bold text-[10px] flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse">
                        <Flame className="w-3 h-3 text-white fill-current" />
                        <span>{activeConv.streakCount} DAY STREAK</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono">{otherUser.handle} · {otherUser.location}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FollowButton targetUserId={otherUser.id} targetUserName={otherUser.name} size="sm" />

                <button
                  onClick={() => openVideoCall(otherUser.name)}
                  className="p-2 rounded-2xl bg-white/5 hover:bg-[#06b6d4]/20 border border-[#06b6d4]/30 text-[#06b6d4] transition-colors"
                  title="Launch HD Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transmission Request Banner */}
            {!isFriend && activeConv.status === 'pending_request' && (
              <div className="p-3">
                {activeConv.requestedBy === currentUser.id ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {isMessageLocked 
                        ? '1 transmission request sent. Waiting for creator to accept or follow back.' 
                        : 'Non-friends request mode: You can send 1 introductory message.'}
                    </span>
                  </div>
                ) : (
                  <MessageRequestBanner
                    senderName={otherUser.name}
                    senderAvatar={activeConv.avatar}
                    senderColor={activeConv.color}
                    requestMessage={activeConv.lastMsg}
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineRequest}
                    isProcessing={isAccepting}
                  />
                )}
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
              {activeConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Sparkles className="w-10 h-10 text-[#06b6d4] opacity-50 animate-pulse" />
                  <div className="font-orbitron font-bold text-white text-sm">ENCRYPTED DATA ROOM</div>
                  <p className="text-xs text-[#94a3b8] max-w-sm">
                    Send your first transmission to {otherUser.name}. Communicating daily establishes rolling 🔥 Streaks!
                  </p>
                </div>
              ) : (
                activeConv.messages.map((m) => {
                  const isMe = m.fromId === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0 border border-white/30"
                          style={{ background: m.senderColor }}
                        >
                          {m.senderAvatar}
                        </div>
                      )}

                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-xs space-y-2 backdrop-blur-xl ${
                          isMe
                            ? 'bg-gradient-to-r from-[#06b6d4] to-[#a855f7] text-slate-950 font-semibold rounded-br-none shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'bg-white/5 border border-white/10 text-white rounded-bl-none shadow-lg'
                        }`}
                      >
                        {m.mediaUrl && (
                          <div className="rounded-xl overflow-hidden max-h-48 border border-white/20">
                            <img src={m.mediaUrl} alt="Transmission attachment" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {m.text && <p className="leading-relaxed">{m.text}</p>}

                        <div className={`flex items-center justify-end gap-1 text-[9px] ${isMe ? 'text-slate-900/80 font-bold' : 'text-[#94a3b8]'}`}>
                          <span>{m.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-slate-950" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached Media Preview */}
            {attachedImage && (
              <div className="px-4 py-2 bg-white/5 border-t border-[#06b6d4]/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={attachedImage} alt="Attachment" className="w-10 h-10 rounded-xl object-cover border border-[#06b6d4]" />
                  <span className="text-xs text-[#06b6d4] font-bold font-orbitron">Image Attachment Attached</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="p-1 rounded-full bg-black/60 text-white hover:bg-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* GIF Picker Overlay */}
            {showGifPicker && (
              <div className="p-3 bg-[#030712]/95 border-t border-[#06b6d4]/40 space-y-2 animate-slide-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-orbitron font-bold text-[#06b6d4]">Cyber GIF Vault</span>
                  <button onClick={() => setShowGifPicker(false)} className="text-xs text-[#94a3b8] hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto scrollbar-none">
                  {filteredGifs.map(g => (
                    <img
                      key={g.id}
                      src={g.url}
                      alt={g.title}
                      onClick={() => handleSelectGif(g.url)}
                      className="w-full h-16 rounded-xl object-cover cursor-pointer hover:scale-105 transition-all border border-transparent hover:border-[#06b6d4]"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Input Form Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#06b6d4]/20 flex items-center gap-2 bg-[#030712]/90">
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageFile} />

              <button
                type="button"
                disabled={isMessageLocked}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 border border-white/10 disabled:opacity-30"
                title="Attach Photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isMessageLocked}
                onClick={() => setShowGifPicker(!showGifPicker)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#06b6d4] border border-white/10 disabled:opacity-30"
                title="Attach GIF"
              >
                <Film className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={messageText}
                disabled={isMessageLocked}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  isMessageLocked
                    ? '1 message request sent. Awaiting friend approval...'
                    : `Send transmission to ${otherUser.name}...`
                }
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#06b6d4] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isMessageLocked || (!messageText.trim() && !attachedImage)}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-[#06b6d4] to-[#a855f7] text-slate-950 font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#94a3b8] space-y-3">
            <MessageSquareText className="w-12 h-12 text-[#06b6d4] opacity-40 animate-pulse" />
            <div className="font-orbitron font-bold text-white text-base">Select a Creator Node</div>
            <p className="max-w-sm">
              Click any creator on the left to initiate direct transmission. Communicating daily unlocks 🔥 Streaks!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};