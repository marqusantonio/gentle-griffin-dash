import { 
  PostItem, 
  ShortClipItem, 
  LongVideoItem, 
  RomItem, 
  ProductItem, 
  Conversation, 
  UserProfile, 
  CartItem, 
  SavedCollection, 
  SharedFileItem, 
  AudioTrackItem, 
  FilmItem,
  ViewName 
} from '../types/wevids';
import { 
  CURRENT_USER, 
  MOCK_USERS, 
  INITIAL_POSTS, 
  INITIAL_CLIPS, 
  INITIAL_LONG_VIDEOS, 
  INITIAL_ROMS, 
  INITIAL_PRODUCTS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_BOOKMARKS 
} from '../data/initialData';
import { INITIAL_AUDIO_TRACKS, INITIAL_FILMS, INITIAL_FILES } from '../data/mediaData';

export interface WevidsState {
  posts: PostItem[];
  clips: ShortClipItem[];
  longVideos: LongVideoItem[];
  roms: RomItem[];
  products: ProductItem[];
  files: SharedFileItem[];
  audioTracks: AudioTrackItem[];
  films: FilmItem[];
  conversations: Conversation[];
  
  activeView: ViewName;
  activeConvId: string | null;
  activeCallUser: string | null;
  isCartOpen: boolean;
  isVideoCallOpen: boolean;
  activeShare: { title: string; url: string } | null;
  viewingProfileUser: UserProfile | null;
  isSupabaseModalOpen: boolean;
  
  currentUser: UserProfile;
  allUsers: Record<string, UserProfile>;
  soundEnabled: boolean;
  cart: CartItem[];
  collections: SavedCollection[];
  isCloudSyncing: boolean;
  lastCloudSync: string | null;
}

export const initialWevidsState: WevidsState = {
  posts: INITIAL_POSTS,
  clips: INITIAL_CLIPS,
  longVideos: INITIAL_LONG_VIDEOS,
  roms: INITIAL_ROMS,
  products: INITIAL_PRODUCTS,
  files: INITIAL_FILES,
  audioTracks: INITIAL_AUDIO_TRACKS,
  films: INITIAL_FILMS,
  conversations: INITIAL_CONVERSATIONS,
  activeView: 'feed',
  activeConvId: 'conv-group-1',
  activeCallUser: null,
  isCartOpen: false,
  isVideoCallOpen: false,
  activeShare: null,
  viewingProfileUser: null,
  isSupabaseModalOpen: false,
  currentUser: CURRENT_USER,
  allUsers: MOCK_USERS,
  soundEnabled: true,
  cart: [],
  collections: INITIAL_BOOKMARKS,
  isCloudSyncing: false,
  lastCloudSync: null,
};

export type WevidsAction =
  | { type: 'SET_ACTIVE_VIEW'; payload: ViewName }
  | { type: 'SET_ACTIVE_CONV_ID'; payload: string | null }
  | { type: 'SET_ACTIVE_CALL_USER'; payload: string | null }
  | { type: 'SET_IS_CART_OPEN'; payload: boolean }
  | { type: 'SET_IS_VIDEO_CALL_OPEN'; payload: boolean }
  | { type: 'OPEN_SHARE_MODAL'; payload: { title: string; url: string } }
  | { type: 'CLOSE_SHARE_MODAL' }
  | { type: 'OPEN_USER_PROFILE_MODAL'; payload: UserProfile }
  | { type: 'CLOSE_USER_PROFILE_MODAL' }
  | { type: 'SET_IS_SUPABASE_MODAL_OPEN'; payload: boolean }
  | { type: 'UPDATE_CURRENT_USER'; payload: Partial<UserProfile> }
  | { type: 'TOGGLE_FOLLOW_USER'; payload: { userId: string; isFollowing: boolean } }
  | { type: 'TOGGLE_CLIP_LIKE'; payload: { clipId: string } }
  | { type: 'TOGGLE_CLIP_DISLIKE'; payload: { clipId: string } }
  | { type: 'TOGGLE_CLIP_BOOKMARK'; payload: { clipId: string } }
  | { type: 'ADD_CLIP_COMMENT'; payload: { clipId: string; comment: any } }
  | { type: 'ADD_MESSAGE'; payload: { convId: string; message: any } }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CONVERSATION_STATUS'; payload: { convId: string; status: 'active' | 'pending_request' } }
  | { type: 'REMOVE_CONVERSATION'; payload: { convId: string } }
  | { type: 'ADD_TO_CART'; payload: { product: ProductItem } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'ADD_POST'; payload: PostItem }
  | { type: 'SET_POSTS'; payload: PostItem[] }
  | { type: 'ADD_CLIP'; payload: ShortClipItem }
  | { type: 'SET_CLIPS'; payload: ShortClipItem[] }
  | { type: 'ADD_LONG_VIDEO'; payload: LongVideoItem }
  | { type: 'ADD_ROM'; payload: RomItem }
  | { type: 'SET_ROMS'; payload: RomItem[] }
  | { type: 'ADD_PRODUCT'; payload: ProductItem }
  | { type: 'SET_PRODUCTS'; payload: ProductItem[] }
  | { type: 'ADD_SHARED_FILE'; payload: SharedFileItem }
  | { type: 'SET_SHARED_FILES'; payload: SharedFileItem[] }
  | { type: 'ADD_AUDIO_TRACK'; payload: AudioTrackItem }
  | { type: 'SET_AUDIO_TRACKS'; payload: AudioTrackItem[] }
  | { type: 'ADD_FILM'; payload: FilmItem }
  | { type: 'SET_FILMS'; payload: FilmItem[] }
  | { type: 'SET_CLOUD_SYNCING'; payload: boolean }
  | { type: 'SET_LAST_CLOUD_SYNC'; payload: string };

function mergeItems<T extends { id: string }>(newList: T[], oldList: T[]): T[] {
  const map = new Map<string, T>();
  newList.forEach(item => map.set(item.id, item));
  oldList.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

export const wevidsReducer = (state: WevidsState, action: WevidsAction): WevidsState => {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_ACTIVE_CONV_ID':
      return { ...state, activeConvId: action.payload };
    case 'SET_ACTIVE_CALL_USER':
      return { ...state, activeCallUser: action.payload };
    case 'SET_IS_CART_OPEN':
      return { ...state, isCartOpen: action.payload };
    case 'SET_IS_VIDEO_CALL_OPEN':
      return { ...state, isVideoCallOpen: action.payload };
    case 'OPEN_SHARE_MODAL':
      return { ...state, activeShare: { title: action.payload.title, url: action.payload.url } };
    case 'CLOSE_SHARE_MODAL':
      return { ...state, activeShare: null };
    case 'OPEN_USER_PROFILE_MODAL':
      return { ...state, viewingProfileUser: action.payload };
    case 'CLOSE_USER_PROFILE_MODAL':
      return { ...state, viewingProfileUser: null };
    case 'SET_IS_SUPABASE_MODAL_OPEN':
      return { ...state, isSupabaseModalOpen: action.payload };
    case 'UPDATE_CURRENT_USER':
      return { 
        ...state, 
        currentUser: { ...state.currentUser, ...action.payload },
        allUsers: {
          ...state.allUsers,
          [state.currentUser.id]: { ...state.currentUser, ...action.payload }
        }
      };
    case 'TOGGLE_FOLLOW_USER': {
      const { userId, isFollowing } = action.payload;
      const targetUser = state.allUsers[userId];
      if (!targetUser) return state;
      const currentFollowingIds = state.currentUser.followingIds || [];
      const newFollowingIds = isFollowing 
        ? currentFollowingIds.filter(id => id !== userId)
        : [...currentFollowingIds, userId];

      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          following: isFollowing ? Math.max(0, state.currentUser.following - 1) : state.currentUser.following + 1,
          followingIds: newFollowingIds
        },
        allUsers: {
          ...state.allUsers,
          [userId]: {
            ...targetUser,
            followers: isFollowing ? Math.max(0, targetUser.followers - 1) : targetUser.followers + 1,
          },
        },
      };
    }
    case 'TOGGLE_CLIP_LIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                likes: clip.isLiked ? clip.likes - 1 : clip.likes + 1, 
                isLiked: !clip.isLiked,
                isDisliked: false 
              }
            : clip
        ),
      };
    case 'TOGGLE_CLIP_DISLIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                dislikes: clip.isDisliked ? (clip.dislikes || 1) - 1 : (clip.dislikes || 0) + 1, 
                isDisliked: !clip.isDisliked,
                isLiked: false 
              }
            : clip
        ),
      };
    case 'TOGGLE_CLIP_BOOKMARK':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { ...clip, isBookmarked: !clip.isBookmarked }
            : clip
        ),
      };
    case 'ADD_CLIP_COMMENT':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                comments: [
                  {
                    id: `comm-${Date.now()}`,
                    user: action.payload.comment.user,
                    userName: action.payload.comment.userName,
                    userAvatar: action.payload.comment.userAvatar,
                    userColor: action.payload.comment.userColor,
                    text: action.payload.comment.text,
                    timestamp: 'Just now',
                    likes: 0
                  },
                  ...clip.comments
                ] 
              }
            : clip
        ),
      };
    case 'ADD_MESSAGE': {
      const { convId, message } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c => 
          c.id === convId 
            ? {
                ...c,
                lastMsg: `${message.senderName}: ${message.text || 'media'}`,
                time: 'Just now',
                messages: [...c.messages, message]
              }
            : c
        )
      };
    }
    case 'ADD_CONVERSATION': {
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        activeConvId: action.payload.id
      };
    }
    case 'SET_CONVERSATION_STATUS': {
      const { convId, status } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map(c => 
          c.id === convId ? { ...c, status } : c
        )
      };
    }
    case 'REMOVE_CONVERSATION': {
      return {
        ...state,
        conversations: state.conversations.filter(c => c.id !== action.payload.convId),
        activeConvId: state.activeConvId === action.payload.convId ? null : state.activeConvId
      };
    }
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.product.id === action.payload.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product: action.payload.product, quantity: 1 }] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.product.id !== action.payload.productId) };
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SOUND_ENABLED':
      return { ...state, soundEnabled: action.payload };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts.filter(p => p.id !== action.payload.id)] };
    case 'SET_POSTS':
      return { ...state, posts: mergeItems(action.payload, state.posts) };
    case 'ADD_CLIP':
      return { ...state, clips: [action.payload, ...state.clips.filter(c => c.id !== action.payload.id)] };
    case 'SET_CLIPS':
      return { ...state, clips: mergeItems(action.payload, state.clips) };
    case 'ADD_LONG_VIDEO':
      return { ...state, longVideos: [action.payload, ...state.longVideos] };
    case 'ADD_ROM':
      return { ...state, roms: [action.payload, ...state.roms.filter(r => r.id !== action.payload.id)] };
    case 'SET_ROMS':
      return { ...state, roms: mergeItems(action.payload, state.roms) };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products.filter(p => p.id !== action.payload.id)] };
    case 'SET_PRODUCTS':
      return { ...state, products: mergeItems(action.payload, state.products) };
    case 'ADD_SHARED_FILE':
      return { ...state, files: [action.payload, ...state.files.filter(f => f.id !== action.payload.id)] };
    case 'SET_SHARED_FILES':
      return { ...state, files: mergeItems(action.payload, state.files) };
    case 'ADD_AUDIO_TRACK':
      return { ...state, audioTracks: [action.payload, ...state.audioTracks.filter(a => a.id !== action.payload.id)] };
    case 'SET_AUDIO_TRACKS':
      return { ...state, audioTracks: mergeItems(action.payload, state.audioTracks) };
    case 'ADD_FILM':
      return { ...state, films: [action.payload, ...state.films.filter(f => f.id !== action.payload.id)] };
    case 'SET_FILMS':
      return { ...state, films: mergeItems(action.payload, state.films) };
    case 'SET_CLOUD_SYNCING':
      return { ...state, isCloudSyncing: action.payload };
    case 'SET_LAST_CLOUD_SYNC':
      return { ...state, lastCloudSync: action.payload };
    default:
      return state;
  }
};