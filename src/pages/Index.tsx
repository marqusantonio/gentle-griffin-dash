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
import { PerformanceModeModal } from '../components/modals/PerformanceModeModal';
import { toast } from 'sonner';

const MainContent: React.FC = () => {
  const { activeView } = useWevids();
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isPerfModalOpen, setIsPerfModalOpen] = useState(false);
  
  // Performance mode state: entry (default fast, no blur lag) vs highend (liquid glass)
  const [perfMode, setPerfMode] = useState<'entry' | 'highend'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wevids_perf_mode');
      if (saved === 'highend' || saved === 'entry') return saved;
    }
    return 'entry'; // Default to Entry/Midrange for instant smooth 60fps on all devices
  });

  // Apply performance mode class to body
  useEffect(() => {
    document.body.classList.remove('perf-entry', 'perf-highend');
    document.body.classList.add(`perf-${perfMode}`);
    localStorage.setItem('wevids_perf_mode', perfMode);
  }, [perfMode]);

  // Show performance modal on first visit if not selected before
  useEffect(() => {
    const hasChosen = localStorage.getItem('wevids_perf_mode_chosen');
    if (!hasChosen) {
      setIsPerfModalOpen(true);
      localStorage.setItem('wevids_perf_mode_chosen', 'true');
    }
  }, []);

  const handleTogglePerfMode = () => {
    const next = perfMode === 'entry' ? 'highend' : 'entry';
    setPerfMode(next);
    if (next === 'entry') {
      toast.success('⚡ Switched to Entry/Midrange Mode (Fast 60-120 FPS)!');
    } else {
      toast.success('💎 Switched to High-End Mode (Liquid Glass Pro)!');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050512] text-[#f1f1fc] relative overflow-x-hidden selection:bg-[#ff2d95]/40 selection:text-[#00e5ff]">
      {/* Background Layer (hidden automatically in Entry Mode) */}
      <div className="bg-blobs-layer fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute top-[-5vw] left-[-5vw] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-[#ff2d95]/20 via-[#c026d3]/15 to-transparent blur-[70px] animate-liquid-blob-1 opacity-70" 
        />
        <div 
          className="absolute bottom-[-5vw] right-[-5vw] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tl from-[#00e5ff]/25 via-[#3b82f6]/15 to-transparent blur-[70px] animate-liquid-blob-2 opacity-70" 
        />
      </div>

      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Right Side Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen md:pl-64 w-full">
        <TopHeader 
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenPerfModal={() => setIsPerfModalOpen(true)}
          perfMode={perfMode}
          onTogglePerfMode={handleTogglePerfMode}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
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
      <PerformanceModeModal
        isOpen={isPerfModalOpen}
        onClose={() => setIsPerfModalOpen(false)}
        currentMode={perfMode}
        onSelectMode={(mode) => setPerfMode(mode)}
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