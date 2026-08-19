import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Radio, 
  Video, 
  Mic, 
  Share2, 
  Monitor, 
  Eye, 
  Heart, 
  Sparkles, 
  Send, 
  Sliders,
  Flame,
  Volume2
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const LiveStreamView: React.FC = () => {
  const { currentUser } = useWevids();

  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('Flashing HyperOS 2.0 & Overclocking Snapdragon 8 Gen 3 Live! ⚡');
  const [liveChat, setLiveChat] = useState<Array<{ user: string; text: string }>>([
    { user: 'carlos_modder', text: 'Touch latency script looks crazy smooth!' },
    { user: 'aiko_visuals', text: 'Liquid glass UI overlay is gorgeous 💖' },
    { user: 'sara_tehran', text: 'Sending saffron tea love from Tehran! ☕' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(482);

  const handleToggleLive = () => {
    sounds.success();
    setIsLive(!isLive);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setLiveChat((prev) => [...prev, { user: currentUser.name, text: chatInput.trim() }]);
    setChatInput('');
    sounds.pop();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Studio Bar */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>GO LIVE BROADCAST STUDIO</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Creator Live Node
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Multi-stream to WEVIDS Global Feed with screen capture, camera overlays, and real-time tipping.
          </p>
        </div>

        <button
          onClick={handleToggleLive}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-orbitron font-bold text-xs shadow-lg transition-all ${
            isLive
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-gradient-to-r from-red-600 to-[#ff2d95] text-white hover:scale-105'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{isLive ? 'END LIVESTREAM' : 'START GO LIVE BROADCAST'}</span>
        </button>
      </div>

      {/* Live Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Viewport (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl bg-black flex items-center justify-center">
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Live Indicator overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white font-orbitron font-bold text-[10px] flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[10px] flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#00e5ff]" />
                {viewerCount} Viewers
              </span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-2">
            <h2 className="font-bold text-base text-white">{streamTitle}</h2>
            <p className="text-xs text-[#8a8aa8]">Streaming in 1080p 60fps · Borderless Low-Latency CDN</p>
          </div>
        </div>

        {/* Live Chat Pane (1 col) */}
        <div className="liquid-glass rounded-3xl p-5 border border-white/10 h-[500px] flex flex-col justify-between">
          <div className="pb-3 border-b border-white/10 font-orbitron font-bold text-xs text-[#00e5ff] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ff2d95]" />
            Live Superchat & Reactions
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
            {liveChat.map((c, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                <span className="font-bold text-[#ff2d95] mr-1.5">{c.user}:</span>
                <span className="text-[#e8e8f4]">{c.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send chat reaction..."
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#ff2d95] text-slate-900 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};