import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';

// Load or generate a persistent Guest ID for this device
function getOrCreateGuestProfile(): UserProfile {
  const GUEST_STORAGE_KEY = 'wevids_guest_profile_v3';
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
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
    bio: 'Exploring the WEVIDS network as a guest creator!',
    followers: 0,
    following: 0,
    followingIds: [],
    followerIds: [],
    videos: 0,
    likes: 0,
    views: '0',
    joined: '2026',
    verified: false,
    walletBalance: 50,
    isCreator: true,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  return profile;
}

export const CURRENT_USER: UserProfile = getOrCreateGuestProfile();

export const MOCK_USERS: Record<string, UserProfile> = {
  [CURRENT_USER.id]: CURRENT_USER,
  'user_aiko': {
    id: 'user_aiko',
    name: 'Aiko Tanaka',
    handle: '@aiko_visuals',
    avatar: '🌸',
    color: 'linear-gradient(135deg, #ff2d95, #fbbf24)',
    location: 'Tokyo, Japan',
    bio: 'Anime voxel artist and 3D visual researcher on WEVIDS.',
    followers: 1420,
    following: 110,
    videos: 12,
    likes: 8500,
    views: '45K',
    joined: '2025',
    verified: true,
    walletBalance: 320,
    isCreator: true,
  },
  'user_carlos': {
    id: 'user_carlos',
    name: 'Carlos Vance',
    handle: '@carlos_modder',
    avatar: '⚡',
    color: 'linear-gradient(135deg, #00e5ff, #9333ea)',
    location: 'Berlin Node',
    bio: 'Snapdragon overclocking kernels and HyperOS China port maintainer.',
    followers: 3200,
    following: 85,
    videos: 28,
    likes: 19400,
    views: '120K',
    joined: '2025',
    verified: true,
    walletBalance: 850,
    isCreator: true,
  },
  'user_sara': {
    id: 'user_sara',
    name: 'Sara Saffron',
    handle: '@sara_tehran',
    avatar: '☕',
    color: 'linear-gradient(135deg, #fbbf24, #ff2d95)',
    location: 'Tehran Node',
    bio: 'Cinematographer & synthwave audio producer.',
    followers: 890,
    following: 42,
    videos: 7,
    likes: 4200,
    views: '22K',
    joined: '2026',
    verified: true,
    walletBalance: 210,
    isCreator: true,
  },
  'user_dexter': {
    id: 'user_dexter',
    name: 'Dexter Kernel',
    handle: '@dexter_hyperos',
    avatar: '🤖',
    color: 'linear-gradient(135deg, #10b981, #00e5ff)',
    location: 'Seoul Node',
    bio: 'Building low-latency Android kernels and Magisk thermal modules.',
    followers: 2100,
    following: 150,
    videos: 19,
    likes: 11300,
    views: '78K',
    joined: '2025',
    verified: true,
    walletBalance: 600,
    isCreator: true,
  }
};

export const INITIAL_POSTS: PostItem[] = [];
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