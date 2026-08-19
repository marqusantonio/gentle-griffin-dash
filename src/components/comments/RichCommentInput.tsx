import React, { useState, useRef } from 'react';
import { 
  Smile, 
  Image as ImageIcon, 
  Mic, 
  Send, 
  Sparkles, 
  X, 
  Play, 
  Square, 
  Film, 
  Sticker, 
  Search 
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface RichCommentInputProps {
  onSend: (comment: {
    text: string;
    media?: string;
    mediaType?: 'image' | 'gif' | 'sticker' | 'audio';
  }) => void;
  placeholder?: string;
}

const MOCK_GIPHY_GIFS = [
  { id: 'g1', title: 'Cyberpunk Cheers', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTYycGtwMjd1d3E5MnBnNHJvaTR0dWUxbG11bmt5eWNvOXF6b3p2bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif' },
  { id: 'g2', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'g3', title: 'Matrix Rain Code', url: 'https://media.giphy.com/media/A06UFEx8jxEwU/giphy.gif' },
  { id: 'g4', title: 'Hacker Typing', url: 'https://media.giphy.com/media/YQitE4YNQNahy/giphy.gif' },
  { id: 'g5', title: 'Neon Cat Dancing', url: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif' },
  { id: 'g6', title: 'GG Gaming Win', url: 'https://media.giphy.com/media/l41lT4n6ylgW2hh04/giphy.gif' },
];

const STICKERS = [
  { id: 's1', label: '🔥 Cyber Fire', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80' },
  { id: 's2', label: '⚡ Hyper Glow', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80' },
  { id: 's3', label: '💎 Diamond Heart', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=150&q=80' },
  { id: 's4', label: '🎮 Neon Pad', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&q=80' },
  { id: 's5', label: '🌸 Tokyo Cherry', url: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=150&q=80' },
];

const EMOJI_PALETTE = ['🔥', '❤️', '👏', '😍', '🚀', '✨', '😂', '🤯', '💀', '💯', '👾', '⚡', '🎉', '🍵', '👑'];

export const RichCommentInput: React.FC<RichCommentInputProps> = ({ onSend, placeholder = 'Write a rich comment...' }) => {
  const [text, setText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'gif' | 'sticker' | 'audio' } | null>(null);
  
  // Drawers
  const [showGiphy, setShowGiphy] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [giphySearch, setGiphySearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordIntervalRef = useRef<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedMedia({
        url: reader.result as string,
        type: 'image'
      });
      sounds.pop();
      toast.success('Photo attached to comment!');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectGif = (url: string) => {
    setAttachedMedia({ url, type: 'gif' });
    setShowGiphy(false);
    sounds.pop();
    toast.success('GIPHY GIF attached!');
  };

  const handleSelectSticker = (url: string) => {
    setAttachedMedia({ url, type: 'sticker' });
    setShowStickers(false);
    sounds.pop();
    toast.success('Sticker attached!');
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      clearInterval(recordIntervalRef.current);
      setIsRecording(false);
      setAttachedMedia({
        url: 'audio-note',
        type: 'audio'
      });
      sounds.success();
      toast.success(`Voice comment recorded (${recordingSeconds}s)!`);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      sounds.pop();
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachedMedia) return;

    onSend({
      text: text.trim(),
      media: attachedMedia?.url,
      mediaType: attachedMedia?.type
    });

    sounds.success();
    setText('');
    setAttachedMedia(null);
    setShowGiphy(false);
    setShowStickers(false);
    setShowEmoji(false);
  };

  const filteredGifs = MOCK_GIPHY_GIFS.filter(g => 
    g.title.toLowerCase().includes(giphySearch.toLowerCase())
  );

  return (
    <div className="space-y-2 relative">
      {/* Quick Emojis Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {EMOJI_PALETTE.slice(0, 10).map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => {
              sounds.pop();
              setText((prev) => prev + em);
            }}
            className="p-1 rounded-lg hover:bg-white/10 text-sm hover:scale-125 transition-transform"
          >
            {em}
          </button>
        ))}
      </div>

      {/* Media Attachment Preview */}
      {attachedMedia && (
        <div className="relative inline-flex items-center gap-2 p-2 rounded-2xl bg-white/10 border border-[#00e5ff]/40">
          {attachedMedia.type === 'audio' ? (
            <div className="flex items-center gap-2 text-xs text-[#00e5ff] font-orbitron font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>🎤 Voice Note Attached ({recordingSeconds || 4}s)</span>
            </div>
          ) : (
            <img 
              src={attachedMedia.url} 
              alt="Attached preview" 
              className="w-16 h-16 rounded-xl object-cover border border-white/20" 
            />
          )}
          <span className="text-[10px] text-[#8a8aa8] uppercase font-bold">{attachedMedia.type}</span>
          <button
            type="button"
            onClick={() => setAttachedMedia(null)}
            className="p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Comment Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5 focus-within:border-[#ff2d95] transition-all">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? `Recording audio... (${recordingSeconds}s)` : placeholder}
            disabled={isRecording}
            className="flex-1 bg-transparent text-xs text-white placeholder-[#8a8aa8] focus:outline-none py-1.5"
          />

          {/* Action Icon buttons */}
          <div className="flex items-center gap-1 text-[#8a8aa8]">
            <button
              type="button"
              onClick={() => {
                sounds.click();
                setShowGiphy(!showGiphy);
                setShowStickers(false);
              }}
              className={`p-1.5 rounded-lg hover:text-[#00e5ff] transition-colors ${showGiphy ? 'text-[#00e5ff] bg-white/10' : ''}`}
              title="Add GIPHY GIF"
            >
              <Film className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                setShowStickers(!showStickers);
                setShowGiphy(false);
              }}
              className={`p-1.5 rounded-lg hover:text-[#ff2d95] transition-colors ${showStickers ? 'text-[#ff2d95] bg-white/10' : ''}`}
              title="Add Sticker"
            >
              <Sticker className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:text-[#fbbf24] transition-colors"
              title="Attach Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleRecord}
              className={`p-1.5 rounded-lg transition-all ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'hover:text-red-400'
              }`}
              title={isRecording ? 'Stop & Attach Voice Note' : 'Record Voice Note'}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold hover:scale-105 transition-transform shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* GIPHY GIF Drawer */}
      {showGiphy && (
        <div className="absolute left-0 right-0 bottom-16 z-30 p-3 rounded-2xl liquid-glass border border-[#00e5ff]/40 shadow-2xl space-y-2 animate-slide-in">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-xs font-orbitron font-bold text-[#00e5ff] flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#ff2d95]" /> GIPHY GIF Library
            </span>
            <button onClick={() => setShowGiphy(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8aa8]" />
            <input
              type="text"
              value={giphySearch}
              onChange={(e) => setGiphySearch(e.target.value)}
              placeholder="Search trending anime, cyber, reactions..."
              className="w-full pl-8 pr-2 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-[#8a8aa8]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
            {filteredGifs.map((g) => (
              <img
                key={g.id}
                src={g.url}
                alt={g.title}
                onClick={() => handleSelectGif(g.url)}
                className="w-full h-20 rounded-xl object-cover cursor-pointer hover:scale-105 border border-transparent hover:border-[#00e5ff] transition-all"
              />
            ))}
          </div>
        </div>
      )}

      {/* STICKERS Drawer */}
      {showStickers && (
        <div className="absolute left-0 right-0 bottom-16 z-30 p-3 rounded-2xl liquid-glass border border-[#ff2d95]/40 shadow-2xl space-y-2 animate-slide-in">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-xs font-orbitron font-bold text-[#ff2d95] flex items-center gap-1.5">
              <Sticker className="w-3.5 h-3.5 text-[#00e5ff]" /> Cyberpunk Stickers
            </span>
            <button onClick={() => setShowStickers(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
          </div>

          <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
            {STICKERS.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSticker(s.url)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer flex flex-col items-center gap-1 hover:scale-110 transition-transform"
              >
                <img src={s.url} alt={s.label} className="w-10 h-10 rounded-lg object-cover" />
                <span className="text-[9px] text-[#8a8aa8] truncate w-full text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};