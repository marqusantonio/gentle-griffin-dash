import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';

// Generate a friendly 4-digit guest ID
const randomGuestNum = Math.floor(1000 + Math.random() * 9000);

export const CURRENT_USER: UserProfile = {
  id: `guest-${randomGuestNum}`,
  name: `Guest_${randomGuestNum}`,
  handle: `@guest_${randomGuestNum}`,
  avatar: 'G',
  color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
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

export const MOCK_USERS: Record<string, UserProfile> = {
  [CURRENT_USER.id]: CURRENT_USER,
};

// All clean initial state collections
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