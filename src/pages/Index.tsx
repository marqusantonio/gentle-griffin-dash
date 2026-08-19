import React from 'react';
import { WevidsProvider, useWevids } from '../context/WevidsContext';
import { Sidebar } from '../components/layout/Sidebar';
import { TopHeader } from '../components/layout/TopHeader';
import { DualFeedView } from '../components/feed/DualFeedView';
import { AiHubView } from '../components/ai/AiHubView';
import { GamingHubView } from '../components/gaming/GamingHubView';
import { RomVaultView } from '../components/roms/RomVaultView';
import { WevidsMallView } from '../components/mall/WevidsMallView';
import { MessagesView } from '../components/messages/MessagesView';
import { LiveStreamView } from '../components/live/LiveStreamView';
import { ProfileView } from '../components/profile/ProfileView';
import { BookmarksView } from '../components/bookmarks/BookmarksView';
import { VideoCallModal } from '../components/modals/VideoCallModal';
import { ShareModal } from '../components/modals/ShareModal';

const MainContent: React.FC = () => {
  const { activeView } = useWevids();

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-[#e8e8f4] relative overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="fixed top-[-10vw] left-[-10vw] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-[#ff2d95]/15 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10vw] right-[-10vw] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tl from-[#00e5ff]/15 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="relative z-10">
        <TopHeader />

        <main className="ml-64 p-6 md:p-8 max-w-7xl mx-auto">
          {activeView === 'feed' && <DualFeedView />}
          {activeView === 'explore' && <DualFeedView />}
          {activeView === 'aihub' && <AiHubView />}
          {activeView === 'gaming' && <GamingHubView />}
          {activeView === 'roms' && <RomVaultView />}
          {activeView === 'mall' && <WevidsMallView />}
          {activeView === 'messages' && <MessagesView />}
          {activeView === 'live' && <LiveStreamView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'bookmarks' && <BookmarksView />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <VideoCallModal />
      <ShareModal />
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