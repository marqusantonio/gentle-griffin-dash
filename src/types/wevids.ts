export type ViewName = 
  | 'feed' 
  | 'clips'
  | 'explore' 
  | 'files'
  | 'aihub' 
  | 'gaming' 
  | 'audio'
  | 'films'
  | 'live' 
  | 'roms' 
  | 'mall' 
  | 'messages' 
  | 'bookmarks' 
  | 'profile';

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
  bioAudioUrl?: string;
  bioAudioTitle?: string;
  followers: number;
  following: number;
  followingIds?: string[];
  followerIds?: string[];
  blockedUserIds?: string[];
  isDeactivated?: boolean;
  videos: number;
  likes: number;
  views: string;
  joined: string;
  verified?: boolean;
  walletBalance: number;
  isCreator?: boolean;
  isGuest?: boolean;
  email?: string;
}

export interface FollowRecord {
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at?: string;
}

export interface StreakRecord {
  id?: string;
  user_1: string;
  user_2: string;
  current_streak: number;
  last_message_date?: string;
}

export interface DirectMessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_friend_request?: boolean;
  is_approved?: boolean | null; // null = pending, true = accepted, false = declined
  is_blocked?: boolean;
  mediaUrl?: string;
  type?: 'text' | 'image' | 'gif' | 'audio' | 'file';
  created_at: string;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  bpm: number;
  url: string;
  cover: string;
  uploaderId?: string;
  createdAt?: string;
}

export interface FilmItem {
  id: string;
  title: string;
  synopsis: string;
  director: string;
  releaseYear: number;
  duration: string;
  genre: 'Cyberpunk Sci-Fi' | 'Anime Cinema' | 'Tech Documentary' | 'Gaming Lore' | 'Open Source Action';
  rating: number;
  videoUrl: string;
  posterUrl: string;
  backdropUrl?: string;
  uploaderId?: string;
  views?: string;
}

export interface CommentReply {
  id: string;
  user: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface CommentItem {
  id: string;
  user: string;
  userName: string;
  userAvatar: string;
  userColor: string;
  text: string;
  media?: string;
  mediaType?: 'image' | 'video' | 'gif' | 'sticker' | 'audio';
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: CommentReply[];
}

export interface PostItem {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorColor: string;
  location: string;
  time: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'gif' | 'file';
  fileMeta?: { name: string; size: string; type: string };
  likes: number;
  dislikes?: number;
  shares: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  isBookmarked?: boolean;
  comments: CommentItem[];
  tags?: string[];
  created_at?: string;
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
  comments: CommentItem[];
  created_at?: string;
}

export interface VideoChapter {
  time: number;
  label: string;
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
  chapters: VideoChapter[];
  comments: CommentItem[];
}

export interface RomItem {
  id: string;
  title: string;
  device: string;
  brand: 'Xiaomi / Redmi' | 'Pixel' | 'Samsung' | 'Honor' | 'GSI Generic' | 'Kernel / Module';
  romType: 'China ROM Port' | 'Global Official' | 'Custom Kernel' | 'Magisk Module' | 'HyperOS Port';
  status: 'Official' | 'Beta' | 'Port';
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

export interface SavedCollectionItem {
  id: string;
  type: 'rom' | 'clip' | 'long_video' | 'file' | 'product' | 'film' | 'audio';
  title: string;
  preview: string;
  addedAt: string;
}

export interface SavedCollection {
  id: string;
  name: string;
  icon: string;
  items: SavedCollectionItem[];
}

export interface SharedFileItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: string;
  category: 'ROM / Kernel' | 'APK / Mod' | 'LUTs / Preset' | '3D Model / Shader' | 'Document';
  uploaderId: string;
  uploaderName: string;
  downloadUrl: string;
  checksum: string;
  downloads: number;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text?: string;
  type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'file';
  mediaUrl?: string;
  timestamp: string;
  is_friend_request?: boolean;
  is_approved?: boolean | null;
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
  status: 'active' | 'pending_request' | 'declined' | 'blocked';
  requestedBy?: string;
  streakCount?: number;
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
  affiliateCommission: number;
  isDigital: boolean;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}