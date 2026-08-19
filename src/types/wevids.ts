export type ViewName = 
  | 'feed' 
  | 'explore' 
  | 'aihub' 
  | 'gaming' 
  | 'live' 
  | 'roms' 
  | 'mall' 
  | 'messages' 
  | 'bookmarks' 
  | 'profile' 
  | 'studio';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  avatarImage?: string;
  frame?: string;
  color: string;
  location: string;
  bio: string;
  pronouns?: string;
  followers: number;
  following: number;
  videos: number;
  likes: number;
  views: string;
  joined: string;
  verified?: boolean;
  walletBalance: number;
  isCreator?: boolean;
}

export interface CommentItem {
  id: string;
  user: string;
  userName: string;
  userAvatar: string;
  userAvatarImg?: string;
  userColor: string;
  text: string;
  media?: string;
  mediaType?: 'image' | 'video' | 'gif' | 'sticker' | 'audio';
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: CommentItem[];
}

export interface PostItem {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorAvatarImg?: string;
  authorColor: string;
  location: string;
  time: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif';
  likes: number;
  dislikes?: number;
  shares: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBookmarked?: boolean;
  comments: CommentItem[];
  tags?: string[];
}

export interface ShortClipItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  videoUrl: string;
  audioTrack: string;
  likes: number;
  dislikes: number;
  shares: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  comments: CommentItem[];
  isTikTok?: boolean;
  tiktokId?: string;
}

export interface LongVideoItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  views: string;
  timestamp: string;
  category: string;
  likes: number;
  dislikes: number;
  isSubscribed?: boolean;
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  chapters: { time: number; label: string }[];
  comments: CommentItem[];
}

export interface RomItem {
  id: string;
  title: string;
  device: string;
  brand: 'Xiaomi / Redmi' | 'Pixel' | 'Samsung' | 'Honor' | 'GSI Generic' | 'Kernel / Module';
  romType: 'China ROM Port' | 'Global Official' | 'Custom Kernel' | 'Magisk Module' | 'HyperOS Port';
  status: 'Official' | 'Beta' | 'Port' | 'Experimental';
  maintainer: string;
  maintainerHandle: string;
  version: string;
  androidVersion: string;
  fileSize: string;
  checksum: string;
  downloadCount: number;
  downloadUrl: string;
  githubUrl?: string;
  releaseDate: string;
  changelog: string[];
}

export interface ProductItem {
  id: string;
  title: string;
  category: 'Digital ROMs' | 'Presets & LUTs' | 'AI Prompts' | 'Gaming Gear' | 'Creator Merch';
  price: number;
  currency: string;
  creatorId: string;
  creatorName: string;
  rating: number;
  salesCount: number;
  previewUrl: string;
  description: string;
  affiliateCommission: number; // e.g. 15%
  isDigital: boolean;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text?: string;
  type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'rom_file';
  mediaUrl?: string;
  audioDuration?: string;
  timestamp: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  groupName?: string;
  groupTopic?: string;
  avatar: string;
  color: string;
  members: string[]; // user IDs
  lastMsg: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

export interface SavedCollection {
  id: string;
  name: string;
  icon: string;
  items: {
    id: string;
    type: 'post' | 'clip' | 'long_video' | 'rom' | 'product';
    title: string;
    preview: string;
    addedAt: string;
  }[];
}