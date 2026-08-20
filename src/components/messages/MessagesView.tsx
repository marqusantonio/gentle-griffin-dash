import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  MessageSquareText, 
  Send, 
  Mic, 
  Video, 
  CheckCheck, 
  Lock,
  UserPlus,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const MessagesView: React.FC = () => {
  const { 
    conversations, 
    activeConvId, 
    setActiveConvId, 
    sendMessage, 
    currentUser, 
    allUsers,
    openVideoCall,
    isMutualFriend,
    startOrOpenChatWithUser,
    openUserProfileModal
  } = useWevids();

  const [messageText, setMessageText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherMemberId = activeConv?.members?.find(id => id !== currentUser.id);
  const otherUser = otherMemberId ? allUsers[otherMemberId] : null;
  const isFriend = otherUser ? isMutualFriend(otherUser.id) : false;

  // Find all creators/users who are mutual friends (you follow them & they follow you)
  const mutualFriends = Object.values(allUsers).filter(u => u.id !== currentUser.id && isMutualFriend(u.id));
  const otherAccounts = Object.values(allUsers).filter(u => u.id !== currentUser.id && !isMutualFriend(u.id));

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;

    if (!isFriend) {
      toast.error('You can only message accounts if you follow each other back!');
      return;
    }

    sendMessage(activeConv.id, {
      text: messageText.trim(),
      type: 'text',
    });
    setMessageText('');
  };

  const handleSendVoiceNote = () => {
    if (!activeConv || !isFriend) {
      toast.error('Voice messaging is only available between mutual friends!');
      return;
    }
    setIsRecordingVoice(true);
    sounds.pop();
    setTimeout(() => {
      setIsRecordingVoice(false);
      sendMessage(activeConv.id, {
        type: 'audio',
        text: '🎤 Voice note attached (0:07s)',
      });
      sounds.success();
      toast.success('Voice note sent!');
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="liquid-glass rounded-3xl border border-white/10 h-[640px] flex overflow-hidden shadow-2xl">
        {/* Left Sidebar: Conversations & Mutual Friends */}
        <div className="w-80 border-r border-white/10 flex flex-col liquid-glass-card">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-[#ff2d95]" />
              Mutual Friends Chat
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            {/* Active Conversations */}
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-[#8a8aa8] uppercase tracking-wider">
                Active Chats ({conversations.length})
              </div>

              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8a8aa8]">
                  No active chats. Start one below with your mutual friends!
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
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
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-md flex-shrink-0"
                        style={{ background: conv.color }}
                      >
                        {conv.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-bold text-white truncate">
                            {partner?.name || 'Direct Chat'}
                          </span>
                          <span className="text-[10px] text-[#8a8aa8]">{conv.time}</span>
                        </div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{conv.lastMsg}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mutual Friends Available to Message */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="px-2 text-[10px] font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mutual Friends ({mutualFriends.length})
              </div>

              {mutualFriends.length === 0 ? (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-[#8a8aa8] leading-relaxed">
                  🔒 Follow creators and when they follow you back, direct chat unlocks automatically!
                </div>
              ) : (
                mutualFriends.map(friend => (
                  <div
                    key={friend.id}
                    onClick={() => startOrOpenChatWithUser(friend.id)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 font-bold text-xs"
                        style={{ background: friend.color }}
                      >
                        {friend.avatar}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{friend.name}</div>
                        <div className="text-[10px] text-[#10b981] font-semibold">Friends 🤝</div>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold font-orbitron hover:bg-[#00e5ff] hover:text-slate-900 transition-colors">
                      Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Active Chat Pane */}
        {activeConv && otherUser ? (
          <div className="flex-1 flex flex-col justify-between bg-black/40">
            {/* Header */}
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
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 group-hover:text-[#00e5ff]">
                    {otherUser.name}
                    {isFriend && (
                      <span className="px-2 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[9px] font-bold border border-[#10b981]/40">
                        Mutual Friends 🤝
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#8a8aa8]">
                    {otherUser.handle} · {otherUser.location}
                  </div>
                </div>
              </div>

              {isFriend && (
                <button
                  onClick={() => openVideoCall(otherUser.name)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Launch Video Call"
                >
                  <Video className="w-4 h-4 text-[#00e5ff]" />
                </button>
              )}
            </div>

            {/* Mutual Follow Lock Warning if not mutual */}
            {!isFriend && (
              <div className="p-4 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-3 text-xs text-white">
                <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Mutual follow required:</strong> You and {otherUser.name} must both follow each other to send and receive messages.
                </span>
              </div>
            )}

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#8a8aa8]">
                  <Sparkles className="w-8 h-8 text-[#00e5ff] mb-2" />
                  <p className="font-bold text-white">Encrypted connection active!</p>
                  <p>Say hello to your friend {otherUser.name}.</p>
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
                        className={`max-w-[70%] p-3 rounded-2xl text-xs space-y-1 ${
                          isMe
                            ? 'bg-gradient-to-r from-[#ff2d95] to-[#9333ea] text-white rounded-br-none shadow-md'
                            : 'liquid-glass-card text-[#e8e8f4] border border-white/10 rounded-bl-none'
                        }`}
                      >
                        <p>{m.text}</p>
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

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2 bg-white/[0.02]">
              <button
                type="button"
                onClick={handleSendVoiceNote}
                disabled={!isFriend}
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
                placeholder={isFriend ? `Message ${otherUser.name}...` : 'Mutual follow required to chat...'}
                disabled={!isFriend}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!isFriend || !messageText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold hover:scale-105 transition-transform shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#8a8aa8] space-y-3">
            <Users className="w-12 h-12 text-[#ff2d95] opacity-50" />
            <h3 className="font-orbitron font-bold text-white text-base">Select a Mutual Friend to Chat</h3>
            <p className="max-w-sm">
              Direct messaging is active between mutual connections. Pick a friend from the left or follow users on their profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};