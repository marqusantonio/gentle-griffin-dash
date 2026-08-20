import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';
import { getStoredSession } from '../lib/supabase';

// Load stored account profile or generate persistent Guest
function getInitialUserProfile(): UserProfile {
  if (typeof window !== 'undefined') {
    // 1. Check if authenticated Supabase session exists
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
        bio: 'Verified WEVIDS creator account.',
        followers: 120,
        following: 15,
        followingIds: ['user_aiko', 'user_carlos'],
        followerIds: ['user_aiko'],
        videos: 2,
        likes: 450,
        views: '1.2K',
        joined: '2026',
        verified: true,
        walletBalance: 150,
        isCreator: true,
        isGuest: false,
        email: email
      };
    }

    // 2. Check stored guest profile
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

  // 3. Fallback fresh guest
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
    followingIds: ['user_carlos'],
    followerIds: [],
    videos: 12,
    likes: 8500,
    views: '45K',
    joined: '2025',
    verified: true,
    walletBalance: 320,
    isCreator: true,
    isGuest: false,
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
    followingIds: ['user_aiko'],
    followerIds: [],
    videos: 28,
    likes: 19400,
    views: '120K',
    joined: '2025',
    verified: true,
    walletBalance: 850,
    isCreator: true,
    isGuest: false,
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
    followingIds: [],
    followerIds: [],
    videos: 7,
    likes: 4200,
    views: '22K',
    joined: '2026',
    verified: true,
    walletBalance: 210,
    isCreator: true,
    isGuest: false,
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
    followingIds: [],
    followerIds: [],
    videos: 19,
    likes: 11300,
    views: '78K',
    joined: '2025',
    verified: true,
    walletBalance: 600,
    isCreator: true,
    isGuest: false,
  }
};

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-init-1',
    userId: 'user_carlos',
    authorName: 'Carlos Vance',
    authorHandle: '@carlos_modder',
    authorAvatar: '⚡',
    authorColor: 'linear-gradient(135deg, #00e5ff, #9333ea)',
    location: 'Berlin Node',
    time: '10m ago',
    content: '🚀 HyperOS 2.0 kernel scheduler optimized for Snapdragon 8 Gen 3! Dropped touch latency down to 4.2ms. Check the ROM Vault to flash the ZIP.',
    tags: ['#CustomROM', '#Tech', '#WEVIDS'],
    likes: 34,
    dislikes: 0,
    shares: 8,
    comments: [
      {
        id: 'c-init-1',
        user: 'user_dexter',
        userName: 'Dexter Kernel',
        userAvatar: '🤖',
        userColor: 'linear-gradient(135deg, #10b981, #00e5ff)',
        text: 'Clean thermals! Testing on Xiaomi 14 right now.',
        timestamp: '5m ago',
        likes: 4
      }
    ],
    created_at: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'post-init-2',
    userId: 'user_aiko',
    authorName: 'Aiko Tanaka',
    authorHandle: '@aiko_visuals',
    authorAvatar: '🌸',
    authorColor: 'linear-gradient(135deg, #ff2d95, #fbbf24)',
    location: 'Tokyo, Japan',
    time: '25m ago',
    content: '✨ Cyberpunk anime render test finished in 8K Octane with liquid reflections. What do you think?',
    mediaUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1000&q=80',
    mediaType: 'image',
    tags: ['#Anime', '#Cyberpunk', '#WEVIDS'],
    likes: 58,
    dislikes: 0,
    shares: 14,
    comments: [],
    created_at: new Date(Date.now() - 1500000).toISOString()
  }
];

export const INITIAL_CLIPS: ShortClipItem[] = [
  {
    id: 'clip-init-1',
    userId: 'user_aiko',
    title: 'Neon Drift Cyber City ⚡',
    description: 'Real-time raytracing test in Unreal Engine 5.5 mobile viewport.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    audioTrack: 'Aiko Tanaka · Tokyo Neon Night',
    likes: 142,
    dislikes: 2,
    shares: 38,
    comments: [],
    created_at: new Date().toISOString()
  },
  {
    id: 'clip-init-2',
    userId: 'user_carlos',
    title: 'Flashing Custom Recovery Live 🛠️',
    description: 'Step-by-step fastboot flash script tutorial.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    audioTrack: 'Carlos Vance · Synth Beats',
    likes: 89,
    dislikes: 0,
    shares: 19,
    comments: [],
    created_at: new Date().toISOString()
  }
];

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