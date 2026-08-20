import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, SavedCollection } from '../types/wevids';

export const CURRENT_USER: UserProfile = {
  id: 'you',
  name: 'Alex Vance',
  handle: '@alex_vance',
  avatar: 'A',
  color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
  location: 'Global Node',
  pronouns: 'they/them',
  bio: 'Creative dev & XR animator. Building on WEVIDS!',
  followers: 0,
  following: 0,
  followingIds: [],
  followerIds: [],
  videos: 0,
  likes: 0,
  views: '0',
  joined: '2026',
  verified: true,
  walletBalance: 100,
  isCreator: true,
};

export const MOCK_USERS: Record<string, UserProfile> = {
  you: CURRENT_USER,
};

// All items start completely clean and empty
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