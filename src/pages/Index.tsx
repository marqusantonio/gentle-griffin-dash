import React from 'react';
import { useWevids } from '../context/WevidsContext';
import { DualFeedView } from '../components/feed/DualFeedView';
import { ShortsFeedView } from '../components/clips/ShortsFeedView';
import { ExploreView } from '../components/explore/ExploreView';
import { FileDropVaultView } from '../components/files/FileDropVaultView';
import { AiHubView } from '../components/ai/AiHubView';
import { GamingHubView } from '../components/gaming/GamingHubView';
import { AudioHubView } from '../components/audio/AudioHubView';
import { FilmsHubView } from '../components/films/FilmsHubView';
import { LiveStreamView } from '../components/live/LiveStreamView';
import { RomVaultView } from '../components/roms/RomVaultView';
import { WevidsMallView } from '../components/mall/WevidsMallView';
import { MessagesView } from '../components/messages/MessagesView';
import { BookmarksView } from '../components/bookmarks/BookmarksView';
import { ProfileView } from '../components/profile/ProfileView';
import { AdminConsole } from '../components/admin/AdminConsole';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { BottomNav } from '../components/layout/BottomNav';
import { UserProfileModal } from '../components/modals/UserProfileModal';
import { SupabaseConnectModal } from '../components/modals/SupabaseConnectModal';
import { PerformanceModeModal } from '../components/modals/PerformanceModeModal';
import { VideoCallModal } from '../components/modals/VideoCallModal';
import { ShareModal } from '../components/modals/ShareModal';
import { GubbyEasterEggModal } from '../components/modals/GubbyEasterEggModal';

export const Index: React.FC = () => {
  const { 
    activeView, 
    isSupabaseModalOpen, 
    setIsSupabaseModalOpen,
    isEasterEggOpen,
    setIsEasterEggOpen
  } = useWevids();

  const [perfMode, setPerfMode] = React.useState<'entry' | 'highend'>('highend');
  const [isPerfModalOpen, setIsPerfModalOpen] = React.useState(false);

  React.useEffect(() => {
    document.body.classList.remove('perf-entry', 'perf-highend');
    document.body.classList.add(`perf-${perfMode}`);
  }, [perfMode]);

  return (
    <div className="min-h-screen bg-[#050512] text-[#f1f1fc] flex flex-col font-sans selection:bg-[#00e5ff] selection:text-slate-900 relative overflow-x-hidden">
      
      {/* Background Animated Glow Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-blobs-layer">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#ff2d95]/15 blur-[120px] animate-liquid-blob-1" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-[#00e5ff]/15 blur-[140px] animate-liquid-blob-2" />
      </div>

      <TopHeader
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenPerfModal={() => setIsPerfModalOpen(true)}
        perfMode={perfMode}
        onTogglePerfMode={() => setPerfMode(m => m === 'entry' ? 'highend' : 'entry')}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 gap-4 pt-4 pb-20 md:pb-6 relative z-10">
        <Sidebar />

        <main className="flex-1 min-w-0">
          {activeView === 'feed' && <DualFeedView />}
          {activeView === 'clips' && <ShortsFeedView />}
          {activeView === 'explore' && <ExploreView />}
          {activeView === 'files' && <FileDropVaultView />}
          {activeView === 'aihub' && <AiHubView />}
          {activeView === 'gaming' && <GamingHubView />}
          {activeView === 'audio' && <AudioHubView />}
          {activeView === 'films' && <FilmsHubView />}
          {activeView === 'live' && <LiveStreamView />}
          {activeView === 'roms' && <RomVaultView />}
          {activeView === 'mall' && <WevidsMallView />}
          {activeView === 'messages' && <MessagesView />}
          {activeView === 'bookmarks' && <BookmarksView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'admin' && <AdminConsole />}
        </main>
      </div>

      <BottomNav />

      {/* Modals & Overlays */}
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
      <VideoCallModal />
      <ShareModal />
      <GubbyEasterEggModal
        isOpen={isEasterEggOpen}
        onClose={() => setIsEasterEggOpen(false)}
      />
    </div>
  );
};

export default Index;