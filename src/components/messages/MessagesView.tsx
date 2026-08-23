import React, { useState, useRef, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
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
  Flame
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

const GIF_REPOSITORIES = [
  { id: 'g1', title: 'Cyber High Five', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', source: 'GIPHY' },
  { id: 'g2', title: 'Mind Blown Neon', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', source: 'GIPHY' },
  { id: 'g3', title: 'Matrix Code Rain', url: 'https://media.giphy.com/media/A06UFEx8jxEwU/giphy.gif', source: 'TENOR' },
  { id: 'g4', title: 'Hacker Typing', url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif', source: 'TENOR' },
  { id: 'g5', title: 'Neon Cat Dancing', url: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif', source: 'GIPHY' },
  { id: 'g6', title: 'GG Gaming Win', url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif', source: 'TENOR' },
];

export const MessagesView: React.FC = () => {
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
  const [gifProvider, setGifProvider] = useState<'ALL' | 'GIPHY' | 'TENOR'>('ALL');
  const [gifSearch, setGifSearch] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase
      .channel('direct_messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          if (payload?.new) {
            sounds.pop();
            syncWithSupabase();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, syncWithSupabase]);

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
      toast.success('Image attached to message!');
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

  const handleSendVoiceNote = () => {
    if (!activeConv || isMessageLocked) return;
    setIsRecordingVoice(true);
    sounds.pop();
    setTimeout(() => {
      setIsRecordingVoice(false);
      sendMessage(activeConv.id, {
        type: 'audio',
        text: '🎤 Voice note (0:08s)',
      });
      sounds.success();
    }, 1200);
  };

  const filteredGifs = GIF_REPOSITORIES.filter(g => {
    const matchesProvider = gifProvider === 'ALL' || g.source === gifProvider;
    const matchesSearch = g.title.toLowerCase().includes(gifSearch.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      <div className="liquid-glass rounded-3xl border border-white/10 h-[660px] flex overflow-hidden shadow-2xl relative">
        {/* Left Inbox Navigation Panel */}
        <div className="w-80 border-r border-white/10 flex flex-col liquid-glass-card">
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-[#ff2d95]" />
                Inbox & Messaging
              </h2>
              {isSupabaseConfigured() && (
                <span className="flex items-center gap-1 text-[10px] text-[#10b981] font-mono">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
                </span>
              )}
            </div>

            {/* Friends vs Requests Filter Tabs */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setActiveTab('friends');
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'friends' ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900 font-bold shadow-md' : 'text-[#8a8aa8] hover:text-white'
                }`}
              >
                <span>Friends ({friendsChats.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setActiveTab('requests');
                }}
                className={`flex-1 py-2 rounded-lg transition-all relative flex items-center justify-center gap-1 ${
                  activeTab === 'requests' ? 'bg-[#ff2d95] text-slate-900 font-bold shadow-md' : 'text-[#8a8aa8] hover:text-white'
                }`}
              >
                <span>Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            {activeTab === 'friends' ? (
              <div className="space-y-1">
                {friendsChats.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8aa8]">
                    No mutual friends yet. Follow creators back to unlock unrestricted friend chat!
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
                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#ff2d95]/20 to-[#00e5ff]/15 border border-[#ff2d95]/40 shadow-md'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md flex-shrink-0"
                          style={{ background: conv.color }}
                        >
                          {conv.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="font-bold text-white truncate flex items-center gap-1">
                              {partnerName}
                            </span>
                            <span className="text-[10px] text-[#8a8aa8]">{conv.time}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <p className="text-[#8a8aa8] truncate flex-1">{conv.lastMsg}</p>
                            {streak > 0 && (
                              <span className="text-[10px] font-bold text-[#fbbf24] ml-1 bg-[#fbbf24]/15 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-[#fbbf24]/30">
                                <Flame className="w-3 h-3 fill-current text-[#ea580c]" />
                                <span>{streak}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Message Requests Stream */
              <div className="space-y-3 p-1">
                <div className="text-[11px] text-[#8a8aa8]">
                  Creators who aren't mutual friends must request before chatting freely.
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8aa8]">
                    No pending message requests.
                  </div>
                ) : (
                  pendingRequests.map(req => {
                    const requesterId = req.members.find(m => m !== currentUser.id) || '';
                    const requester = allUsers[requesterId];
                    const requesterName = requester?.name || (requesterId.startsWith('guest-') ? `Guest_${requesterId.replace('guest-', '')}` : 'New Creator');

                    return (
                      <div key={req.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs"
                            style={{ background: req.color }}
                          >
                            {req.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{requesterName}</div>
                            <div className="text-[10px] text-[#8a8aa8] truncate">{req.lastMsg}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => acceptMessageRequest(req.id)}
                            className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900 font-bold text-[10px] flex items-center justify-center gap-1 shadow-md"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => declineMessageRequest(req.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#8a8aa8] text-[10px]"
                            title="Decline Request"
                          >
                            <UserX className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => blockMessageUser(req.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-[10px]"
                            title="Block User"
                          >
                            <ShieldBan className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Creators Available List */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="px-2 text-[10px] font-bold text-[#00e5ff] uppercase tracking-wider flex items-center gap-1.5 font-orbitron">
                <Sparkles className="w-3.5 h-3.5 text-[#ff2d95]" />
                Online Network ({availableCreators.length})
              </div>

              {availableCreators.map(creator => (
                <div
                  key={creator.id}
                  onClick={() => startOrOpenChatWithUser(creator.id)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs"
                      style={{ background: creator.color }}
                    >
                      {creator.avatar}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        {creator.name}
                      </div>
                      <div className="text-[10px] text-[#8a8aa8]">{creator.handle}</div>
                    </div>
                  </div>

                  <button className="px-2.5 py-1 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold font-orbitron hover:bg-[#00e5ff] hover:text-slate-900 transition-colors">
                    {isMutualFriend(creator.id) ? 'Chat' : 'Request'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Chat Conversation Area */}
        {activeConv && otherUser ? (
          <div className="flex-1 flex flex-col justify-between bg-black/40">
            {/* Header with 🔥 Streak Badge */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div 
                onClick={() => openUserProfileModal(otherUser)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm group-hover:scale-105 transition-transform"
                  style={{ background: activeConv.color }}
                >
                  {activeConv.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2 group-hover:text-[#00e5ff]">
                    <span>{otherUser.name}</span>
                    {isFriend ? (
                      <span className="text-[9px] text-[#10b981] bg-[#10b981]/20 px-2 py-0.5 rounded-full border border-[#10b981]/30">
                        🤝 Mutual Friends
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#fbbf24] bg-[#fbbf24]/20 px-2 py-0.5 rounded-full border border-[#fbbf24]/30">
                        Request Mode
                      </span>
                    )}

                    {(activeConv.streakCount || 0) > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-[#ff2d95] text-white font-orbitron font-bold text-[10px] flex items-center gap-1 shadow-md animate-pulse">
                        <Flame className="w-3 h-3 fill-current text-yellow-300" />
                        <span>{activeConv.streakCount} STREAK</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8a8aa8]">
                    {otherUser.handle} · {otherUser.location}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openVideoCall(otherUser.name)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Launch HD Video Call"
                >
                  <Video className="w-4 h-4 text-[#00e5ff]" />
                </button>

                <button
                  onClick={() => blockMessageUser(activeConv.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-[#8a8aa8] hover:text-red-400 transition-colors"
                  title="Block User"
                >
                  <ShieldBan className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Request banner for Non-Mutual Friends */}
            {!isFriend && activeConv.status === 'pending_request' && (
              <div className="p-3 bg-[#fbbf24]/10 border-b border-[#fbbf24]/20 flex items-center justify-between text-xs text-[#fbbf24]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {activeConv.requestedBy === currentUser.id 
                      ? isMessageLocked 
                        ? '1 introductory message sent. Awaiting friend approval or follow back.' 
                        : 'Non-friend mode: You can send 1 introductory message.' 
                      : `${otherUser.name} sent you a message request.`}
                  </span>
                </div>
                {activeConv.requestedBy !== currentUser.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptMessageRequest(activeConv.id)}
                      className="px-3 py-1 rounded-lg bg-[#10b981] text-slate-900 font-bold text-[11px]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineMessageRequest(activeConv.id)}
                      className="px-3 py-1 rounded-lg bg-white/10 text-white text-[11px]"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#8a8aa8]">
                  <Sparkles className="w-8 h-8 text-[#00e5ff] mb-2 animate-pulse" />
                  <p className="font-bold text-white">Direct Chat Initialized</p>
                  <p>Send text, images, or GIFs to {otherUser.name}. Communicating daily builds your 🔥 Streak!</p>
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
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-900 font-bold text-[10px] flex-shrink-0"
                          style={{ background: m.senderColor }}
                        >
                          {m.senderAvatar}
                        </div>
                      )}

                      <div
                        className={`max-w-[70%] p-3 rounded-2xl text-xs space-y-2 ${
                          isMe
                            ? 'bg-gradient-to-r from-[#ff2d95] to-[#9333ea] text-white rounded-br-none shadow-md'
                            : 'liquid-glass-card text-[#e8e8f4] border border-white/10 rounded-bl-none'
                        }`}
                      >
                        {m.mediaUrl && (
                          <div className="rounded-xl overflow-hidden max-h-48 border border-white/10">
                            <img src={m.mediaUrl} alt="Attached Media" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {m.text && <p className="leading-relaxed">{m.text}</p>}
                        
                        <div className="flex items-center justify-end gap-1 text-[9px] opacity-70">
                          <span>{m.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-[#00e5ff]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Attached Image Preview */}
            {attachedImage && (
              <div className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={attachedImage} alt="Attachment" className="w-12 h-12 rounded-xl object-cover border border-white/20" />
                  <span className="text-xs text-[#00e5ff] font-bold">Image ready to send</span>
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

            {/* GIF Picker */}
            {showGifPicker && (
              <div className="p-3 bg-slate-900/95 border-t border-[#00e5ff]/40 space-y-2 animate-slide-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-orbitron font-bold text-white">Select GIF:</span>
                    <div className="flex rounded-lg bg-black/50 p-0.5 border border-white/10 text-[10px]">
                      {(['ALL', 'GIPHY', 'TENOR'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setGifProvider(p)}
                          className={`px-2 py-0.5 rounded-md font-bold ${gifProvider === p ? 'bg-[#ff2d95] text-white' : 'text-[#8a8aa8]'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setShowGifPicker(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8aa8]" />
                  <input
                    type="text"
                    value={gifSearch}
                    onChange={(e) => setGifSearch(e.target.value)}
                    placeholder="Search trending memes, anime, gaming..."
                    className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-[#8a8aa8]"
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto">
                  {filteredGifs.map(g => (
                    <img
                      key={g.id}
                      src={g.url}
                      alt={g.title}
                      onClick={() => handleSelectGif(g.url)}
                      className="w-full h-16 rounded-xl object-cover cursor-pointer hover:scale-105 transition-all border border-transparent hover:border-[#00e5ff]"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hidden image input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />

            {/* Message Form Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2 bg-white/[0.02]">
              <button
                type="button"
                disabled={isMessageLocked}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#fbbf24] transition-colors disabled:opacity-40"
                title="Attach Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isMessageLocked}
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`p-2.5 rounded-xl transition-colors disabled:opacity-40 ${showGifPicker ? 'bg-[#00e5ff] text-slate-900' : 'bg-white/5 hover:bg-white/10 text-[#00e5ff]'}`}
                title="Search GIPHY / TENOR"
              >
                <Film className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isMessageLocked}
                onClick={handleSendVoiceNote}
                className={`p-2.5 rounded-xl transition-all disabled:opacity-40 ${
                  isRecordingVoice
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 text-[#8a8aa8] hover:text-white'
                }`}
                title="Record Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={messageText}
                disabled={isMessageLocked}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  isMessageLocked
                    ? '1 message sent. Awaiting friend approval or follow back...'
                    : `Message ${otherUser.name}...`
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isMessageLocked || (!messageText.trim() && !attachedImage)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold hover:scale-105 transition-transform shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#8a8aa8] space-y-3">
            <MessageSquareText className="w-12 h-12 text-[#ff2d95] opacity-50" />
            <h3 className="font-orbitron font-bold text-white text-base">Select a Creator to Start Messaging</h3>
            <p className="max-w-sm">
              Click on any online creator to chat. Communicating daily builds your 🔥 Streak!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};