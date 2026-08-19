import React, { useState, useRef } from 'react';
import { 
  Headphones, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Download, 
  Radio, 
  Music2, 
  Sliders, 
  Disc 
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  bpm: number;
  url: string;
  cover: string;
}

const TRACKS: Track[] = [
  {
    id: 't-1',
    title: 'Neon Tokyo Midnight Rain',
    artist: 'Aiko Tanaka x WEVIDS Synth Lab',
    duration: '03:45',
    genre: 'Synthwave / Cyberpunk',
    bpm: 120,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 't-2',
    title: 'Persian Saffron Sunset Acoustic',
    artist: 'Sara from Tehran',
    duration: '04:12',
    genre: 'Ambient World Fusion',
    bpm: 88,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
    cover: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 't-3',
    title: 'Snapdragon Hyper Overclock Pulse',
    artist: 'Carlos Mendez (ROM Dev)',
    duration: '02:50',
    genre: 'Hard Techno Glitch',
    bpm: 144,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cyberpunk-2099-10701.mp3',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'
  }
];

export const AudioHubView: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRadioActive, setIsRadioActive] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      sounds.pop();
    }
  };

  const handleSelectTrack = (idx: number) => {
    sounds.click();
    setCurrentTrackIndex(idx);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 100);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/30 text-[#ff2d95] font-bold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>24/7 BORDERLESS AUDIO STREAM</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Audio Studio & Radio
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Lo-Fi beats, sound effects synthesizer, creator bio audio tracks, and royalty-free stems for vertical clips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
          <span className="text-xs font-orbitron font-bold text-[#00e5ff]">Stream Online: 192kbps AAC</span>
        </div>
      </div>

      {/* Main Music Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Player Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-6 flex flex-col justify-between h-full">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-black shadow-xl group">
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#ff2d95]/80 text-white font-orbitron text-[10px] font-bold">
                    {currentTrack.bpm} BPM
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-[#00e5ff] text-[10px]">
                    {currentTrack.genre}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-center">
              <h2 className="font-orbitron font-bold text-lg text-white">{currentTrack.title}</h2>
              <p className="text-xs text-[#8a8aa8]">{currentTrack.artist}</p>
            </div>

            {/* Audio Element */}
            <audio
              ref={audioRef}
              src={currentTrack.url}
              onEnded={() => handleSelectTrack((currentTrackIndex + 1) % TRACKS.length)}
            />

            {/* Transport controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleSelectTrack((currentTrackIndex - 1 + TRACKS.length) % TRACKS.length)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-transform hover:scale-110"
              >
                ⏮
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,45,149,0.5)] hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button
                onClick={() => handleSelectTrack((currentTrackIndex + 1) % TRACKS.length)}
                className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-transform hover:scale-110"
              >
                ⏭
              </button>
            </div>
          </div>
        </div>

        {/* Tracks List & SFX Station (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="liquid-glass rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <Music2 className="w-4 h-4 text-[#00e5ff]" />
              Featured Stems & Royalty-Free Tracks
            </h3>

            <div className="space-y-2">
              {TRACKS.map((t, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrack(idx)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#ff2d95]/20 border border-[#ff2d95]/50 shadow-md'
                        : 'hover:bg-white/5 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={t.cover} alt={t.title} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          {t.title}
                          {isSelected && isPlaying && <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />}
                        </div>
                        <div className="text-[10px] text-[#8a8aa8]">{t.artist}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8a8aa8]">
                      <span>{t.duration}</span>
                      <a
                        href={t.url}
                        download
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.success();
                          toast.success(`Downloaded stem: ${t.title}`);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white"
                        title="Download Audio Stem"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instant Sound FX Board */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              Web Audio Synthesizer Triggers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
              <button
                onClick={() => sounds.like()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#ff2d95]/20 border border-white/10 text-white"
              >
                ❤️ Synth Like Chord
              </button>
              <button
                onClick={() => sounds.success()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#00e5ff]/20 border border-white/10 text-white"
              >
                ✨ Success Chime
              </button>
              <button
                onClick={() => sounds.pop()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#fbbf24]/20 border border-white/10 text-white"
              >
                ⚡ Laser Pop
              </button>
              <button
                onClick={() => sounds.hover()}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 text-white"
              >
                🔊 Sine Hover Tick
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};