import React from 'react';
import { useWevids } from '../context/WevidsContext';
import { FeedView } from '../components/feed/FeedView';
import { ClipsView } from '../components/clips/ClipsView';
import { ExploreView } from '../components/explore/ExploreView';
import { FilesView } from '../components/files/FilesView';
import { AiHubView } from '../components/aihub/AiHubView';
import { GamingView } from '../components/gaming/GamingView';
import { AudioView } from '../components/audio/AudioView';
import { FilmsView } from '../components/films/FilmsView';
import { LiveView } from '../components/live/LiveView';
import { RomsView } from '../components/roms/RomsView';
import { MallView } from '../components/mall/MallView';
import { MessagesView } from '../components/messages/MessagesView';
import { BookmarksView } from '../components/bookmarks/BookmarksView';
import { ProfileView } from '../components/profile/ProfileView';
import { AdminConsole } from '../components/admin/AdminConsole';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { UserProfileModal } from '../components/modals/UserProfileModal';

export const Index: React.FC = () => {
  const { activeView } = useWevids();

  return (
    <div className="min-h-screen bg-[#070712] text-white flex flex-col font-sans selection:bg-[#00e5ff] selection:text-slate-900">
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-2 sm:px-4 gap-4 pt-16 pb-16 md:pb-0">
        <Sidebar />

        <main className="flex-1 min-w-0 pt-2">
          {activeView === 'feed' && <FeedView />}
          {activeView === 'clips' && <ClipsView />}
          {activeView === 'explore' && <ExploreView />}
          {activeView === 'files' && <FilesView />}
          {activeView === 'aihub' && <AiHubView />}
          {activeView === 'gaming' && <GamingView />}
          {activeView === 'audio' && <AudioView />}
          {activeView === 'films' && <FilmsView />}
          {activeView === 'live' && <LiveView />}
          {activeView === 'roms' && <RomsView />}
          {activeView === 'mall' && <MallView />}
          {activeView === 'messages' && <MessagesView />}
          {activeView === 'bookmarks' && <BookmarksView />}
          {activeView === 'profile' && <ProfileView />}
          {activeView === 'admin' && <AdminConsole />}
        </main>
      </div>

      <BottomNav />
      <UserProfileModal />
    </div>
  );
};

export default Index;