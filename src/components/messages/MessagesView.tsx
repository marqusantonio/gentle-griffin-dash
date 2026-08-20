import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  MessageSquareText, 
  Send, 
  Mic, 
  Video, 
  Phone, 
  Users, 
  CheckCheck, 
  ShieldAlert, 
  UserCheck, 
  Check, 
  X,
  FileCode,
  Music2,
  Sparkles,
  Lock
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const MessagesView: React.FC = () => {
  const { 
    conversations, 
    activeConvId, 
    setActiveConvId, 
    sendMessage, 
    acceptMessageRequest, 
    declineMessageRequest,
    currentUser, 
    allUsers,
    openVideoCall,
    isMutualFriend,
    openUserProfileModal
  } = useWevids();

  const [messageText, setMessageText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];
  const otherMemberId = activeConv?.members?.find(id => id !== currentUser.id) || 'sara';
  const otherUser = allUsers[otherMemberId];
  const isFriend = otherUser ? isMutualFriend(otherUser.id) : false;

  // 1-Message Gate logic:
  const isPendingMyAcceptance = activeConv?.status === 'pending_request' && activeConv?.requestedBy !== currentUser.id;
  const isPendingOtherAcceptance = activeConv?.status === 'pending_request' && activeConv?.requestedBy === currentUser.id;
  const hasSentInitialMessage = isPendingOtherAcceptance && (activeConv?.messages?.length || 0) >= 1;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;

    if (hasSentInitialMessage) {
      toast.error('1-Message Request Limit reached. Please wait for recipient to accept your chat request.');
      return;
    }

    sendMessage(activeConv.id, {
      text: messageText.trim(),
      type: 'text',
    });
    setMessageText('');
  };

  const handleSendVoiceNote = () => {
    if (!activeConv) return;
    if (isPendingOtherAcceptance) {
      toast.error('Voice messaging unlocks once the user accepts your connection request!');
      return;
    }
    setIsRecordingVoice(true);
    sounds.pop();
    setTimeout(() => {
      setIsRecordingVoice(false);
      sendMessage(activeConv.id, {
        type: 'audio',
        text: '🎤 Voice note attached (0:09s)',
      });
      sounds.success();
      toast.success('Voice note sent!');
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="liquid-glass rounded-3xl border border-white/10 h-[640px] flex overflow-hidden shadow-2xl">
        {/* Left List */}
        <div className="w-80 border-r border-white/10 flex flex-col liquid-glass-card">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-[#ff2d95]" />
              Direct Messages & Requests
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const isReq = conv.status === 'pending_request';
              const isReqByMe = conv.requestedBy === currentUser.id;
              const partnerId = conv.members.find(m => m !== currentUser.id) || '';
              const partner = allUsers[partnerId];

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
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md flex-shrink-0 relative"
                    style={{ background: conv.color }}
                  >
                    {conv.avatar}
                    {isReq && !isReqByMe && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#fbbf24] border-2 border-[#0a0a1a] animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-bold text-white truncate">
                        {conv.isGroup ? conv.groupName : (partner?.name || 'Direct Chat')}
                      </span>
                      <span className="text-[10px] text-[#8a8aa8]">{conv.time}</span>
                    </div>
                    <p className="text-[11px] text-[#8a8aa8] truncate">{conv.lastMsg}</p>
                    
                    {isReq && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block border ${
                        isReqByMe 
                          ? 'bg-white/5 text-[#8a8aa8] border-white/10'
                          : 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/40 animate-pulse'
                      }`}>
                        {isReqByMe ? '⏳ Awaiting Acceptance' : '🔔 1-Message Request'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Pane */}
        {activeConv ? (
          <div className="flex-1 flex flex-col justify-between bg-black/40">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div 
                onClick={() => otherUser && openUserProfileModal(otherUser)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm group-hover:scale-105 transition-transform"
                  style={{ background: activeConv.color }}
                >
                  {activeConv.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-[#00e5ff]">
                    {activeConv.isGroup ? activeConv.groupName : (otherUser?.name || 'Direct Chat')}
                    {isFriend && (
                      <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[9px] font-bold border border-[#10b981]/40">
                        Friends 🤝
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#00e5ff] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                    <span>Real-time Broadcast Node Online</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openVideoCall(otherUser?.name || 'Friend')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Launch Video Call"
                >
                  <Video className="w-4 h-4 text-[#00e5ff]" />
                </button>
              </div>
            </div>

            {/* Request Gate Banner if Pending My Acceptance */}
            {isPendingMyAcceptance && (
              <div className="p-4 bg-gradient-to-r from-[#fbbf24]/20 to-[#ff2d95]/20 border-b border-[#fbbf24]/40 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white">
                  <ShieldAlert className="w-5 h-5 text-[#fbbf24] flex-shrink-0" />
                  <span>
                    <strong>{otherUser?.name}</strong> sent an initial 1-message connection request. Accept to enable full direct messaging?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => acceptMessageRequest(activeConv.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#10b981] text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept Request
                  </button>
                  <button
                    onClick={() => declineMessageRequest(activeConv.id)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs hover:bg-red-500/30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            )}

            {/* Request Gate Banner if Pending Other's Acceptance */}
            {isPendingOtherAcceptance && (
              <div className="p-3 bg-white/5 border-b border-white/10 text-xs text-[#fbbf24] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#fbbf24]" />
                <span>
                  You sent 1 message request to <strong>{otherUser?.name}</strong>. Full messaging will unlock automatically once they accept.
                </span>
              </div>
            )}

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.map((m) => {
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
                      className={`max-w-[70%] p-3 rounded-2xl text-xs space-y-1 ${
                        isMe
                          ? 'bg-gradient-to-r from-[#ff2d95] to-[#9333ea] text-white rounded-br-none shadow-md'
                          : 'liquid-glass-card text-[#e8e8f4] border border-white/10 rounded-bl-none'
                      }`}
                    >
                      {!isMe && (
                        <div className="font-bold text-[10px] text-[#00e5ff]">{m.senderName}</div>
                      )}

                      <p>{m.text}</p>

                      <div className="flex items-center justify-end gap-1 text-[9px] opacity-70">
                        <span>{m.timestamp}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-[#00e5ff]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2 bg-white/[0.02]">
              <button
                type="button"
                onClick={handleSendVoiceNote}
                disabled={hasSentInitialMessage}
                className={`p-2.5 rounded-xl transition-all ${
                  isRecordingVoice
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 text-[#8a8aa8] hover:text-white disabled:opacity-40'
                }`}
                title="Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={hasSentInitialMessage ? 'Request sent (waiting for approval)...' : isPendingOtherAcceptance ? 'Send 1-message request...' : 'Type a message...'}
                disabled={hasSentInitialMessage}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={hasSentInitialMessage}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold hover:scale-105 transition-transform shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};