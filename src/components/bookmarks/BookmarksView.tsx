import React from 'react';
import { useWevids } from '../../context/WevidsContext';
import { Bookmark, Sparkles, FolderHeart, Play, ExternalLink } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const BookmarksView: React.FC = () => {
  const { collections, setActiveView } = useWevids();

  return (
    <div className="space-y-6 pb-20">
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24]/30 text-[#fbbf24] font-bold text-xs mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            <span>SAVED VAULT & PLAYLISTS</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Bookmarks & Library
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Quickly access your pinned HyperOS ROM packages, favorite vertical clips, and long video tutorials.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {collections.map((col) => (
          <div key={col.id} className="liquid-glass-card rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="font-orbitron font-bold text-base text-white flex items-center gap-2">
                <span>{col.icon}</span>
                <span>{col.name}</span>
                <span className="text-xs text-[#8a8aa8]">({col.items.length} items)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {col.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sounds.click();
                    if (item.type === 'rom') setActiveView('roms');
                    else setActiveView('feed');
                  }}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs text-[#00e5ff] font-orbitron">
                    <span className="uppercase">{item.type}</span>
                    <span className="text-[#8a8aa8] text-[10px]">{item.addedAt}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-[#ff2d95] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#8a8aa8]">{item.preview}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};