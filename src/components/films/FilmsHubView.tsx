import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Clapperboard, 
  Star, 
  Upload, 
  Share2, 
  Tv
} from 'lucide-react';
import { FilmItem } from '../../types/wevids';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const FilmsHubView: React.FC = () => {
  const { 
    films, 
    addFilm, 
    openShareModal, 
    currentUser 
  } = useWevids();
  
  const [selectedFilmId, setSelectedFilmId] = useState<string>(films[0]?.id || '');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [director, setDirector] = useState(currentUser.name);
  const [genre, setGenre] = useState<FilmItem['genre']>('Cyberpunk Sci-Fi');
  const [releaseYear, setReleaseYear] = useState(2026);
  const [duration, setDuration] = useState('1h 45m');
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
  const [posterUrl, setPosterUrl] = useState('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80');

  const genres = ['All', 'Cyberpunk Sci-Fi', 'Anime Cinema', 'Tech Documentary', 'Gaming Lore', 'Open Source Action'];

  const selectedFilm = films.find(f => f.id === selectedFilmId) || films[0];

  const filteredFilms = films.filter(f => 
    selectedGenre === 'All' || f.genre === selectedGenre
  );

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoUrl) {
      toast.error('Please enter film title and video stream source');
      return;
    }

    addFilm({
      title,
      synopsis,
      director: director || currentUser.name,
      genre,
      releaseYear: Number(releaseYear) || 2026,
      duration: duration || '1h 30m',
      videoUrl,
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      rating: 5.0
    });

    setIsUploadOpen(false);
    setTitle('');
    setSynopsis('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff2d95]/20 border border-[#ff2d95]/30 text-[#ff2d95] font-bold text-xs mb-2">
            <Clapperboard className="w-3.5 h-3.5" />
            <span>4K CINEMA & DOCUMENTARY STAGE</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Cinema & Feature Films
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Full-length cyberpunk movies, open source documentaries, and community cinematic releases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.pop();
              setIsCinemaMode(!isCinemaMode);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold border transition-all ${
              isCinemaMode ? 'bg-[#ff2d95] text-slate-900 border-[#ff2d95]' : 'bg-white/5 text-white border-white/10'
            }`}
          >
            <Tv className="w-4 h-4 inline mr-1.5" />
            {isCinemaMode ? 'Exit Cinema' : 'Theater Mode'}
          </button>

          <button
            onClick={() => {
              sounds.pop();
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-lg hover:scale-105 transition-transform"
          >
            <Upload className="w-4 h-4" />
            <span>PREMIERE FILM</span>
          </button>
        </div>
      </div>

      {/* Hero Cinema Feature Player */}
      {selectedFilm && (
        <div className={`rounded-3xl overflow-hidden liquid-glass border border-white/20 shadow-2xl transition-all ${isCinemaMode ? 'p-2 bg-black' : 'p-6'}`}>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            <video
              src={selectedFilm.videoUrl}
              poster={selectedFilm.backdropUrl || selectedFilm.posterUrl}
              controls
              autoPlay={false}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="pt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff2d95]/20 text-[#ff2d95] text-[10px] font-orbitron font-bold border border-[#ff2d95]/40">
                    {selectedFilm.genre}
                  </span>
                  <span className="text-xs text-[#8a8aa8]">{selectedFilm.releaseYear} · {selectedFilm.duration}</span>
                </div>
                <h2 className="text-2xl font-bold font-orbitron text-white">{selectedFilm.title}</h2>
                <div className="text-xs text-[#00e5ff]">Directed by {selectedFilm.director}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[#fbbf24] px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-orbitron font-bold text-sm">{selectedFilm.rating}</span>
                </div>
                <button
                  onClick={() => openShareModal(selectedFilm.title, `https://wevids.app/films/${selectedFilm.id}`)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-[#e8e8f4] max-w-3xl leading-relaxed">{selectedFilm.synopsis}</p>
          </div>
        </div>
      )}

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => {
              sounds.click();
              setSelectedGenre(g);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGenre === g
                ? 'bg-[#ff2d95] text-slate-900 font-bold shadow-md'
                : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Film Catalog Grid */}
      {filteredFilms.length === 0 ? (
        <div className="liquid-glass rounded-3xl p-12 border border-white/10 text-center space-y-3 shadow-xl">
          <Clapperboard className="w-12 h-12 text-[#ff2d95] mx-auto opacity-50 animate-pulse" />
          <h3 className="font-orbitron font-bold text-base text-white">No feature films premiered yet</h3>
          <p className="text-xs text-[#8a8aa8] max-w-sm mx-auto">
            Click "Premiere Film" to add a full 4K stream or trailer to the cinema schedule.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFilms.map((film) => {
            const isSelected = film.id === selectedFilmId;
            return (
              <div
                key={film.id}
                onClick={() => {
                  sounds.click();
                  setSelectedFilmId(film.id);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`liquid-glass-card rounded-3xl overflow-hidden border cursor-pointer group transition-all ${
                  isSelected ? 'border-[#00e5ff] ring-2 ring-[#00e5ff]/30 scale-102' : 'border-white/10 hover:border-[#ff2d95]'
                }`}
              >
                <div className="relative aspect-[3/4] bg-black overflow-hidden">
                  <img
                    src={film.posterUrl}
                    alt={film.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between text-[10px] text-[#fbbf24] mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md font-orbitron">{film.genre}</span>
                      <span className="flex items-center gap-1 font-bold">★ {film.rating}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[#00e5ff] transition-colors">
                      {film.title}
                    </h3>
                    <div className="text-[11px] text-[#8a8aa8]">{film.duration} · {film.releaseYear}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Film Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-white/20 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                <Clapperboard className="w-4 h-4 text-[#ff2d95]" />
                Premiere New Feature Film
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-xs text-[#8a8aa8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Film Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neon Ghost Cyberpunk"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Synopsis & Plot</label>
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  rows={3}
                  placeholder="Brief story outline..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Director</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 1h 45m"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Genre Category</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                >
                  <option value="Cyberpunk Sci-Fi" className="bg-[#0a0a1a]">Cyberpunk Sci-Fi</option>
                  <option value="Anime Cinema" className="bg-[#0a0a1a]">Anime Cinema</option>
                  <option value="Tech Documentary" className="bg-[#0a0a1a]">Tech Documentary</option>
                  <option value="Gaming Lore" className="bg-[#0a0a1a]">Gaming Lore</option>
                  <option value="Open Source Action" className="bg-[#0a0a1a]">Open Source Action</option>
                </select>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Video Stream URL (MP4)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-[#8a8aa8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold shadow-md"
                >
                  ⚡ Premiere Film
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};