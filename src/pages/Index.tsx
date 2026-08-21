import React, { useState, useEffect } from 'react';
import { WevidsProvider, useWevids } from '../context/WevidsContext';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { ShortsFeedView } from '../components/clips/ShortsFeedView';
import { DualFeedView } from '../components/feed/DualFeedView';
import { FileDropVaultView } from '../components/files/FileDropVaultView';
import { AiHubView } from '../components/ai/AiHubView';
import { GamingHubView } from '../components/gaming/GamingHubView';
import { AudioHubView } from '../components/audio/AudioHubView';
import { FilmsHubView } from '../components/films/FilmsHubView';
import { RomVaultView } from '../components/roms/RomVaultView';
import { WevidsMallView } from '../components/mall/WevidsMallView';
import { MessagesView } from '../components/messages/MessagesView';
import { LiveStreamView } from '../components/live/LiveStreamView';
import { ProfileView } from '../components/profile/ProfileView';
import { BookmarksView } from '../components/bookmarks/BookmarksView';
import { VideoCallModal } from '../components/modals/VideoCallModal';
import { ShareModal } from '../components/modals/ShareModal';
import { UserProfileModal } from '../components/modals/UserProfileModal';
import { SupabaseConnectModal } from '../components/modals/SupabaseConnectModal';

const MainContent: React.FC = () => {
  const { activeView } = useWevids();
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Mouse coordinate tracker for dynamic liquid glass specular reflections
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#050512] text-[#f1f1fc] relative overflow-x-hidden selection:bg-[#ff2d95]/40 selection:text-[#00e5ff]">
      {/* Background Liquid Metaballs & Optics */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-5vw] left-[-5vw] w-[48vw] h-[48vw] rounded-full bg-gradient-to-br from-[#ff2d95]/30 via-[#c026d3]/20 to-transparent blur-[90px] animate-liquid-blob-1 opacity-80" 
        />
        <div 
          className="absolute bottom-[-5vw] right-[-5vw] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-[#00e5ff]/35 via-[#3b82f6]/25 to-transparent blur-[100px] animate-liquid-blob-2 opacity-80" 
        />
        <div 
          className="absolute top-[35%] left-[25%] w-[38vw] h-[38vw] rounded-full bg-gradient-to-tr from-[#9333ea]/25 via-[#4f46e5]/15 to-transparent blur-[110px] animate-liquid-blob-3 opacity-60" 
        />
        <div 
          className="absolute bottom-[20%] left-[10%] w-[28vw] h-[28vw] rounded-full bg-gradient-to-r from-[#fbbf24]/15 to-[#ff2d95]/15 blur-[80px] animate-liquid-blob-1 opacity-50" 
        />
        <div 
          className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]"
        />
      </div>

      <Sidebar />

      <div className="relative z-10">
        <TopHeader onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)} />

        <main className="md:ml-64 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
          {activeView === 'clips' && <ShortsFeedView />}
          {activeView === 'feed' && <DualFeedView />}
          {activeView === 'films' && <FilmsHubView />}
          {activeView === 'audio' && <AudioHubView />}
          {activeView === 'gaming' && <GamingHubView />}
          {activeView === 'files' && <FileDropVaultView />}
          {activeView === 'explore' && <ShortsFeedView />}
          {activeView === 'aihub' && <AiHubView />}
          {activeView === 'roms' && <RomVaultView />}
          {activeView === 'mall' && <WevidsMallView />}
          {activeView === 'messages' && <MessagesView />}
          {activeView === 'live' && <LiveStreamView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'bookmarks' && <BookmarksView />}
        </main>
      </div>

      <VideoCallModal />
      <ShareModal />
      <UserProfileModal />
      <SupabaseConnectModal 
        isOpen={isSupabaseModalOpen} 
        onClose={() => setIsSupabaseModalOpen(false)} 
      />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <WevidsProvider>
      <MainContent />
    </WevidsProvider>
  );
};

export default Index;