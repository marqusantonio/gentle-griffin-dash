import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWevids } from '../../context/WevidsContext';
import {
  Search,
  X,
  User,
  FileText,
  Film,
  Cpu,
  FolderDown,
  Clapperboard,
  Music,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

type SearchTab = 'all' | 'people' | 'posts' | 'clips' | 'roms' | 'files' | 'films' | 'audio' | 'products';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const {
    allUsers,
    posts,
    clips,
    roms,
    files,
    films,
    audioTracks,
    products,
    currentUser,
    openUserProfileModal,
    setActiveView,
  } = useWevids();

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();

  const filterByText = (...fields: (string | undefined | null)[]) => {
    if (!normalizedQuery) return true;
    return fields.some((field) =>
      field ? field.toLowerCase().includes(normalizedQuery) : false
    );
  };

  const searchResults = useMemo(() => {
    const people = Object.values(allUsers || {}).filter(
      (u) =>
        u &&
        u.id !== currentUser?.id &&
        filterByText(u.name, u.handle, u.bio, u.location)
    );

    const postResults = (posts || []).filter((p) =>
      filterByText(p.content, p.authorName, p.authorHandle, p.tags?.join(' '))
    );

    const clipResults = (clips || []).filter((c) =>
      filterByText(c.title, c.description, c.audioTrack)
    );

    const romResults = (roms || []).filter((r) =>
      filterByText(r.title, r.device, r.brand, r.maintainer, r.version)
    );

    const fileResults = (files || []).filter((f) =>
      filterByText(f.title, f.fileName, f.category, f.uploaderName)
    );

    const filmResults = (films || []).filter((f) =>
      filterByText(f.title, f.director, f.genre, f.synopsis)
    );

    const audioResults = (audioTracks || []).filter((a) =>
      filterByText(a.title, a.artist, a.genre)
    );

    const productResults = (products || []).filter((p) =>
      filterByText(p.title, p.category, p.creatorName, p.description)
    );

    return {
      people,
      posts: postResults,
      clips: clipResults,
      roms: romResults,
      files: fileResults,
      films: filmResults,
      audio: audioResults,
      products: productResults,
    };
  }, [allUsers, posts, clips, roms, files, films, audioTracks, products, currentUser, normalizedQuery]);

  const totalCount =
    searchResults.people.length +
    searchResults.posts.length +
    searchResults.clips.length +
    searchResults.roms.length +
    searchResults.files.length +
    searchResults.films.length +
    searchResults.audio.length +
    searchResults.products.length;

  const tabs: { id: SearchTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'people', label: 'People', count: searchResults.people.length },
    { id: 'posts', label: 'Posts', count: searchResults.posts.length },
    { id: 'clips', label: 'Clips', count: searchResults.clips.length },
    { id: 'roms', label: 'ROMs', count: searchResults.roms.length },
    { id: 'files', label: 'Files', count: searchResults.files.length },
    { id: 'films', label: 'Films', count: searchResults.films.length },
    { id: 'audio', label: 'Audio', count: searchResults.audio.length },
    { id: 'products', label: 'Mall', count: searchResults.products.length },
  ];

  const handlePersonClick = (user: any) => {
    sounds.click();
    openUserProfileModal(user);
    onClose();
  };

  const handleContentView = (view: any) => {
    sounds.click();
    setActiveView(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl liquid-glass rounded-3xl border border-white/20 shadow-[0_0_80px_rgba(0,229,255,0.3)] overflow-hidden flex flex-col max-h-[80vh] animate-spring-pop">
        {/* Search Input */}
        <div className="p-5 border-b border-white/10 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00e5ff]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search creators, posts, ROMs, clips, audio, films..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-black/50 border border-white/15 text-sm text-white placeholder-[#8a8aa8] focus:outline-none focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/25"
            />
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#8a8aa8] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.click();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-950 shadow-md'
                    : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none">
          {totalCount === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-[#00e5ff] mx-auto opacity-40 animate-pulse" />
              <p className="text-xs text-[#8a8aa8]">No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* People */}
              {(activeTab === 'all' || activeTab === 'people') && searchResults.people.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-[#00e5ff] uppercase tracking-wider">
                    Creators
                  </div>
                  {searchResults.people.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handlePersonClick(user)}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shrink-0"
                        style={{ background: user.color }}
                      >
                        {user.avatarImage ? (
                          <img src={user.avatarImage} alt="avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          user.avatar || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{user.name}</div>
                        <div className="text-[10px] text-[#8a8aa8] truncate">{user.handle}</div>
                      </div>
                      <User className="w-4 h-4 text-[#00e5ff]" />
                    </button>
                  ))}
                </>
              )}

              {/* Posts */}
              {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-[#ff2d95] uppercase tracking-wider">
                    Posts
                  </div>
                  {searchResults.posts.slice(0, activeTab === 'all' ? 4 : 20).map((post) => (
                    <button
                      key={post.id}
                      onClick={() => handleContentView('feed')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-[#ff2d95]/20 text-[#ff2d95] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{post.authorName}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{post.content}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Clips */}
              {(activeTab === 'all' || activeTab === 'clips') && searchResults.clips.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-pink-400 uppercase tracking-wider">
                    Shorts & Clips
                  </div>
                  {searchResults.clips.slice(0, activeTab === 'all' ? 3 : 20).map((clip) => (
                    <button
                      key={clip.id}
                      onClick={() => handleContentView('clips')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{clip.title}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{clip.description}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* ROMs */}
              {(activeTab === 'all' || activeTab === 'roms') && searchResults.roms.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-[#10b981] uppercase tracking-wider">
                    ROM & Kernel Vault
                  </div>
                  {searchResults.roms.slice(0, activeTab === 'all' ? 3 : 20).map((rom) => (
                    <button
                      key={rom.id}
                      onClick={() => handleContentView('roms')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-[#10b981]/20 text-[#10b981] shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{rom.title}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{rom.device} · {rom.version}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Files */}
              {(activeTab === 'all' || activeTab === 'files') && searchResults.files.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-[#00e5ff] uppercase tracking-wider">
                    File Vault
                  </div>
                  {searchResults.files.slice(0, activeTab === 'all' ? 3 : 20).map((file) => (
                    <button
                      key={file.id}
                      onClick={() => handleContentView('files')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] shrink-0">
                        <FolderDown className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{file.title}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{file.fileName} · {file.category}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Films */}
              {(activeTab === 'all' || activeTab === 'films') && searchResults.films.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-[#ff2d95] uppercase tracking-wider">
                    Cinema
                  </div>
                  {searchResults.films.slice(0, activeTab === 'all' ? 3 : 20).map((film) => (
                    <button
                      key={film.id}
                      onClick={() => handleContentView('films')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-[#ff2d95]/20 text-[#ff2d95] shrink-0">
                        <Clapperboard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{film.title}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{film.director} · {film.genre}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Audio */}
              {(activeTab === 'all' || activeTab === 'audio') && searchResults.audio.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-pink-400 uppercase tracking-wider">
                    Audio Engine
                  </div>
                  {searchResults.audio.slice(0, activeTab === 'all' ? 3 : 20).map((track) => (
                    <button
                      key={track.id}
                      onClick={() => handleContentView('audio')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{track.title}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{track.artist} · {track.genre}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Products */}
              {(activeTab === 'all' || activeTab === 'products') && searchResults.products.length > 0 && (
                <>
                  <div className="px-2 pt-2 text-[10px] font-orbitron font-bold text-[#fbbf24] uppercase tracking-wider">
                    Digital Mall
                  </div>
                  {searchResults.products.slice(0, activeTab === 'all' ? 3 : 20).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleContentView('mall')}
                      className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-[#fbbf24]/20 text-[#fbbf24] shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{product.title}</div>
                        <p className="text-[11px] text-[#8a8aa8] truncate">{product.category} · ${product.price}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};