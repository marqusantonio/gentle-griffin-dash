import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Video, 
  CheckCheck, 
  Image as ImageIcon,
  Film,
  Sparkles,
  Lock,
  Radio,
  Flame,
  Clock,
  X
} from 'lucide-react';
import { useWevids } from '../../context/WevidsContext';
import { FollowButton } from './FollowButton';
import { RequestBanner } from './RequestBanner';
import { ErrorBoundary } from './ErrorBoundary';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { usePresence } from '../../hooks/usePresence';
import { sounds } from '../../lib/soundFx';

const GIF_GALLERY = [
  { id: 'g1', title: 'Cyber Cheer', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
  { id: 'g2', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'g3', title: 'Matrix Code', url: 'https://media.giphy.com/media/A06UFEx8jxEwU/giphy.gif' },
  { id: 'g4', title: 'Hacker Speed', url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif' },
  { id: 'g5', title: 'Neon Cat', url: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif' },
  { id: 'g6', title: 'Win GG', url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif' },
];

export const ChatWindowInner: React.FC = () => {
  const { 
    conversations, 
    activeConvId, 
    sendMessage, 
    currentUser, 
    allUsers,
    openVideoCall,
    openUserProfileModal,
    isMutualFriend,
    acceptMessageRequest,
    declineMessageRequest,
    syncWithSupabase
  } = useWevids();

  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Real-time messages & Online presence hooks
  useRealtimeMessages(currentUser.id, () => syncWithSupabase(true));
  const onlineUserIds = usePresence(currentUser.id, currentUser.name);

  // Safe fallback for mapped conversations array
  const safeConversations = conversations || [];
  const activeConv = safeConversations.find(c => c.id === activeConvId) || safeConversations[0] || null;

  const otherMemberId = activeConv?.members?.find(id => id !== currentUser.id) || '';
  const otherUser = otherMemberId ? (allUsers[otherMemberId] || {
    id: otherMemberId,
    name: otherMemberId.startsWith('guest-') ? `Guest_${otherMemberId.replace('guest-', '')}` : (activeConv?.groupName || 'Creator'),
    handle: `@${otherMemberId.replace('guest-', 'guest_')}`,
    avatar: otherMemberId.startsWith('guest-') ? 'G' : (activeConv?.avatar || 'C'),
    color: activeConv?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    location: 'Earth Node'
  }) : null;

  const isOnline = otherMemberId ? onlineUserIds.has(otherMemberId) : false;
  const isFriend = otherMemberId ? isMutualFriend(otherMemberId) : false;

  const safeMessages = activeConv?.messages || [];

  const isMessageLocked = !isFriend && 
    activeConv?.status === 'pending_request' && 
    activeConv?.requestedBy === currentUser.id && 
    safeMessages.length >= 1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages.length, activeConvId]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      sounds.pop();
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

  if (!activeConv || !otherUser) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-3xl bg-slate-950/80 border border-cyan-400/20 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center space-y-3">
        <Sparkles className="w-10 h-10 text-cyan-400 opacity-40 animate-pulse" />
        <div className="font-orbitron font-bold text-white text-base">SELECT A CREATOR NODE</div>
        <p className="text-xs text-slate-400 max-w-sm">
          Click any creator profile on the left or feed to launch direct encrypted data links.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] rounded-3xl bg-slate-950/90 border border-cyan-400/30 backdrop-blur-xl flex flex-col justify-between overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
      {/* Ambient Grid lines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:28px_28px] opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-cyan-400/20 flex items-center justify-between bg-slate-900/60 relative z-10">
        <div 
          onClick={() => openUserProfileModal(otherUser)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shrink-0 group-hover:scale-105 transition-transform border border-white/30"
              style={{ background: activeConv.color }}
            >
              {activeConv.avatar}
            </div>
            {/* Live Online Presence Dot */}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          </div>

          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
              <span>{otherUser.name}</span>
              {(activeConv.streakCount || 0) > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-slate-950 font-orbitron font-bold text-[9px] flex items-center gap-1 shadow-md animate-pulse">
                  <Flame className="w-3 h-3 text-white fill-current" />
                  <span>{activeConv.streakCount} DAY STREAK</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {otherUser.handle} · {isOnline ? '🟢 ONLINE LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FollowButton targetUserId={otherUser.id} targetUserName={otherUser.name} size="sm" />
          <button
            onClick={() => openVideoCall(otherUser.name)}
            className="p-2 rounded-2xl bg-slate-900 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-400 transition-colors"
            title="Launch HD Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Request Banner */}
      {!isFriend && activeConv.status === 'pending_request' && (
        <div className="p-3 relative z-10">
          {activeConv.requestedBy === currentUser.id ? (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {isMessageLocked 
                  ? '1 request transmission delivered. Awaiting creator response.' 
                  : '1-Message Request Limit Active'}
              </span>
            </div>
          ) : (
            <RequestBanner
              senderName={otherUser.name}
              senderAvatar={activeConv.avatar}
              senderColor={activeConv.color}
              requestMessage={activeConv.lastMsg}
              onAccept={async () => {
                setIsAccepting(true);
                await acceptMessageRequest(activeConv.id);
                setIsAccepting(false);
              }}
              onDecline={() => declineMessageRequest(activeConv.id)}
              isProcessing={isAccepting}
            />
          )}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 scrollbar-none">
        {safeMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
            <Radio className="w-8 h-8 text-cyan-400 opacity-40 animate-pulse" />
            <div className="font-orbitron font-bold text-white text-xs">ENCRYPTED ROOM READY</div>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Daily transmissions establish rolling 🔥 Streaks!
            </p>
          </div>
        ) : (
          safeMessages.map((m) => {
            const isMe = m.fromId === currentUser.id;
            return (
              <div key={m.id} className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-950 font-bold text-[10px] shrink-0 border border-white/30"
                    style={{ background: m.senderColor }}
                  >
                    {m.senderAvatar}
                  </div>
                )}

                <div
                  className={`max-w-[75%] p-3.5 rounded-2xl text-xs space-y-2 backdrop-blur-xl ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-semibold rounded-br-none shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/80 border border-white/10 text-white rounded-bl-none shadow-lg'
                  }`}
                >
                  {m.mediaUrl && (
                    <div className="rounded-xl overflow-hidden max-h-48 border border-white/20">
                      <img src={m.mediaUrl} alt="Attachment" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {m.text && <p className="leading-relaxed">{m.text}</p>}

                  <div className={`flex items-center justify-end gap-1 text-[9px] ${isMe ? 'text-slate-950/80 font-bold' : 'text-slate-400'}`}>
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

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-cyan-400/20 flex items-center gap-2 bg-slate-900/90 relative z-10">
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageFile} />

        <button
          type="button"
          disabled={isMessageLocked}
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-white/10 disabled:opacity-30"
          title="Attach Photo"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={isMessageLocked}
          onClick={() => setShowGifPicker(!showGifPicker)}
          className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-white/10 disabled:opacity-30"
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
              ? 'Request sent. Awaiting friend approval...'
              : `Send transmission to ${otherUser.name}...`
          }
          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isMessageLocked || (!messageText.trim() && !attachedImage)}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)] disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export const ChatWindow: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Chat Module Recovery">
      <ChatWindowInner />
    </ErrorBoundary>
  );
};