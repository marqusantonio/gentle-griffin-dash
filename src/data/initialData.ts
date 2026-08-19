import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';

export const CURRENT_USER: UserProfile = {
  id: 'you',
  name: 'Alex Vance',
  handle: '@alex_vance',
  avatar: 'A',
  color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
  location: 'Neo Tokyo & Global',
  pronouns: 'they/them',
  bio: 'Creative dev & XR animator. Exploring borderless streaming, HyperOS ports, and AI video rendering. Building WEVIDS ecosystem!',
  followers: 1842,
  following: 340,
  videos: 14,
  likes: 8940,
  views: '84.2K',
  joined: 'July 2026',
  verified: true,
  walletBalance: 420.50,
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
    followers: 12400,
    following: 156,
    videos: 52,
    likes: 64200,
    views: '420K',
    joined: 'Mar 2026',
    verified: true,
    walletBalance: 1250,
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
    bio: 'Mainline Kernel porter & Xiaomi HyperOS China ROM builder. Snapdragon 8 Gen 3 enthusiast ⚡',
    followers: 8930,
    following: 204,
    videos: 38,
    likes: 31200,
    views: '210K',
    joined: 'Apr 2026',
    verified: true,
    walletBalance: 840,
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
    bio: 'UI/UX futurist, Minecraft voxel artist, and cyberpunk 3D generator.',
    followers: 24500,
    following: 89,
    videos: 91,
    likes: 184000,
    views: '1.2M',
    joined: 'Jan 2026',
    verified: true,
    walletBalance: 3200,
    isCreator: true,
  },
  reza: {
    id: 'reza',
    name: 'Reza Ahmadi',
    handle: '@reza_shiraz',
    avatar: 'R',
    color: 'linear-gradient(135deg, #fbbf24, #ff2d95)',
    location: 'Shiraz, Iran',
    pronouns: 'he/him',
    bio: 'Literature, Persian aesthetics & acoustic audio notes.',
    followers: 6700,
    following: 112,
    videos: 29,
    likes: 22400,
    views: '150K',
    joined: 'Feb 2026',
    walletBalance: 490,
  }
};

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-101',
    userId: 'carlos',
    authorName: 'Carlos Mendez (ROM Dev)',
    authorHandle: '@carlos_modder',
    authorAvatar: 'C',
    authorColor: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
    location: 'Mexico City',
    time: '5m ago',
    content: 'Just deployed the new HyperOS 2.0 China Port for Xiaomi 14 & Redmi K70 Pro! Fixed GPU overclocking profile and high refresh rate lock. Check the Developer Vault for the fast CDN mirror & MD5 checksum!',
    mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    likes: 342,
    dislikes: 4,
    shares: 88,
    comments: [
      {
        id: 'c-1',
        user: 'you',
        userName: 'Alex Vance',
        userAvatar: 'A',
        userColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        text: 'Flashing this right now with TWRP! Huge props for the battery optimization Carlos 🔥',
        timestamp: '2m ago',
        likes: 18,
      }
    ],
    tags: ['#HyperOS', '#AndroidModding', '#Xiaomi', '#CustomROM']
  },
  {
    id: 'post-102',
    userId: 'sara',
    authorName: 'Sara from Tehran',
    authorHandle: '@sara_tehran',
    authorAvatar: 'S',
    authorColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    location: 'Tehran, Iran',
    time: '24m ago',
    content: 'Happy Friday from the historic Grand Bazaar! Drinking fresh saffron tea and chatting with friends all over the world on WEVIDS. No firewalls can block our human bond 🌷✨',
    mediaUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    likes: 914,
    dislikes: 2,
    shares: 142,
    comments: [
      {
        id: 'c-2',
        user: 'aiko',
        userName: 'Aiko Tanaka',
        userAvatar: 'A',
        userColor: 'linear-gradient(135deg, #ff2d95, #fbbf24)',
        text: 'Such beautiful colors Sara! Sending warm greetings from Shibuya 🇯🇵❤️',
        timestamp: '18m ago',
        likes: 42
      }
    ],
    tags: ['#Tehran', '#GlobalCommunity', '#TeaCulture']
  }
];

export const INITIAL_CLIPS: ShortClipItem[] = [
  {
    id: 'clip-1',
    userId: 'aiko',
    title: 'Cyberpunk Tokyo Neon Rain 🌧️ 3D Render Workflow in Blender',
    description: 'Procedural neon shaders and liquid refraction physics built in 4 hours!',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    audioTrack: 'Synthwave Dreams · Aiko Tanaka Original Mix',
    likes: 12450,
    dislikes: 80,
    shares: 3400,
    comments: [
      {
        id: 'cc-1',
        user: 'carlos',
        userName: 'Carlos Mendez',
        userAvatar: 'C',
        userColor: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
        text: 'The raytraced puddle reflections are insane! 🚀',
        timestamp: '1h ago',
        likes: 95
      }
    ]
  },
  {
    id: 'clip-2',
    userId: 'sara',
    title: 'Traditional Persian Saffron & Rose Water Making 🌹',
    description: 'Centuries of heritage captured in high definition vertical video.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    audioTrack: 'Traditional Ney & Santur Acoustic',
    likes: 24100,
    dislikes: 110,
    shares: 6800,
    comments: []
  },
  {
    id: 'clip-3',
    userId: 'carlos',
    title: 'Booting Android 15 Vanilla GSI on Snapdragon 8 Gen 3! ⚡',
    description: 'First ever clean benchmark test running at 144Hz buttery smooth.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    audioTrack: 'Tech Pulse High Energy Beats',
    likes: 8900,
    dislikes: 45,
    shares: 1900,
    comments: []
  }
];

export const INITIAL_LONG_VIDEOS: LongVideoItem[] = [
  {
    id: 'long-1',
    userId: 'carlos',
    title: 'Ultimate 2026 Custom ROM & Kernel Guide: Unlock, Flash HyperOS, Magisk Root & Shizuku Setup',
    description: 'Complete walkthrough on modifying modern Snapdragon flagships. Includes full backup procedures, payload.bin dumping, thermal mitigation, and fastboot command scripts.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    duration: '24:18',
    views: '142K',
    timestamp: '2 days ago',
    category: 'ROM Installation',
    likes: 9400,
    dislikes: 62,
    chapters: [
      { time: 0, label: '00:00 Introduction & Tools Setup' },
      { time: 240, label: '04:00 Unlocking Bootloader Safeguards' },
      { time: 620, label: '10:20 Flashing Custom Recovery & Vendor Boot' },
      { time: 980, label: '16:20 ROM Installation & Verification' },
      { time: 1350, label: '22:30 Magisk Modules & Benchmark Testing' }
    ],
    comments: [
      {
        id: 'lc-1',
        user: 'you',
        userName: 'Alex Vance',
        userAvatar: 'A',
        userColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        text: 'This saved my bricked test phone! The checksum verification script was pure gold.',
        timestamp: '1 day ago',
        likes: 124,
      }
    ]
  },
  {
    id: 'long-2',
    userId: 'aiko',
    title: 'Designing a Full Liquid Glass Cyberpunk Interface in Figma & React (Zero to Live Deployment)',
    description: 'Master backdrop filters, CSS specular highlights, audio synth integrations, and WebGL particle fields for ultra-modern web applications.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    duration: '38:45',
    views: '89K',
    timestamp: '4 days ago',
    category: 'Tech Reviews',
    likes: 12800,
    dislikes: 40,
    chapters: [
      { time: 0, label: '00:00 Liquid Glass Physics Breakdown' },
      { time: 480, label: '08:00 Tailwind CSS Token System' },
      { time: 1200, label: '20:00 Sound Synthesis Setup' },
      { time: 1900, label: '31:40 Live Preview & Publishing' }
    ],
    comments: []
  }
];

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
    downloadCount: 14820,
    downloadUrl: 'https://github.com/wevids/rom-vault/releases/download/v2.0/HyperOS2_Xiaomi14.zip',
    githubUrl: 'https://github.com/wevids/rom-vault',
    releaseDate: 'August 24, 2026',
    changelog: [
      'De-bloated 95+ non-essential telemetry packages',
      'Unlocked 120 FPS high refresh mode in all gaming engines',
      'Integrated Leica Camera 5.2 color science engine',
      'Optimized thermal throttling curves for Snapdragon 8 Gen 3',
      'Full multi-language translation pack pre-installed'
    ]
  },
  {
    id: 'rom-2',
    title: 'Pixel Experience 15 Plus Extended',
    device: 'Generic System Image (ARM64-v8a A/B)',
    brand: 'GSI Generic',
    romType: 'Global Official',
    status: 'Official',
    maintainer: 'WEVIDS OpenSource Team',
    maintainerHandle: '@wevids_core',
    version: 'PE-15.4-GSI',
    androidVersion: 'Android 15 (Clean AOSP)',
    fileSize: '2.18 GB',
    checksum: '49af728c0b115d9a7812bc320f719aa01824cbfe',
    downloadCount: 32400,
    downloadUrl: 'https://github.com/wevids/rom-vault/releases/download/v15/PixelExp_GSI_ARM64.zip',
    githubUrl: 'https://github.com/wevids/rom-vault',
    releaseDate: 'August 18, 2026',
    changelog: [
      'Universal Treble 2.0 vendor compatibility',
      'Google Tensor AI Camera algorithms backported',
      'Zero battery drain overnight (<0.4% per hour)',
      'Built-in Play Integrity bypass module'
    ]
  },
  {
    id: 'rom-3',
    title: 'Kona Extreme OC Kernel (60Hz -> 144Hz Display Mod)',
    device: 'Redmi K40 / POCO F3 / Xiaomi Mi 11',
    brand: 'Kernel / Module',
    romType: 'Custom Kernel',
    status: 'Beta',
    maintainer: 'Kona Kernel Lab',
    maintainerHandle: '@kona_dev',
    version: 'Kona-5.4.280-OC',
    androidVersion: 'Any Android 13/14/15 ROM',
    fileSize: '48.2 MB',
    checksum: '77f12e8b09da54c30291ba420d18f921',
    downloadCount: 9240,
    downloadUrl: 'https://github.com/wevids/rom-vault/releases/download/k5/Kona_Kernel_F3.zip',
    githubUrl: 'https://github.com/wevids/rom-vault',
    releaseDate: 'August 12, 2026',
    changelog: [
      'Upstreamed Linux kernel 5.4.280 security patches',
      'Adreno GPU overclocked to 905MHz with thermal stability',
      'WireGuard VPN hardware offloading'
    ]
  }
];

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    title: 'Cyberpunk HyperOS UI Theme + Animated Lockscreen Engine',
    category: 'Presets & LUTs',
    price: 4.99,
    currency: 'USD',
    creatorId: 'aiko',
    creatorName: 'Aiko Tanaka',
    rating: 4.9,
    salesCount: 1420,
    previewUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    description: 'Complete theme pack with 120 custom vector icons, neon glass widgets, lockscreen audio visualizer, and custom sound scheme.',
    affiliateCommission: 20,
    isDigital: true,
  },
  {
    id: 'prod-2',
    title: 'Snapdragon 8 Gen 3 Extreme Gaming Governor & Thermal Script',
    category: 'Digital ROMs',
    price: 9.99,
    currency: 'USD',
    creatorId: 'carlos',
    creatorName: 'Carlos Mendez',
    rating: 4.8,
    salesCount: 890,
    previewUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
    description: 'Magisk and KernelSU module that locks 120 FPS in Genshin Impact, Warzone Mobile, and PUBG without thermal throttling.',
    affiliateCommission: 15,
    isDigital: true,
  },
  {
    id: 'prod-3',
    title: 'WEVIDS Holographic Glow Deskmat (Liquid Glass Edition)',
    category: 'Gaming Gear',
    price: 29.50,
    currency: 'USD',
    creatorId: 'you',
    creatorName: 'WEVIDS Official',
    rating: 5.0,
    salesCount: 420,
    previewUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    description: 'Ultra-dense micro-weave surface with stitched RGB fiber optics, water-resistant liquid glass finish (900x400mm).',
    affiliateCommission: 10,
    isDigital: false,
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-group-1',
    isGroup: true,
    groupName: '🚀 WEVIDS Modding Squad & Kernel Lab',
    groupTopic: 'HyperOS 2.0 ports, GSI builds, and gaming kernels',
    avatar: 'M',
    color: 'linear-gradient(135deg, #ff2d95, #7c3aed)',
    members: ['you', 'carlos', 'aiko', 'sara'],
    lastMsg: 'Carlos: Just uploaded the new test kernel build!',
    time: '2m',
    unread: 3,
    messages: [
      {
        id: 'gm-1',
        fromId: 'carlos',
        senderName: 'Carlos Mendez',
        senderAvatar: 'C',
        senderColor: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
        text: 'Welcome everyone! Testing the new touch latency scheduler for our gaming ROM.',
        type: 'text',
        timestamp: '10:45 AM'
      },
      {
        id: 'gm-2',
        fromId: 'aiko',
        senderName: 'Aiko Tanaka',
        senderAvatar: 'A',
        senderColor: 'linear-gradient(135deg, #ff2d95, #fbbf24)',
        text: 'The boot animation looks crisp! Look at this liquid shimmer:',
        type: 'gif',
        mediaUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTYycGtwMjd1d3E5MnBnNHJvaTR0dWUxbG11bmt5eWNvOXF6b3p2bCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif',
        timestamp: '10:48 AM'
      },
      {
        id: 'gm-3',
        fromId: 'carlos',
        senderName: 'Carlos Mendez',
        senderAvatar: 'C',
        senderColor: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
        text: 'Just uploaded the new test kernel build! Try it in Developer Vault.',
        type: 'text',
        timestamp: '10:50 AM'
      }
    ]
  },
  {
    id: 'conv-sara',
    isGroup: false,
    avatar: 'S',
    color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
    members: ['you', 'sara'],
    lastMsg: 'Sara: Salam! Excited to collaborate on the live stream!',
    time: '12m',
    unread: 1,
    messages: [
      {
        id: 'sm-1',
        fromId: 'sara',
        senderName: 'Sara from Tehran',
        senderAvatar: 'S',
        senderColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        text: 'Salam Alex! Love your new video on the Dual Feed system!',
        type: 'text',
        timestamp: 'Yesterday'
      },
      {
        id: 'sm-2',
        fromId: 'you',
        senderName: 'Alex Vance',
        senderAvatar: 'A',
        senderColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        text: 'Thanks Sara! Ready to host our joint global stream next week?',
        type: 'text',
        timestamp: '9:15 AM'
      },
      {
        id: 'sm-3',
        fromId: 'sara',
        senderName: 'Sara from Tehran',
        senderAvatar: 'S',
        senderColor: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        text: 'Salam! Excited to collaborate on the live stream!',
        type: 'text',
        timestamp: '9:30 AM'
      }
    ]
  }
];

export const INITIAL_BOOKMARKS: SavedCollection[] = [
  {
    id: 'col-1',
    name: '🔥 Top ROMs & Flash Guides',
    icon: '⚡',
    items: [
      {
        id: 'rom-1',
        type: 'rom',
        title: 'HyperOS 2.0 Neo China Extreme Edition',
        preview: 'Xiaomi 14 Series · 5.84 GB',
        addedAt: 'Yesterday'
      },
      {
        id: 'long-1',
        type: 'long_video',
        title: 'Ultimate 2026 Custom ROM & Kernel Guide',
        preview: '24:18 · 142K Views',
        addedAt: '2 days ago'
      }
    ]
  },
  {
    id: 'col-2',
    name: '✨ Minecraft Tips & Voxel Art',
    icon: '🎮',
    items: [
      {
        id: 'clip-1',
        type: 'clip',
        title: 'Cyberpunk Tokyo Neon Rain 🌧️ 3D Render Workflow',
        preview: '12.4K Likes · Aiko Tanaka',
        addedAt: '3 days ago'
      }
    ]
  }
];