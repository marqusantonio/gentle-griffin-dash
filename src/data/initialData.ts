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
        bio: 'Building and sharing on WEVIDS OS v3.1',
        followers: 120,
        following: 45,
        followingIds: [],
        followerIds: [],
        videos: 8,
        likes: 340,
        views: '1.2k',
        joined: new Date().getFullYear().toString(),
        verified: true,
        walletBalance: 150,
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
    bio: 'Exploring HyperOS Custom ROMs, video shorts & arcade games on WEVIDS.',
    followers: 0,
    following: 0,
    followingIds: [],
    followerIds: [],
    videos: 0,
    likes: 0,
    views: '0',
    joined: new Date().getFullYear().toString(),
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
  'guest-7550': {
    id: 'guest-7550',
    name: 'Guest_7550',
    handle: '@guest_7550',
    avatar: 'G',
    color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    location: 'Central Moderator Hub',
    bio: 'Official WEVIDS Moderator & System Overseer. Verified Node.',
    followers: 840,
    following: 120,
    followingIds: [],
    followerIds: [],
    videos: 14,
    likes: 2950,
    views: '45.2k',
    joined: '2025',
    verified: true,
    isAdmin: true,
    walletBalance: 9999,
    isCreator: true,
    isGuest: false
  },
  'creator-hyperos': {
    id: 'creator-hyperos',
    name: 'Alex HyperMod',
    handle: '@alex_modder',
    avatar: 'A',
    color: 'linear-gradient(135deg, #00e5ff, #10b981)',
    location: 'Tokyo Dev Node',
    bio: 'Porting Xiaomi HyperOS 2.0 & Custom Snapdragon 8 Gen 3 Governors.',
    followers: 1240,
    following: 95,
    followingIds: [],
    followerIds: [],
    videos: 22,
    likes: 4890,
    views: '88k',
    joined: '2025',
    verified: true,
    walletBalance: 320,
    isCreator: true,
    isGuest: false
  },
  'creator-cyberpunk': {
    id: 'creator-cyberpunk',
    name: 'Neon Visuals',
    handle: '@neon_vfx',
    avatar: 'N',
    color: 'linear-gradient(135deg, #9333ea, #ff2d95)',
    location: 'Neo-Seoul',
    bio: '3D Blender shaders, raytraced cyberpunk visualizers and AI Video.',
    followers: 2150,
    following: 180,
    followingIds: [],
    followerIds: [],
    videos: 35,
    likes: 8700,
    views: '140k',
    joined: '2025',
    verified: true,
    walletBalance: 580,
    isCreator: true,
    isGuest: false
  }
};

export const INITIAL_POSTS: PostItem[] = [];

// Curated high-uptime video clips for instant HD playback with Supabase sync
export const INITIAL_CLIPS: ShortClipItem[] = [
  {
    id: 'clip-hyperos-overclock',
    userId: 'creator-hyperos',
    title: '⚡ Snapdragon 8 Gen 3 Overclock 144 FPS Test!',
    description: 'Running Genshin Impact at max 144Hz on custom HyperOS 2.0 kernel with zero thermal throttling.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    audioTrack: 'Alex HyperMod · Cyber Synthwave Theme',
    likes: 342,
    dislikes: 4,
    shares: 88,
    comments: [
      {
        id: 'c1',
        user: 'guest-7550',
        userName: 'Guest_7550',
        userAvatar: 'G',
        userColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        text: 'Thermal headroom on this build looks rock solid! 🔥',
        timestamp: '1h ago',
        likes: 18,
        replies: []
      }
    ]
  },
  {
    id: 'clip-neon-cityscape',
    userId: 'creator-cyberpunk',
    title: '🌌 Liquid Glass VFX Render in 4K 60FPS',
    description: 'Real-time raytraced refraction test rendered using WEVIDS Neural Studio Engine v3.1.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    audioTrack: 'Neon Visuals · Ambient Pulse (128 BPM)',
    likes: 512,
    dislikes: 2,
    shares: 145,
    comments: [
      {
        id: 'c2',
        user: 'creator-hyperos',
        userName: 'Alex HyperMod',
        userAvatar: 'A',
        userColor: 'linear-gradient(135deg, #00e5ff, #10b981)',
        text: 'The glass shaders refraction is mindblowing 💎',
        timestamp: '30m ago',
        likes: 24,
        replies: []
      }
    ]
  },
  {
    id: 'clip-minecraft-pvp',
    userId: 'guest-7550',
    title: '⚔️ Online Minecraft PVP 1v1 Arena Clutch',
    description: 'Diamond sword combo vs enemy bot with golden apple clutch in the WEVIDS Arcade!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    audioTrack: 'WEVIDS Arcade · Chiptune 8-Bit Beats',
    likes: 420,
    dislikes: 8,
    shares: 64,
    comments: []
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