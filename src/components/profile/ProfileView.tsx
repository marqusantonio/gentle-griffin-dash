import React, { useState, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Edit3, 
  Camera, 
  Music2, 
  Play, 
  Pause, 
  FileText, 
  Film, 
  Trash2, 
  Heart, 
  ShieldBan, 
  UserX, 
  AlertTriangle, 
  Settings 
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const ProfileView: React.FC = () => {
  const { 
    currentUser, 
    updateCurrentUser, 
    posts, 
    clips, 
    deletePost, 
    unblockUser, 
    deactivateAccount, 
    deleteAccount, 
    allUsers 
  } = useWevids();

  const [isEditing, setIsEditing] = useState(false);
  const [profileTab, setProfileTab] = useState<'posts' | 'media' | 'settings'>('posts');

  const [name, setName] = useState(currentUser?.name || 'Guest Creator');
  const [handle, setHandle] = useState(currentUser?.handle || '@guest');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || 'Earth Node');
  const [pronouns, setPronouns] = useState(currentUser?.pronouns || 'they/them');
  const [bioAudioTitle, setBioAudioTitle] = useState(currentUser?.bioAudioTitle || 'Ambient Neon Theme');

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const myPosts = (posts || []).filter(p => p.userId === currentUser?.id || (currentUser?.isGuest && p.userId === 'guest'));
  const myMediaPosts = myPosts.filter(p => Boolean(p.mediaUrl));
  const myClips = (clips || []).filter(c => c.userId === currentUser?.id);

  const blockedUserIds = currentUser?.blockedUserIds || [];

  const followerCount = currentUser?.follower_count ?? currentUser?.followers ?? 0;
  const followingCount = currentUser?.following_count ?? currentUser?.following ?? 0;
  const likesCount = currentUser?.likes_count ?? currentUser?.likes ?? myPosts.reduce((acc, p) => acc + (Number(p.likes) || 0), 0);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      updateCurrentUser({ avatarImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleToggleBioAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
      sounds.pop();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({ name, handle, bio, location, pronouns, bioAudioTitle });
    setIsEditing(false);
    sounds.success();
    toast.success('Profile saved!');
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="rounded-3xl liquid-glass border border-white/15 overflow-hidden shadow-2xl">
        <div className="h-44 bg-gradient-to-r from-[#ff2d95]/40 via-[#9333ea]/30 to-[#00e5ff]/40 relative flex items-end p-6">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold text-white hover:bg-[#ff2d95] transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 mb-4">
            <div className="relative group">
              <div
                className="w-28 h-28 rounded-full border-4 border-[#0a0a1a] shadow-2xl flex items-center justify-center font-bold text-slate-900 text-3xl overflow-hidden"
                style={{ background: currentUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)' }}
              >
                {currentUser?.avatarImage ? (
                  <img src={currentUser.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.avatar || 'G'
                )}
              </div>

              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-[#ff2d95] text-slate-900 cursor-pointer shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            {/* Live DB Aggregate Counters */}
            <div className="flex items-center gap-4">
              <div className="text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                <div className="font-orbitron font-bold text-base text-[#00e5ff]">
                  {followerCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-semibold">Followers</div>
              </div>

              <div className="text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                <div className="font-orbitron font-bold text-base text-[#ff2d95]">
                  {followingCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-semibold">Following</div>
              </div>

              <div className="text-center p-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                <div className="font-orbitron font-bold text-base text-[#fbbf24] flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>{likesCount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-[#8a8aa8] uppercase font-semibold">Likes</div>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-orbitron text-white">{currentUser?.name || 'Creator'}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-bold border border-[#00e5ff]/30">
                    VERIFIED NODE
                  </span>
                </div>
                <div className="text-xs text-[#8a8aa8] mt-0.5">
                  {currentUser?.handle || '@guest'} · {currentUser?.pronouns || 'they/them'} · {currentUser?.location || 'Earth Node'}
                </div>
              </div>

              {currentUser?.bioAudioUrl && (
                <div className="p-3 rounded-2xl bg-white/5 border border-[#00e5ff]/30 flex items-center justify-between max-w-md">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleToggleBioAudio}
                      className="w-8 h-8 rounded-full bg-[#00e5ff] text-slate-900 flex items-center justify-center font-bold hover:scale-105 transition-transform"
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Music2 className="w-3.5 h-3.5 text-[#ff2d95]" />
                        <span>{currentUser?.bioAudioTitle || 'Bio Audio Track'}</span>
                      </div>
                      <div className="text-[10px] text-[#8a8aa8]">Featured Creator Audio</div>
                    </div>
                  </div>
                  <audio ref={audioRef} src={currentUser.bioAudioUrl} onEnded={() => setIsPlayingAudio(false)} />
                </div>
              )}

              <p className="text-xs text-[#e8e8f4] max-w-2xl leading-relaxed pt-1">{currentUser?.bio || 'Exploring WEVIDS social ecosystem.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">@handle</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Pronouns</label>
                  <input
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-[#8a8aa8] font-bold block mb-1">Bio Music Title</label>
                  <input
                    type="text"
                    value={bioAudioTitle}
                    onChange={(e) => setBioAudioTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8a8aa8] font-bold block mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold"
              >
                Save Profile Updates
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { sounds.click(); setProfileTab('posts'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'posts'
              ? 'bg-[#00e5ff] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Posts ({myPosts.length})</span>
        </button>

        <button
          onClick={() => { sounds.click(); setProfileTab('media'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'media'
              ? 'bg-[#ff2d95] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Media Clips ({myMediaPosts.length + myClips.length})</span>
        </button>

        <button
          onClick={() => { sounds.click(); setProfileTab('settings'); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-orbitron font-bold transition-all ${
            profileTab === 'settings'
              ? 'bg-[#fbbf24] text-slate-900 shadow-md'
              : 'bg-white/5 text-[#8a8aa8] hover:text-white border border-white/10'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Account & Safety</span>
        </button>
      </div>

      {profileTab === 'posts' && (
        <div className="space-y-4">
          {myPosts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              You haven't posted any updates yet.
            </div>
          ) : (
            myPosts.map((post) => (
              <div
                key={post.id}
                className="liquid-glass rounded-3xl p-5 border border-white/10 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-xs"
                      style={{ background: currentUser?.color || '#00e5ff' }}
                    >
                      {currentUser?.avatar || 'U'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{currentUser?.name}</div>
                      <div className="text-[10px] text-[#8a8aa8]">{post.time}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 rounded-lg text-[#8a8aa8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-white/95 whitespace-pre-wrap">{post.content}</p>

                {post.mediaUrl && post.mediaType === 'image' && (
                  <img src={post.mediaUrl} alt="Attachment" className="rounded-2xl max-h-80 w-full object-cover" />
                )}

                {post.mediaUrl && post.mediaType === 'video' && (
                  <video src={post.mediaUrl} controls className="rounded-2xl max-h-80 w-full object-cover bg-black" />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {profileTab === 'media' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myMediaPosts.length === 0 && myClips.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#8a8aa8] bg-white/[0.02] rounded-3xl border border-white/5">
              No photos or video clips uploaded yet.
            </div>
          ) : (
            <>
              {myClips.map((clip) => (
                <div key={clip.id} className="rounded-2xl overflow-hidden bg-black border border-white/10 relative group aspect-[9/14]">
                  <video src={clip.videoUrl} controls className="w-full h-full object-cover" />
                </div>
              ))}
              {myMediaPosts.map((post) => (
                <div key={post.id} className="rounded-2xl overflow-hidden bg-black border border-white/10 relative group aspect-[9/14]">
                  {post.mediaType === 'video' ? (
                    <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={post.mediaUrl} alt="Media" className="w-full h-full object-cover" />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {profileTab === 'settings' && (
        <div className="space-y-6">
          <div className="liquid-glass rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
              <ShieldBan className="w-4 h-4 text-[#ff2d95]" />
              Blocked Accounts ({blockedUserIds.length})
            </h3>

            {blockedUserIds.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-[#8a8aa8] text-center">
                You haven't blocked any accounts.
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUserIds.map((id) => {
                  const u = allUsers[id];
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                          <UserX className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-white">{u?.name || id}</span>
                      </div>
                      <button
                        onClick={() => unblockUser(id)}
                        className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold text-[11px]"
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="liquid-glass rounded-3xl p-6 border border-red-500/20 space-y-4">
            <h3 className="font-orbitron font-bold text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Account Management
            </h3>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={deactivateAccount}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Deactivate Profile
              </button>

              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-orbitron font-bold text-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass rounded-3xl p-6 border border-red-500/40 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold font-orbitron text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm Account Deletion</span>
            </div>
            <p className="text-xs text-[#e8e8f4]">
              This action cannot be undone. All posts, media, and conversations will be wiped.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-orbitron font-bold text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
</dyad-file>

---

### Step 4: Update Context & Reducer to Hydrate Live DB Counts

<dyad-write path="src/context/wevidsReducer.ts" description="Updating wevidsReducer to update follower_count, following_count, and likes_count on profiles">
import { 
  PostItem, 
  ShortClipItem, 
  LongVideoItem, 
  RomItem, 
  ProductItem, 
  Conversation, 
  UserProfile, 
  CartItem, 
  SavedCollection, 
  SharedFileItem, 
  AudioTrackItem, 
  FilmItem,
  ViewName,
  DirectMessageItem,
  CommentItem,
  CommentReply
} from '../types/wevids';
import { 
  CURRENT_USER, 
  MOCK_USERS, 
  INITIAL_POSTS, 
  INITIAL_CLIPS, 
  INITIAL_LONG_VIDEOS, 
  INITIAL_ROMS, 
  INITIAL_PRODUCTS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_BOOKMARKS 
} from '../data/initialData';
import { INITIAL_AUDIO_TRACKS, INITIAL_FILMS, INITIAL_FILES } from '../data/mediaData';

export interface WevidsState {
  posts: PostItem[];
  clips: ShortClipItem[];
  longVideos: LongVideoItem[];
  roms: RomItem[];
  products: ProductItem[];
  files: SharedFileItem[];
  audioTracks: AudioTrackItem[];
  films: FilmItem[];
  conversations: Conversation[];
  directMessages: DirectMessageItem[];
  
  activeView: ViewName;
  activeConvId: string | null;
  activeCallUser: string | null;
  isCartOpen: boolean;
  isVideoCallOpen: boolean;
  activeShare: { title: string; url: string } | null;
  viewingProfileUser: UserProfile | null;
  isSupabaseModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  
  currentUser: UserProfile;
  allUsers: Record<string, UserProfile>;
  soundEnabled: boolean;
  cart: CartItem[];
  collections: SavedCollection[];
  isCloudSyncing: boolean;
  lastCloudSync: string | null;
}

export const initialWevidsState: WevidsState = {
  posts: INITIAL_POSTS,
  clips: INITIAL_CLIPS,
  longVideos: INITIAL_LONG_VIDEOS,
  roms: INITIAL_ROMS,
  products: INITIAL_PRODUCTS,
  files: INITIAL_FILES,
  audioTracks: INITIAL_AUDIO_TRACKS,
  films: INITIAL_FILMS,
  conversations: INITIAL_CONVERSATIONS,
  directMessages: [],
  activeView: 'feed',
  activeConvId: null,
  activeCallUser: null,
  isCartOpen: false,
  isVideoCallOpen: false,
  activeShare: null,
  viewingProfileUser: null,
  isSupabaseModalOpen: false,
  isMobileSidebarOpen: false,
  currentUser: CURRENT_USER,
  allUsers: MOCK_USERS,
  soundEnabled: true,
  cart: [],
  collections: INITIAL_BOOKMARKS,
  isCloudSyncing: false,
  lastCloudSync: null,
};

export type WevidsAction =
  | { type: 'SET_ACTIVE_VIEW'; payload: ViewName }
  | { type: 'SET_ACTIVE_CONV_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_CALL_USER'; payload: string | null }
  | { type: 'SET_IS_CART_OPEN'; payload: boolean }
  | { type: 'SET_IS_VIDEO_CALL_OPEN'; payload: boolean }
  | { type: 'OPEN_SHARE_MODAL'; payload: { title: string; url: string } }
  | { type: 'CLOSE_SHARE_MODAL' }
  | { type: 'OPEN_USER_PROFILE_MODAL'; payload: UserProfile }
  | { type: 'CLOSE_USER_PROFILE_MODAL' }
  | { type: 'SET_IS_SUPABASE_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_IS_MOBILE_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'UPDATE_CURRENT_USER'; payload: Partial<UserProfile> }
  | { type: 'SET_ALL_USERS'; payload: Record<string, UserProfile> }
  | { type: 'TOGGLE_FOLLOW_USER'; payload: { userId: string; isFollowing: boolean } }
  | { type: 'BLOCK_USER'; payload: { userId: string } }
  | { type: 'UNBLOCK_USER'; payload: { userId: string } }
  | { type: 'TOGGLE_POST_LIKE'; payload: { postId: string } }
  | { type: 'ADD_POST_COMMENT'; payload: { postId: string; comment: CommentItem } }
  | { type: 'TOGGLE_COMMENT_LIKE'; payload: { postId: string; commentId: string } }
  | { type: 'ADD_COMMENT_REPLY'; payload: { postId: string; commentId: string; reply: CommentReply } }
  | { type: 'TOGGLE_CLIP_LIKE'; payload: { clipId: string } }
  | { type: 'TOGGLE_CLIP_DISLIKE'; payload: { clipId: string } }
  | { type: 'TOGGLE_CLIP_BOOKMARK'; payload: { clipId: string } }
  | { type: 'ADD_CLIP_COMMENT'; payload: { clipId: string; comment: any } }
  | { type: 'ADD_MESSAGE'; payload: { convId: string; message: any } }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_DIRECT_MESSAGES'; payload: DirectMessageItem[] }
  | { type: 'SET_CONVERSATION_STATUS'; payload: { convId: string; status: 'active' | 'pending_request' | 'declined' | 'blocked' } }
  | { type: 'REMOVE_CONVERSATION'; payload: { convId: string } }
  | { type: 'ADD_TO_CART'; payload: { product: ProductItem } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'ADD_POST'; payload: PostItem }
  | { type: 'DELETE_POST'; payload: { postId: string } }
  | { type: 'SET_POSTS'; payload: PostItem[] }
  | { type: 'ADD_CLIP'; payload: ShortClipItem }
  | { type: 'DELETE_CLIP'; payload: { clipId: string } }
  | { type: 'SET_CLIPS'; payload: ShortClipItem[] }
  | { type: 'ADD_LONG_VIDEO'; payload: LongVideoItem }
  | { type: 'ADD_ROM'; payload: RomItem }
  | { type: 'SET_ROMS'; payload: RomItem[] }
  | { type: 'ADD_PRODUCT'; payload: ProductItem }
  | { type: 'SET_PRODUCTS'; payload: ProductItem[] }
  | { type: 'ADD_SHARED_FILE'; payload: SharedFileItem }
  | { type: 'SET_SHARED_FILES'; payload: SharedFileItem[] }
  | { type: 'ADD_AUDIO_TRACK'; payload: AudioTrackItem }
  | { type: 'SET_AUDIO_TRACKS'; payload: AudioTrackItem[] }
  | { type: 'ADD_FILM'; payload: FilmItem }
  | { type: 'SET_FILMS'; payload: FilmItem[] }
  | { type: 'SET_CLOUD_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_CLOUD_SYNC'; payload: string }
  | { type: 'PURGE_ACCOUNT' };

export const wevidsReducer = (state: WevidsState, action: WevidsAction): WevidsState => {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload, isMobileSidebarOpen: false };
    case 'SET_ACTIVE_CONV_ID':
      return { ...state, activeConvId: action.payload };
    case 'SET_ACTIVE_CALL_USER':
      return { ...state, activeCallUser: action.payload };
    case 'SET_IS_CART_OPEN':
      return { ...state, isCartOpen: action.payload };
    case 'SET_IS_VIDEO_CALL_OPEN':
      return { ...state, isVideoCallOpen: action.payload };
    case 'OPEN_SHARE_MODAL':
      return { ...state, activeShare: { title: action.payload.title, url: action.payload.url } };
    case 'CLOSE_SHARE_MODAL':
      return { ...state, activeShare: null };
    case 'OPEN_USER_PROFILE_MODAL':
      return { ...state, viewingProfileUser: action.payload };
    case 'CLOSE_USER_PROFILE_MODAL':
      return { ...state, viewingProfileUser: null };
    case 'SET_IS_SUPABASE_MODAL_OPEN':
      return { ...state, isSupabaseModalOpen: action.payload };
    case 'SET_IS_MOBILE_SIDEBAR_OPEN':
      return { ...state, isMobileSidebarOpen: action.payload };
    case 'UPDATE_CURRENT_USER':
      return { 
        ...state, 
        currentUser: { ...state.currentUser, ...action.payload },
        allUsers: {
          ...state.allUsers,
          [state.currentUser.id]: { ...state.currentUser, ...action.payload }
        }
      };
    case 'SET_ALL_USERS':
      return {
        ...state,
        allUsers: { ...state.allUsers, ...action.payload }
      };
    case 'TOGGLE_FOLLOW_USER': {
      const { userId, isFollowing } = action.payload;
      const targetUser = state.allUsers[userId];
      if (!targetUser) return state;
      const currentFollowingIds = state.currentUser.followingIds || [];
      const newFollowingIds = isFollowing 
        ? currentFollowingIds.filter(id => id !== userId)
        : [...currentFollowingIds, userId];

      const newFollowingCount = isFollowing 
        ? Math.max(0, (state.currentUser.following_count ?? Number(state.currentUser.following) ?? 1) - 1) 
        : (state.currentUser.following_count ?? Number(state.currentUser.following) ?? 0) + 1;

      const newTargetFollowerCount = isFollowing 
        ? Math.max(0, (targetUser.follower_count ?? Number(targetUser.followers) ?? 1) - 1) 
        : (targetUser.follower_count ?? Number(targetUser.followers) ?? 0) + 1;

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          following: newFollowingCount,
          following_count: newFollowingCount,
          followingIds: newFollowingIds
        },
        allUsers: {
          ...state.allUsers,
          [userId]: {
            ...targetUser,
            followers: newTargetFollowerCount,
            follower_count: newTargetFollowerCount,
            followerIds: isFollowing 
              ? (targetUser.followerIds || []).filter(id => id !== state.currentUser.id)
              : [...(targetUser.followerIds || []), state.currentUser.id]
          },
        },
      };
    }
    case 'BLOCK_USER': {
      const { userId } = action.payload;
      const currentBlocked = state.currentUser.blockedUserIds || [];
      if (currentBlocked.includes(userId)) return state;
      const updatedBlocked = [...currentBlocked, userId];

      return {
        ...state,
        currentUser: { ...state.currentUser, blockedUserIds: updatedBlocked },
        posts: state.posts.filter(p => p.userId !== userId),
        clips: state.clips.filter(c => c.userId !== userId),
        conversations: state.conversations.map(conv => 
          conv.members.includes(userId) ? { ...conv, status: 'blocked' } : conv
        )
      };
    }
    case 'UNBLOCK_USER': {
      const { userId } = action.payload;
      const currentBlocked = state.currentUser.blockedUserIds || [];
      const updatedBlocked = currentBlocked.filter(id => id !== userId);

      return {
        ...state,
        currentUser: { ...state.currentUser, blockedUserIds: updatedBlocked },
        conversations: state.conversations.map(conv => 
          conv.members.includes(userId) && conv.status === 'blocked' ? { ...conv, status: 'active' } : conv
        )
      };
    }
    case 'TOGGLE_POST_LIKE':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? Math.max(0, (Number(p.likes) || 1) - 1) : (Number(p.likes) || 0) + 1
              }
            : p
        )
      };
    case 'ADD_POST_COMMENT':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.postId
            ? {
                ...p,
                comments: [action.payload.comment, ...(p.comments || [])]
              }
            : p
        )
      };
    case 'TOGGLE_COMMENT_LIKE':
      return {
        ...state,
        posts: state.posts.map(p => {
          if (p.id !== action.payload.postId) return p;
          return {
            ...p,
            comments: (p.comments || []).map(c => {
              if (c.id !== action.payload.commentId) return c;
              const newLiked = !c.isLiked;
              return {
                ...c,
                isLiked: newLiked,
                likes: newLiked ? (Number(c.likes) || 0) + 1 : Math.max(0, (Number(c.likes) || 1) - 1)
              };
            })
          };
        })
      };
    case 'ADD_COMMENT_REPLY':
      return {
        ...state,
        posts: state.posts.map(p => {
          if (p.id !== action.payload.postId) return p;
          return {
            ...p,
            comments: (p.comments || []).map(c => {
              if (c.id !== action.payload.commentId) return c;
              return {
                ...c,
                replies: [...(c.replies || []), action.payload.reply]
              };
            })
          };
        })
      };
    case 'TOGGLE_CLIP_LIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                likes: clip.isLiked ? Math.max(0, (Number(clip.likes) || 1) - 1) : (Number(clip.likes) || 0) + 1, 
                isLiked: !clip.isLiked,
                isDisliked: false 
              }
            : clip
        ),
      };
    case 'TOGGLE_CLIP_DISLIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                dislikes: clip.isDisliked ? Math.max(0, (Number(clip.dislikes) || 1) - 1) : (Number(clip.dislikes) || 0) + 1, 
                isDisliked: !clip.isDisliked,
                isLiked: false 
              }
            : clip
        ),
      };
    case 'TOGGLE_CLIP_BOOKMARK':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { ...clip, isBookmarked: !clip.isBookmarked }
            : clip
        ),
      };
    case 'ADD_CLIP_COMMENT':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                comments: [action.payload.comment, ...(clip.comments || [])] 
              }
            : clip
        ),
      };
    case 'ADD_MESSAGE': {
      const { convId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c => 
          c.id === convId 
            ? {
                ...c,
                lastMsg: `${message.senderName || 'User'}: ${message.text || 'media'}`,
                time: 'Just now',
                messages: [...(c.messages || []), message]
              }
            : c
        )
      };
    }
    case 'ADD_CONVERSATION': {
      return {
        ...state,
        conversations: [action.payload, ...state.conversations.filter(c => c.id !== action.payload.id)],
        activeConvId: action.payload.id
      };
    }
    case 'SET_CONVERSATIONS': {
      return {
        ...state,
        conversations: action.payload,
        activeConvId: state.activeConvId || (action.payload[0]?.id || null)
      };
    }
    case 'SET_DIRECT_MESSAGES': {
      return {
        ...state,
        directMessages: action.payload
      };
    }
    case 'SET_CONVERSATION_STATUS': {
      const { convId, status } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c => 
          c.id === convId ? { ...c, status } : c
        )
      };
    }
    case 'REMOVE_CONVERSATION': {
      return {
        ...state,
        conversations: state.conversations.filter(c => c.id !== action.payload.convId),
        activeConvId: state.activeConvId === action.payload.convId ? null : state.activeConvId
      };
    }
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.product.id === action.payload.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product: action.payload.product, quantity: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.product.id !== action.payload.productId) };
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SOUND_ENABLED':
      return { ...state, soundEnabled: action.payload };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts.filter(p => p.id !== action.payload.id)] };
    case 'DELETE_POST':
      return { 
        ...state, 
        posts: state.posts.filter(p => p.id !== action.payload.postId),
        clips: state.clips.filter(c => c.id !== action.payload.postId)
      };
    case 'SET_POSTS':
      return { ...state, posts: action.payload || [] };
    case 'ADD_CLIP':
      return { ...state, clips: [action.payload, ...state.clips.filter(c => c.id !== action.payload.id)] };
    case 'DELETE_CLIP':
      return { ...state, clips: state.clips.filter(c => c.id !== action.payload.clipId) };
    case 'SET_CLIPS':
      return { ...state, clips: action.payload || [] };
    case 'ADD_LONG_VIDEO':
      return { ...state, longVideos: [action.payload, ...state.longVideos] };
    case 'ADD_ROM':
      return { ...state, roms: [action.payload, ...state.roms.filter(r => r.id !== action.payload.id)] };
    case 'SET_ROMS':
      return { ...state, roms: action.payload || [] };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products.filter(p => p.id !== action.payload.id)] };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload || [] };
    case 'ADD_SHARED_FILE':
      return { ...state, files: [action.payload, ...state.files.filter(f => f.id !== action.payload.id)] };
    case 'SET_SHARED_FILES':
      return { ...state, files: action.payload || [] };
    case 'ADD_AUDIO_TRACK':
      return { ...state, audioTracks: [action.payload, ...state.audioTracks.filter(a => a.id !== action.payload.id)] };
    case 'SET_AUDIO_TRACKS':
      return { ...state, audioTracks: action.payload || [] };
    case 'ADD_FILM':
      return { ...state, films: [action.payload, ...state.films.filter(f => f.id !== action.payload.id)] };
    case 'SET_FILMS':
      return { ...state, films: action.payload || [] };
    case 'SET_CLOUD_SYNCING':
      return { ...state, isCloudSyncing: action.payload };
    case 'SET_LAST_CLOUD_SYNC':
      return { ...state, lastCloudSync: action.payload };
    case 'PURGE_ACCOUNT': {
      return {
        ...state,
        posts: state.posts.filter(p => p.userId !== state.currentUser.id),
        clips: state.clips.filter(c => c.userId !== state.currentUser.id),
        conversations: [],
        directMessages: []
      };
    }
    default:
      return state;
  }
};