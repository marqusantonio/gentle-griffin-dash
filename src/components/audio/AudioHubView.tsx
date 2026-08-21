import React, { useState, useRef, useEffect } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Play, 
  Pause, 
  Radio, 
  Music2, 
  Sliders, 
  Upload, 
  Download,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Sparkles,
  Disc3,
  Search
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const AudioHubView: React.FC = () => {
  const { 
    audioTracks, 
    addAudioTrack, 
    currentUser 
  } = useWevids();
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  
  // MP3 Upload State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState(currentUser?.name || 'Creator');
  const [genre, setGenre] = useState('Synthwave / Cyberpunk');
  const [bpm, setBpm] = useState(128);
  const [audioUrl, setAudioUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80');
  const [uploadFileName, setUploadFileName] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const safeTracks = Array.isArray(audioTracks) ? audioTracks : [];
  
  const filteredTracks = safeTracks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || t.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  const currentTrack = filteredTracks[currentTrackIndex] || safeTracks[0] || null;

  // Real-time Audio Spectrum simulation canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 32;
      const barWidth = canvas.width / barCount;

      for (let i = 0; i < barCount; i++) {
        const height = isPlaying 
          ? Math.abs(Math.sin((step + i * 0.4) * 0.15)) * (canvas.height * 0.85) + 8
          : 6;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#00e5ff');
        gradient.addColorStop(0.5, '#ff2d95');
        gradient.addColorStop(1, '#ffffff');

        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth + 1.5, canvas.height - height, barWidth - 3, height);
      }

      if (isPlaying) step++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
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
    if (filteredTracks.length === 0) return;
    sounds.click();
    const safeIdx = ((idx % filteredTracks.length) + filteredTracks.length) % filteredTracks.length;
    setCurrentTrackIndex(safeIdx);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 100);
  };

  const handleSpeedChange = (speed: number) => {
    sounds.click();
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
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
      toast.success(`Audio stem loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !audioUrl) {
      toast.error('Please select an audio file and enter a track title');
      return;
    }

    addAudioTrack({
      title,
      artist: artist || currentUser?.name || 'Creator',
      genre,
      bpm: Number(bpm) || 120,
      duration: '03:20',
      url: audioUrl,
      cover: coverUrl
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setAudioUrl('');
    setUploadFileName('');
  };

  const genres = ['All', 'Synthwave', 'Lo-Fi', 'Techno', 'Ambient'];

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/30 text-[#ff2d95] font-bold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>24/7 SUPABASE AUDIO ENGINE & STEMS DECK</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Audio Studio & Synthesizer
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Real-time audio visualizer, multitrack audio playback, and instant stem export.
          </p>
        </div>

        <button
          onClick={() => {
            sounds.pop();
            setIsUploadModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
        >
          <Upload className="w-4 h-4" />
          <span>UPLOAD AUDIO STEM</span>
        </button>
      </div>

      {/* Main Music Deck */}
      {safeTracks.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 border border-white/10 text-center space-y-4 shadow-xl">
          <Music2 className="w-14 h-14 text-[#ff2d95] mx-auto opacity-50 animate-pulse" />
          <h3 className="font-orbitron font-bold text-lg text-white">Your Audio Deck is Ready</h3>
          <p className="text-xs text-[#8a8aa8] max-w-md mx-auto">
            Upload your first MP3 or WAV audio stem to sync with Supabase and stream live.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD FIRST TRACK</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Player Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl space-y-5 flex flex-col justify-between h-full">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black shadow-xl group flex items-center justify-center">
                <img
                  src={currentTrack?.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'}
                  alt={currentTrack?.title || 'Track cover'}
                  className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : ''}`}
                />
                
                {/* Vinyl Record overlay icon */}
                <Disc3 className={`absolute w-24 h-24 text-white/20 pointer-events-none transition-transform duration-1000 ${isPlaying ? 'animate-spin' : ''}`} />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-[#ff2d95]/80 text-white font-orbitron text-[10px] font-bold">
                      {currentTrack?.bpm || 120} BPM
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 text-[#00e5ff] text-[10px]">
                      {currentTrack?.genre || 'Electronic'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spectrum Visualizer Canvas */}
              <div className="p-3 rounded-2xl bg-black/50 border border-white/10">
                <canvas ref={canvasRef} width={280} height={40} className="w-full h-10 rounded-lg" />
              </div>

              <div className="space-y-1 text-center">
                <h2 className="font-orbitron font-bold text-lg text-white">{currentTrack?.title}</h2>
                <p className="text-xs text-[#8a8aa8]">{currentTrack?.artist}</p>
              </div>

              {/* Audio Element */}
              <audio
                ref={audioRef}
                src={currentTrack?.url}
                onEnded={() => handleSelectTrack((currentTrackIndex + 1) % filteredTracks.length)}
              />

              {/* Transport Controls */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => handleSelectTrack(currentTrackIndex - 1)}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-transform hover:scale-110"
                  title="Previous Track"
                >
                  <Rewind className="w-5 h-5" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,45,149,0.5)] hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>

                <button
                  onClick={() => handleSelectTrack(currentTrackIndex + 1)}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-transform hover:scale-110"
                  title="Next Track"
                >
                  <FastForward className="w-5 h-5" />
                </button>
              </div>

              {/* Speed & Volume adjust */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#8a8aa8]">
                <div className="flex items-center gap-1.5 font-orbitron">
                  <span>Speed:</span>
                  {[0.75, 1, 1.25, 1.5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] ${playbackRate === spd ? 'bg-[#00e5ff] text-slate-900 font-bold' : 'hover:bg-white/10 text-white'}`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00e5ff]" />}
                </button>
              </div>
            </div>
          </div>

          {/* Tracks List & SFX Station (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="liquid-glass rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-[#00e5ff]" />
                  Playlist Deck ({filteredTracks.length})
                </h3>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {genres.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        sounds.click();
                        setSelectedGenre(g);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        selectedGenre === g
                          ? 'bg-[#ff2d95] text-slate-900 font-bold shadow'
                          : 'bg-white/5 text-[#8a8aa8] hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8aa8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by song title or producer..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff]"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredTracks.map((t, idx) => {
                  const isSelected = t.id === currentTrack?.id;
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
                            toast.success(`Downloading audio stem: ${t.title}`);
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
                Live Web Audio Synthesizer Triggers
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                <button
                  onClick={() => sounds.like()}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-[#ff2d95]/20 border border-white/10 text-white"
                >
                  ❤️ Synth Chord
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
                  🔊 Sine Tick
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MP3 UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00e5ff]" />
                Upload Audio Track
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
                  placeholder="e.g. Synth Horizon"
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
                  <option value="Gaming Ambient" className="bg-[#0a0a1a]">Gaming Ambient</option>
                </select>
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
                  ⚡ Add Track to Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};