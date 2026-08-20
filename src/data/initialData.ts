import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';

export const CURRENT_USER: UserProfile = {
  id: 'you',
  name: 'Alex Vance',
  handle: '@alex_vance',
  avatar: 'A',
  color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
  location: 'Global Node',
  pronouns: 'they/them',
  bio: 'Creative dev & XR animator. Building the WEVIDS ecosystem!',
  followers: 1,
  following: 1,
  followingIds: ['sara'],
  followerIds: ['sara'],
  videos: 0,
  likes: 0,
  views: '0',
  joined: 'July 2026',
  verified: true,
  walletBalance: 100,
  isCreator: true,
};

export const MOCK_USERS: Record<string, UserProfile> = {
  you: CURRENT_USER,
  sara: {
    id: 'sara',
    name: 'Sara from Tehran',
    handle: '@sara_tehran',
    avatar: 'S',
    color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    location: 'Tehran, Iran',
    pronouns: 'she/her',
    bio: 'Sharing culture, poetry, and tea moments with the world. Borderless connection forever!',
    followers: 120,
    following: 80,
    followingIds: ['you'], // Follows you back -> Mutual friend!
    followerIds: ['you'],
    videos: 0,
    likes: 42,
    views: '1.2K',
    joined: 'Mar 2026',
    verified: true,
    walletBalance: 250,
    isCreator: true,
  },
  carlos: {
    id: 'carlos',
    name: 'Carlos Mendez (ROM Dev)',
    handle: '@carlos_modder',
    avatar: 'C',
    color: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
    location: 'Mexico City',
    pronouns: 'he/him',
    bio: 'Mainline Kernel porter & Xiaomi HyperOS China ROM builder ⚡',
    followers: 89,
    following: 40,
    followingIds: [],
    followerIds: [],
    videos: 0,
    likes: 31,
    views: '800',
    joined: 'Apr 2026',
    verified: true,
    walletBalance: 140,
    isCreator: true,
  },
  aiko: {
    id: 'aiko',
    name: 'Aiko Tanaka',
    handle: '@aiko_visuals',
    avatar: 'A',
    color: 'linear-gradient(135deg, #ff2d95, #fbbf24)',
    location: 'Tokyo, Japan',
    pronouns: 'she/they',
    bio: 'UI/UX futurist, voxel artist, and cyberpunk 3D generator.',
    followers: 145,
    following: 20,
    followingIds: [],
    followerIds: [],
    videos: 0,
    likes: 84,
    views: '2.1K',
    joined: 'Jan 2026',
    verified: true,
    walletBalance: 320,
    isCreator: true,
  }
};

// All feeds start empty unless user/community publishes!
export const INITIAL_POSTS: PostItem[] = [];
export const INITIAL_CLIPS: ShortClipItem[] = [];
export const INITIAL_CONVERSATIONS: Conversation[] = [];

export const INITIAL_LONG_VIDEOS: LongVideoItem[] = [];

export const INITIAL_ROMS: RomItem[] = [
  {
    id: 'rom-1',
    title: 'HyperOS 2.0 Neo China Extreme Edition',
    device: 'Xiaomi 14 / Pro / Ultra (houji / shennong)',
    brand: 'Xiaomi / Redmi',
    romType: 'China ROM Port',
    status: 'Official',
    maintainer: 'Carlos Mendez (@carlos_modder)',
    maintainerHandle: '@carlos_modder',
    version: 'v2.0.24.8.G',
    androidVersion: 'Android 15 (Vanilla Ice Cream)',
    fileSize: '5.84 GB',
    checksum: 'e8f7a932b14c90d6e42a19ff88b643ce219f01ab92',
    downloadCount: 148,
    downloadUrl: 'https://github.com/wevids/rom-vault',
    githubUrl: 'https://github.com/wevids/rom-vault',
    releaseDate: 'August 24, 2026',
    changelog: [
      'De-bloated non-essential telemetry packages',
      'Unlocked 120 FPS high refresh mode in all gaming engines',
      'Optimized thermal throttling curves for Snapdragon 8 Gen 3'
    ]
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    title: 'Cyberpunk HyperOS UI Theme + Animated Lockscreen',
    category: 'Presets & LUTs',
    price: 4.99,
    currency: 'USD',
    creatorId: 'aiko',
    creatorName: 'Aiko Tanaka',
    rating: 5.0,
    salesCount: 14,
    previewUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    description: 'Complete theme pack with 120 custom vector icons, neon glass widgets, and custom sound scheme.',
    affiliateCommission: 20,
    isDigital: true,
  }
];

export const INITIAL_BOOKMARKS: SavedCollection[] = [
  {
    id: 'col-1',
    name: '🔥 Top ROMs & Guides',
    icon: '⚡',
    items: []
  }
];