import React, { useState, useRef, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  Send, 
  Bot, 
  Download, 
  Share2, 
  Sliders, 
  Film, 
  Cpu, 
  Wand2, 
  RefreshCw,
  Layers,
  Key
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const AiHubView: React.FC = () => {
  const { addPost, currentUser } = useWevids();
  
  const [activeTab, setActiveTab] = useState<'video' | 'chat' | 'image'>('video');
  
  // Video Generator State
  const [prompt, setPrompt] = useState('Cyberpunk flying drone racing through neon rain Tokyo with liquid reflections, 8k octane render');
  const [stylePreset, setStylePreset] = useState('Cyberpunk & Neon');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [duration, setDuration] = useState(10);
  const [cameraMotion, setCameraMotion] = useState('Orbit 360');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const renderTimerRef = useRef<any>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (renderTimerRef.current) clearInterval(renderTimerRef.current);
    };
  }, []);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Greetings creator! I am the WEVIDS Neural Copilot (v3.1). How can I assist your video rendering, ROM build scripts, or shader workflows today?',
      time: 'Just now'
    }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Image Gen State
  const [imagePrompt, setImagePrompt] = useState('Holographic gaming controller floating over liquid glass matrix');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const stylePresets = [
    'Cyberpunk & Neon',
    'Hyper-realistic 8K',
    'Anime Voxel Studio',
    'Cinematic Timelapse',
    'Liquid Glass Physics'
  ];

  const handleGenerateVideo = () => {
    if (!prompt.trim() || isGeneratingVideo) return;
    sounds.pop();
    setIsGeneratingVideo(true);
    setRenderProgress(0);
    setGeneratedVideoUrl(null);

    let progress = 0;
    if (renderTimerRef.current) clearInterval(renderTimerRef.current);

    renderTimerRef.current = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(renderTimerRef.current);
        setRenderProgress(100);
        setIsGeneratingVideo(false);
        setGeneratedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
        sounds.success();
        toast.success('AI Video rendered successfully!');
      } else {
        setRenderProgress(progress);
      }
    }, 350);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    sounds.pop();
    
    const newMsg = {
      sender: 'user' as const,
      text: userQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setUserQuery('');
    setIsAiTyping(true);

    setTimeout(() => {
      setIsAiTyping(false);
      sounds.pop();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Analysis complete! For "${newMsg.text}", I recommend configuring your render pipeline with 60 FPS temporal interpolation and applying a post-process bloom pass with a 0.28 liquid refraction weight. Check out Developer Vault for matching kernel shaders.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
  };

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return;
    sounds.pop();
    setIsGeneratingImg(true);

    const seed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=800&seed=${seed}&nologo=true`;

    setTimeout(() => {
      setGeneratedImageUrl(pollinationsUrl);
      setIsGeneratingImg(false);
      sounds.success();
      toast.success('Image generated!');
    }, 1500);
  };

  const handlePublishToFeed = () => {
    sounds.success();
    addPost({
      userId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorAvatar: currentUser.avatar,
      authorColor: currentUser.color,
      location: currentUser.location,
      time: 'Just now',
      content: `🎬 Generated a new AI Render: "${prompt}" using WEVIDS Neural Studio v3.1!`,
      mediaUrl: generatedVideoUrl || undefined,
      mediaType: 'video',
      tags: ['#AIVideo', '#WEVIDS31', '#NeuralRender', '#Cyberpunk']
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/30 text-[#ff2d95] font-bold text-xs mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NEURAL ENGINE v3.1 ACTIVE</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            AI Video & Creative Studio
          </h1>
          <p className="text-xs text-[#8a8aa8] mt-1 max-w-xl">
            Text-to-Video generation, interactive GPT-4 chat copilot, and real-time Pollinations image rendering with one-click feed publishing.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center p-1.5 rounded-2xl bg-white/5 border border-white/10 z-10">
          <button
            onClick={() => {
              sounds.click();
              setActiveTab('video');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Video Gen
          </button>
          <button
            onClick={() => {
              sounds.click();
              setActiveTab('chat');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Chat
          </button>
          <button
            onClick={() => {
              sounds.click();
              setActiveTab('image');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              activeTab === 'image'
                ? 'bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Image Studio
          </button>
        </div>
      </div>

      {/* TAB 1: VIDEO GENERATOR */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#00e5ff]" />
                Video Prompt Settings
              </h3>

              <div>
                <label className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider block mb-1.5">
                  Creative Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#ff2d95]"
                  placeholder="Describe your futuristic video scene in detail..."
                />
              </div>

              {/* Style Presets */}
              <div>
                <label className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider block mb-1.5">
                  Visual Style
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {stylePresets.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStylePreset(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        stylePreset === st
                          ? 'bg-[#ff2d95] text-slate-900 font-bold shadow-md'
                          : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/5'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider block mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold text-center">
                  {[
                    { id: '9:16', label: '9:16 Vertical (Clips)' },
                    { id: '16:9', label: '16:9 Widescreen (Stream)' },
                    { id: '1:1', label: '1:1 Square (Feed)' }
                  ].map((ar) => (
                    <button
                      key={ar.id}
                      type="button"
                      onClick={() => setAspectRatio(ar.id as any)}
                      className={`p-2 rounded-xl border transition-all ${
                        aspectRatio === ar.id
                          ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]'
                          : 'bg-white/5 text-[#8a8aa8] border-white/5 hover:border-white/20'
                      }`}
                    >
                      {ar.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration & Camera */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-[#8a8aa8] block mb-1">Duration: {duration}s</label>
                  <input
                    type="range"
                    min="5"
                    max="15"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-[#ff2d95]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#8a8aa8] block mb-1">Camera Movement</label>
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                  >
                    <option value="Orbit 360" className="bg-[#0a0a1a]">Orbit 360°</option>
                    <option value="Pan Left" className="bg-[#0a0a1a]">Pan Left & Zoom</option>
                    <option value="Hyper-dive" className="bg-[#0a0a1a]">Hyper-dive</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(255,45,149,0.4)] hover:scale-102 transition-transform disabled:opacity-50"
              >
                {isGeneratingVideo ? `RENDERING ${renderProgress}%...` : '⚡ GENERATE AI VIDEO'}
              </button>
            </div>
          </div>

          {/* Canvas & Output Preview */}
          <div className="lg:col-span-7">
            <div className="liquid-glass rounded-2xl p-5 border border-white/10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-xs font-bold text-white font-orbitron flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#ff2d95]" />
                  Render Canvas
                </span>
                <span className="text-[11px] text-[#00e5ff] font-orbitron">
                  Preset: {stylePreset} · {aspectRatio}
                </span>
              </div>

              {/* Video Player or Placeholder */}
              <div className="flex-1 min-h-[360px] rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center relative overflow-hidden">
                {isGeneratingVideo && (
                  <div className="text-center space-y-3 z-10 p-6">
                    <div className="w-16 h-16 rounded-full border-4 border-[#00e5ff]/20 border-t-[#00e5ff] animate-spin mx-auto" />
                    <div className="font-orbitron font-bold text-sm text-white">
                      Synthesizing Neural Frames ({renderProgress}%)
                    </div>
                    <div className="w-48 h-1.5 bg-white/10 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] transition-all duration-300"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!isGeneratingVideo && generatedVideoUrl && (
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                )}

                {!isGeneratingVideo && !generatedVideoUrl && (
                  <div className="text-center p-8 space-y-2 text-[#8a8aa8]">
                    <Sparkles className="w-10 h-10 text-[#00e5ff] mx-auto opacity-40 animate-pulse" />
                    <div className="font-bold text-white text-sm">Ready for Generation</div>
                    <div className="text-xs max-w-sm">
                      Type your scene prompt on the left and tap Generate to initiate multi-pass raytraced frame interpolation.
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              {generatedVideoUrl && (
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#10b981] font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    Render Output: 1080p MP4 Ready
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePublishToFeed}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-bold text-xs font-orbitron hover:scale-105 transition-transform shadow-md"
                    >
                      🚀 Post to WEVIDS Feed
                    </button>
                    <a
                      href={generatedVideoUrl}
                      download="wevids_ai_render.mp4"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                      title="Download MP4"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI CHAT COPILOT */}
      {activeTab === 'chat' && (
        <div className="liquid-glass rounded-3xl p-5 border border-white/10 h-[600px] flex flex-col">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00e5ff] to-[#ff2d95] flex items-center justify-center text-slate-900 font-bold">
              <Bot className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <div className="font-orbitron font-bold text-sm text-white">WEVIDS AI Copilot</div>
              <div className="text-[11px] text-[#00e5ff]">Connected to Global Open Source & GPT Knowledge</div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00e5ff] to-[#ff2d95] flex items-center justify-center text-slate-900 font-bold text-xs flex-shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#ff2d95] to-[#9333ea] text-white rounded-br-none shadow-md'
                      : 'liquid-glass-card text-[#e8e8f4] border border-white/10 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[9px] opacity-60 block mt-1 text-right">{msg.time}</span>
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex items-center gap-2 text-xs text-[#8a8aa8] italic">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
                Copilot is computing response...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask anything about video rendering, HyperOS ROMs, or shader codes..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-bold text-xs hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: IMAGE STUDIO */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#fbbf24]" />
              Image Generator
            </h3>
            <p className="text-xs text-[#8a8aa8]">
              Powered by Pollinations AI open neural rendering network. Free, real-time image synthesis without API keys.
            </p>

            <div>
              <label className="text-[11px] font-bold text-[#8a8aa8] uppercase tracking-wider block mb-1.5">
                Image Prompt
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#fbbf24]"
                placeholder="Describe your 3D digital art or wallpaper..."
              />
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImg}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs tracking-wider shadow-md hover:scale-102 transition-transform disabled:opacity-50"
            >
              {isGeneratingImg ? 'GENERATING ARTWORK...' : '✨ GENERATE PREVIEW IMAGE'}
            </button>
          </div>

          <div className="liquid-glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
            <div className="text-xs font-bold text-white font-orbitron mb-3">Render Preview</div>
            <div className="aspect-square rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
              {generatedImageUrl ? (
                <img src={generatedImageUrl} alt="AI Generated" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[#8a8aa8] text-xs p-6">
                  No image generated yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};