import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';
import { getStoredSession } from '../lib/supabase';

// Load stored authenticated account session or persistent guest profile
function getInitialUserProfile(): UserProfile {
  if (typeof window !== 'undefined') {
    const session = getStoredSession();
    if (session?.user) {
      const email = session.user.email || 'user@wevids.app';
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
      const avatarImg = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
      return {
        id: session.user.id || 'auth_user',
        name: name,
        handle: `@${name.toLowerCase().replace(/\s+/g, '_')}`,
        avatar: name.charAt(0).toUpperCase() || 'U',
        avatarImage: avatarImg,
        color: 'linear-gradient(135deg, #00e5ff, #ff2d95)',
        location: 'Verified Cloud Node',
        bio: '',
        followers: 0,
        following: 0,
        followingIds: [],
        followerIds: [],
        videos: 0,
        likes: 0,
        views: '0',
        joined: new Date().getFullYear().toString(),
        verified: true,
        walletBalance: 0,
        isCreator: true,
        isGuest: false,
        email: email
      };
    }

    const GUEST_STORAGE_KEY = 'wevids_guest_profile_v3';
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, isGuest: true };
      }
    } catch {
      // ignore
    }
  }

  const randomGuestNum = Math.floor(1000 + Math.random() * 9000);
  const colors = [
    'linear-gradient(135deg, #ff2d95, #00e5ff)',
    'linear-gradient(135deg, #00e5ff, #9333ea)',
    'linear-gradient(135deg, #fbbf24, #ff2d95)',
    'linear-gradient(135deg, #10b981, #00e5ff)',
  ];
  const chosenColor = colors[randomGuestNum % colors.length];

  const profile: UserProfile = {
    id: `guest-${randomGuestNum}`,
    name: `Guest_${randomGuestNum}`,
    handle: `@guest_${randomGuestNum}`,
    avatar: 'G',
    color: chosenColor,
    location: 'Earth Node',
    pronouns: 'they/them',
    bio: '',
    followers: 0,
    following: 0,
    followingIds: [],
    followerIds: [],
    videos: 0,
    likes: 0,
    views: '0',
    joined: new Date().getFullYear().toString(),
    verified: false,
    walletBalance: 0,
    isCreator: true,
    isGuest: true,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('wevids_guest_profile_v3', JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  return profile;
}

export const CURRENT_USER: UserProfile = getInitialUserProfile();

// Zero mock users - all profiles are fetched live from Supabase
export const MOCK_USERS: Record<string, UserProfile> = {
  [CURRENT_USER.id]: CURRENT_USER
};

// Zero mock posts - all posts are fetched live from Supabase `posts` table
export const INITIAL_POSTS: PostItem[] = [];

// Zero mock clips - all clips are fetched live from Supabase `clips` table
export const INITIAL_CLIPS: ShortClipItem[] = [];

export const INITIAL_CONVERSATIONS: Conversation[] = [];
export const INITIAL_LONG_VIDEOS: LongVideoItem[] = [];
export const INITIAL_ROMS: RomItem[] = [];
export const INITIAL_PRODUCTS: ProductItem[] = [];
export const INITIAL_BOOKMARKS: SavedCollection[] = [
  {
    id: 'col-1',
    name: 'Saved Library',
    icon: '⚡',
    items: []
  }
];