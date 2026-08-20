import React, { useState, useRef } from 'react';
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
  Smile
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

// GIPHY & TENOR CURATED STREAMS
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
    openUserProfileModal
  } = useWevids();

  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifProvider, setGifProvider] = useState<'ALL' | 'GIPHY' | 'TENOR'>('ALL');
  const [gifSearch, setGifSearch] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherMemberId = activeConv?.members?.find(id => id !== currentUser.id);
  const otherUser = otherMemberId ? allUsers[otherMemberId] : null;

  // Active creator list to start new direct chats with
  const availableCreators = Object.values(allUsers).filter(u => u.id !== currentUser.id);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!messageText.trim() && !attachedImage) return;

    sendMessage(activeConv.id, {
      text: messageText.trim() || undefined,
      mediaUrl: attachedImage || undefined,
      type: attachedImage ? 'image' : 'text',
    });

    setMessageText('');
    setAttachedImage(null);
    setShowGifPicker(false);
  };

  const handleSelectGif = (url: string) => {
    if (!activeConv) return;
    sounds.success();
    sendMessage(activeConv.id, {
      mediaUrl: url,
      type: 'gif',
      text: 'GIF',
    });
    setShowGifPicker(false);
  };

  const handleSendVoiceNote = () => {
    if (!activeConv) return;
    setIsRecordingVoice(true);
    sounds.pop();
    setTimeout(() => {
      setIsRecordingVoice(false);
      sendMessage(activeConv.id, {
        type: 'audio',
        text: '🎤 Voice note (0:08s)',
      });
      sounds.success();
      toast.success('Voice note sent!');
    }, 1500);
  };

  const filteredGifs = GIF_REPOSITORIES.filter(g => {
    const matchesProvider = gifProvider === 'ALL' || g.source === gifProvider;
    const matchesSearch = g.title.toLowerCase().includes(gifSearch.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="liquid-glass rounded-3xl border border-white/10 h-[640px] flex overflow-hidden shadow-2xl relative">
        {/* Left Sidebar: Active Chats & Available Creators */}
        <div className="w-80 border-r border-white/10 flex flex-col liquid-glass-card">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <MessageSquareText className="w-4 h-4 text-[#ff2d95]" />
              Direct Messages
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            {/* Active Conversations */}
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-[#8a8aa8] uppercase tracking-wider">
                Conversations ({conversations.length})
              </div>

              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8a8aa8]">
                  No active chats. Start one below!
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

            {/* Creators Available */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="px-2 text-[10px] font-bold text-[#00e5ff] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ff2d95]" />
                Online Creators ({availableCreators.length})
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
                      <div className="text-xs font-bold text-white truncate">{creator.name}</div>
                      <div className="text-[10px] text-[#8a8aa8]">{creator.handle}</div>
                    </div>
                  </div>

                  <button className="px-2.5 py-1 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold font-orbitron hover:bg-[#00e5ff] hover:text-slate-900 transition-colors">
                    Chat
                  </button>
                </div>
              ))}
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
                  </div>
                  <div className="text-[10px] text-[#8a8aa8]">
                    {otherUser.handle} · {otherUser.location}
                  </div>
                </div>
              </div>

              <button
                onClick={() => openVideoCall(otherUser.name)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                title="Launch Video Call"
              >
                <Video className="w-4 h-4 text-[#00e5ff]" />
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs text-[#8a8aa8]">
                  <Sparkles className="w-8 h-8 text-[#00e5ff] mb-2" />
                  <p className="font-bold text-white">Direct Chat active!</p>
                  <p>Send text, images, or GIFs to {otherUser.name}.</p>
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

            {/* GIF Drawer (GIPHY + TENOR) */}
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

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex items-center gap-2 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#fbbf24] transition-colors"
                title="Attach Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`p-2.5 rounded-xl transition-colors ${showGifPicker ? 'bg-[#00e5ff] text-slate-900' : 'bg-white/5 hover:bg-white/10 text-[#00e5ff]'}`}
                title="Search GIPHY / TENOR"
              >
                <Film className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSendVoiceNote}
                className={`p-2.5 rounded-xl transition-all ${
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
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message ${otherUser.name}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
              />

              <button
                type="submit"
                disabled={!messageText.trim() && !attachedImage}
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
              Click on any online creator on the left or search across feeds to send instant messages, GIFs, images, and voice notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};