import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
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
  Upload, 
  Plus, 
  Check, 
  Disc,
  RefreshCw,
  Database,
  X 
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const AudioHubView: React.FC = () => {
  const { 
    audioTracks, 
    addAudioTrack, 
    syncWithSupabase, 
    isCloudSyncing, 
    lastCloudSync, 
    currentUser 
  } = useWevids();
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // MP3 Upload State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(currentUser.name);
  const [genre, setGenre] = useState('Cyberpunk / Synth');
  const [bpm, setBpm] = useState(128);
  const [audioUrl, setAudioUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80');
  const [uploadFileName, setUploadFileName] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isCloudLinked = isSupabaseConfigured();
  const currentTrack = audioTracks[currentTrackIndex] || audioTracks[0];

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

  const handleLocalMp3Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAudioUrl(reader.result as string);
      sounds.pop();
      toast.success(`MP3 loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioUrl) {
      toast.error('Please select an MP3 file and enter a track title');
      return;
    }

    addAudioTrack({
      title,
      artist: artist || currentUser.name,
      genre,
      bpm: Number(bpm) || 120,
      duration: '03:15',
      url: audioUrl,
      cover: coverUrl
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setAudioUrl('');
    setUploadFileName('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/30 text-[#ff2d95] font-bold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>24/7 BORDERLESS AUDIO STREAM & MP3 LAB</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Audio Studio & MP3 Deck
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Stream Lo-Fi beats, upload custom MP3 stems with Supabase cloud backup, and trigger Web Audio synth effects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Sync Button */}
          <button
            onClick={() => syncWithSupabase()}
            disabled={isCloudSyncing}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs font-orbitron font-bold transition-all ${
              isCloudLinked
                ? 'bg-[#3ecf8e]/15 border-[#3ecf8e]/40 text-[#3ecf8e] hover:bg-[#3ecf8e]/25'
                : 'bg-white/5 border-white/10 text-[#8a8aa8] hover:text-white'
            }`}
            title="Pull/Push updates with Supabase public.audio_tracks table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-[#3ecf8e]' : ''}`} />
            <span>{isCloudSyncing ? 'Syncing Cloud...' : isCloudLinked ? 'Sync Supabase' : 'Local Mode'}</span>
          </button>

          <button
            onClick={() => {
              sounds.pop();
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD MP3 STEM</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Indicator */}
      <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs text-[#8a8aa8]">
        <div className="flex items-center gap-2">
          <Database className={`w-3.5 h-3.5 ${isCloudLinked ? 'text-[#3ecf8e]' : 'text-[#fbbf24]'}`} />
          <span>
            Database Status:{' '}
            <strong className={isCloudLinked ? 'text-[#3ecf8e]' : 'text-[#fbbf24]'}>
              {isCloudLinked ? 'Supabase Table "audio_tracks" Connected' : 'Local Storage Cache (Link Cloud in header)'}
            </strong>
          </span>
        </div>
        {lastCloudSync && (
          <span className="text-[11px] font-mono text-[#00e5ff]">Last synced at {lastCloudSync}</span>
        )}
      </div>

      {/* Main Music Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Player Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-6 flex flex-col justify-between h-full">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-black shadow-xl group">
              <img
                src={currentTrack?.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'}
                alt={currentTrack?.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#ff2d95]/80 text-white font-orbitron text-[10px] font-bold">
                    {currentTrack?.bpm || 120} BPM
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 text-[#00e5ff] text-[10px]">
                    {currentTrack?.genre || 'Electronic'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-center">
              <h2 className="font-orbitron font-bold text-lg text-white">{currentTrack?.title}</h2>
              <p className="text-xs text-[#8a8aa8]">{currentTrack?.artist}</p>
            </div>

            {/* Audio Element */}
            <audio
              ref={audioRef}
              src={currentTrack?.url}
              onEnded={() => handleSelectTrack((currentTrackIndex + 1) % audioTracks.length)}
            />

            {/* Transport controls */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => handleSelectTrack((currentTrackIndex - 1 + audioTracks.length) % audioTracks.length)}
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
                onClick={() => handleSelectTrack((currentTrackIndex + 1) % audioTracks.length)}
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
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <Music2 className="w-4 h-4 text-[#00e5ff]" />
                Deck Playlist ({audioTracks.length} tracks)
              </h3>
              <span className="text-[10px] text-[#10b981] font-bold">☁️ Live Cloud Synced</span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {audioTracks.map((t, idx) => {
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
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={t.cover} alt={t.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
                          {t.title}
                          {isSelected && isPlaying && <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping flex-shrink-0" />}
                        </div>
                        <div className="text-[10px] text-[#8a8aa8] truncate">{t.artist} · {t.genre}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8a8aa8] flex-shrink-0">
                      <span>{t.duration}</span>
                      <a
                        href={t.url}
                        download={`${t.title}.mp3`}
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.success();
                          toast.success(`Downloading stem: ${t.title}`);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white"
                        title="Download Audio File"
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

      {/* MP3 UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00e5ff]" />
                Upload MP3 Audio Track
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitTrack} className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/20 text-center space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/mp3,audio/wav,audio/ogg"
                  className="hidden"
                  onChange={handleLocalMp3Upload}
                />
                <Music2 className="w-8 h-8 text-[#ff2d95] mx-auto opacity-75" />
                <div className="text-white font-bold">
                  {uploadFileName ? uploadFileName : 'Select .mp3 or .wav Audio File'}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Browse Device
                </button>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Track Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neon Horizon 2026"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">BPM Tempo</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Genre Category</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="Synthwave / Cyberpunk" className="bg-[#0a0a1a]">Synthwave / Cyberpunk</option>
                  <option value="Lo-Fi Chill Beats" className="bg-[#0a0a1a]">Lo-Fi Chill Beats</option>
                  <option value="Hard Techno / Glitch" className="bg-[#0a0a1a]">Hard Techno / Glitch</option>
                  <option value="Persian Acoustic Fusion" className="bg-[#0a0a1a]">Persian Acoustic Fusion</option>
                  <option value="Game OST / Ambient" className="bg-[#0a0a1a]">Game OST / Ambient</option>
                </select>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Cover Artwork URL</label>
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#8a8aa8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold shadow-md"
                >
                  ⚡ Sync & Add Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};