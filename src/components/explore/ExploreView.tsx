import React, { useState } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { Compass, Sparkles, TrendingUp, Search, Film, Cpu, Gamepad2, UserPlus, Heart } from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const ExploreView: React.FC = () => {
  const { posts, clips, allUsers, openUserProfileModal, toggleFollowUser, isFollowing, setActiveView } = useWevids();
  const [searchQuery, setSearchQuery] = useState('');

  const trendingTags = [
    { tag: '#HyperOS', postsCount: '1.4k' },
    { tag: '#SnapdragonGen3', postsCount: '980' },
    { tag: '#Cyberpunk2077', postsCount: '2.1k' },
    { tag: '#AIVideo', postsCount: '3.4k' },
    { tag: '#OpenSource', postsCount: '870' },
    { tag: '#KernelOverclock', postsCount: '620' }
  ];

  const featuredCreators = Object.values(allUsers || {}).slice(0, 6);

  const matchingPosts = (posts || []).filter(p => 
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>GLOBAL DISCOVERY RADAR</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Explore Trending Content & Creators
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Discover popular HyperOS ROM releases, viral shorts, AI video renders, and top community modders.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8aa8]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topics, creators, ROM builds, or clips..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-[#8a8aa8] focus:border-[#00e5ff] focus:outline-none"
        />
      </div>

      {/* Trending Topics Grid */}
      <div className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3">
        <div className="font-orbitron font-bold text-xs text-[#00e5ff] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ff2d95]" />
          TRENDING TOPICS & HASHTAGS
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {trendingTags.map((item) => (
            <div
              key={item.tag}
              onClick={() => {
                sounds.click();
                setActiveView('feed');
              }}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all space-y-1"
            >
              <div className="font-bold text-xs text-white">{item.tag}</div>
              <div className="text-[10px] text-[#8a8aa8]">{item.postsCount} posts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Creators Row */}
      <div className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3">
        <div className="font-orbitron font-bold text-xs text-[#fbbf24] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00e5ff]" />
          FEATURED COMMUNITY MODDERS & CREATORS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {featuredCreators.map((creator) => (
            <div
              key={creator.id}
              className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 hover:border-white/20 transition-all"
            >
              <div 
                onClick={() => openUserProfileModal(creator)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs shrink-0"
                  style={{ background: creator.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
                >
                  {creator.avatar || 'C'}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-white truncate">{creator.name}</div>
                  <div className="text-[10px] text-[#8a8aa8] truncate">{creator.handle}</div>
                </div>
              </div>

              <button
                onClick={() => toggleFollowUser(creator.id)}
                className="px-3 py-1.5 rounded-xl bg-[#00e5ff]/20 text-[#00e5ff] font-orbitron font-bold text-[10px] hover:bg-[#00e5ff] hover:text-slate-900 transition-colors"
              >
                {isFollowing(creator.id) ? 'Following' : '+ Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Matching Posts Grid */}
      <div className="space-y-3">
        <div className="font-orbitron font-bold text-xs text-white">
          DISCOVER POSTS ({matchingPosts.length})
        </div>

        <div className="space-y-3">
          {matchingPosts.slice(0, 8).map((post) => (
            <div key={post.id} className="p-4 rounded-3xl liquid-glass-card border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#8a8aa8]">
                <span className="font-bold text-white">{post.authorName} ({post.authorHandle})</span>
                <span className="text-[10px]">{post.time}</span>
              </div>
              <p className="text-white/90 leading-relaxed">{post.content}</p>
              {post.mediaUrl && (
                <img src={post.mediaUrl} alt="Media" className="rounded-2xl max-h-60 w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};