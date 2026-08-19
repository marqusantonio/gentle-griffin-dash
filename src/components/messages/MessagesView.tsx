import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  MessageSquareText, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Video, 
  Phone, 
  Users, 
  Plus, 
  FileCode, 
  Paperclip,
  Smile,
  Search,
  CheckCheck
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const MessagesView: React.FC = () => {
  const { 
    conversations, 
    activeConvId, 
    setActiveConvId, 
    sendMessage, 
    createGroupChat, 
    currentUser, 
    openVideoCall 
  } = useWevids();

  const [messageText, setMessageText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    sendMessage(activeConv.id, {
      text: messageText.trim(),
      type: 'text',
    });
    setMessageText('');
  };

  const handleSendVoiceNote = () => {
    if (!activeConv) return;
    setIsRecordingVoice(true);
    sounds.pop();
    setTimeout(() => {
      setIsRecordingVoice(false);
      sendMessage(activeConv.id, {
        type: 'audio',
        text: 'Voice note (0:08s)',
        mediaUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
      });
      sounds.success();
    }, 2000);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    createGroupChat(groupName.trim(), ['carlos', 'aiko', 'sara']);
    setGroupName('');
    setShowGroupModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="liquid-glass rounded-3xl border border-white/10 h-[640px] flex overflow-hidden shadow-2xl">
        {/* Left Conversation List */}
        <div className="w-80 border-r border-white/10 flex flex-col liquid-glass-card">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-[#ff2d95]" />
              Direct & Groups
            </h2>
            <button
              onClick={() => {
                sounds.pop();
                setShowGroupModal(true);
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"
              title="Create New Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
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
                        {conv.isGroup ? conv.groupName : 'Direct Chat'}
                      </span>
                      <span className="text-[10px] text-[#8a8aa8]">{conv.time}</span>
                    </div>
                    <p className="text-[11px] text-[#8a8aa8] truncate">{conv.lastMsg}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Pane */}
        {activeConv ? (
          <div className="flex-1 flex flex-col justify-between bg-black/40">
            {/* Top Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm"
                  style={{ background: activeConv.color }}
                >
                  {activeConv.avatar}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {activeConv.isGroup ? activeConv.groupName : 'Direct Chat'}
                  </div>
                  <div className="text-[10px] text-[#00e5ff] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    <span>Real-time Broadcast Node Online</span>
                  </div>
                </div>
              </div>

              {/* Call triggers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openVideoCall(activeConv.groupName || 'Direct Call')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Video Call"
                >
                  <Video className="w-4 h-4 text-[#00e5ff]" />
                </button>
              </div>
            </div>

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

                      {m.type === 'text' && <p>{m.text}</p>}

                      {m.type === 'gif' && m.mediaUrl && (
                        <img src={m.mediaUrl} alt="GIF" className="rounded-xl max-h-44 object-cover" />
                      )}

                      {m.type === 'audio' && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40">
                          <Mic className="w-4 h-4 text-[#00e5ff]" />
                          <span>🎤 Voice Note (0:08s)</span>
                        </div>
                      )}

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
                className={`p-2.5 rounded-xl transition-all ${
                  isRecordingVoice
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-white/5 hover:bg-white/10 text-[#8a8aa8] hover:text-white'
                }`}
                title="Hold to Record Voice"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message or share a ROM build..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
              />

              <button
                type="submit"
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold hover:scale-105 transition-transform shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {/* Group Create Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-orbitron font-bold text-base text-white">Create Modding Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Name (e.g. Xiaomi 14 Kernel Lab)"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#8a8aa8] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};