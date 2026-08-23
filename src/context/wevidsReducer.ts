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
  ViewName,
  DirectMessageItem,
  CommentItem,
  CommentReply
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
  directMessages: DirectMessageItem[];
  
  activeView: ViewName;
  activeConvId: string | null;
  activeCallUser: string | null;
  isCartOpen: boolean;
  isVideoCallOpen: boolean;
  activeShare: { title: string; url: string } | null;
  viewingProfileUser: UserProfile | null;
  isSupabaseModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  
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
  directMessages: [],
  activeView: 'feed',
  activeConvId: null,
  activeCallUser: null,
  isCartOpen: false,
  isVideoCallOpen: false,
  activeShare: null,
  viewingProfileUser: null,
  isSupabaseModalOpen: false,
  isMobileSidebarOpen: false,
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
  | { type: 'SET_IS_MOBILE_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'UPDATE_CURRENT_USER'; payload: Partial<UserProfile> }
  | { type: 'SET_ALL_USERS'; payload: Record<string, UserProfile> }
  | { type: 'TOGGLE_FOLLOW_USER'; payload: { userId: string; isFollowing: boolean } }
  | { type: 'BLOCK_USER'; payload: { userId: string } }
  | { type: 'UNBLOCK_USER'; payload: { userId: string } }
  | { type: 'TOGGLE_POST_LIKE'; payload: { postId: string } }
  | { type: 'ADD_POST_COMMENT'; payload: { postId: string; comment: CommentItem } }
  | { type: 'TOGGLE_COMMENT_LIKE'; payload: { postId: string; commentId: string } }
  | { type: 'ADD_COMMENT_REPLY'; payload: { postId: string; commentId: string; reply: CommentReply } }
  | { type: 'TOGGLE_CLIP_LIKE'; payload: { clipId: string } }
  | { type: 'TOGGLE_CLIP_DISLIKE'; payload: { clipId: string } }
  | { type: 'TOGGLE_CLIP_BOOKMARK'; payload: { clipId: string } }
  | { type: 'ADD_CLIP_COMMENT'; payload: { clipId: string; comment: any } }
  | { type: 'ADD_MESSAGE'; payload: { convId: string; message: any } }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_DIRECT_MESSAGES'; payload: DirectMessageItem[] }
  | { type: 'SET_CONVERSATION_STATUS'; payload: { convId: string; status: 'active' | 'pending_request' | 'declined' | 'blocked' } }
  | { type: 'REMOVE_CONVERSATION'; payload: { convId: string } }
  | { type: 'ADD_TO_CART'; payload: { product: ProductItem } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_SOUND_ENABLED'; payload: boolean }
  | { type: 'ADD_POST'; payload: PostItem }
  | { type: 'DELETE_POST'; payload: { postId: string } }
  | { type: 'SET_POSTS'; payload: PostItem[] }
  | { type: 'ADD_CLIP'; payload: ShortClipItem }
  | { type: 'DELETE_CLIP'; payload: { clipId: string } }
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
  | { type: 'SET_LAST_CLOUD_SYNC'; payload: string }
  | { type: 'PURGE_ACCOUNT' };

export const wevidsReducer = (state: WevidsState, action: WevidsAction): WevidsState => {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload, isMobileSidebarOpen: false };
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
    case 'SET_IS_MOBILE_SIDEBAR_OPEN':
      return { ...state, isMobileSidebarOpen: action.payload };
    case 'UPDATE_CURRENT_USER':
      return { 
        ...state, 
        currentUser: { ...state.currentUser, ...action.payload },
        allUsers: {
          ...state.allUsers,
          [state.currentUser.id]: { ...state.currentUser, ...action.payload }
        }
      };
    case 'SET_ALL_USERS':
      return {
        ...state,
        allUsers: { ...state.allUsers, ...action.payload }
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
          following: isFollowing ? Math.max(0, (Number(state.currentUser.following) || 1) - 1) : (Number(state.currentUser.following) || 0) + 1,
          followingIds: newFollowingIds
        },
        allUsers: {
          ...state.allUsers,
          [userId]: {
            ...targetUser,
            followers: isFollowing ? Math.max(0, (Number(targetUser.followers) || 1) - 1) : (Number(targetUser.followers) || 0) + 1,
            followerIds: isFollowing 
              ? (targetUser.followerIds || []).filter(id => id !== state.currentUser.id)
              : [...(targetUser.followerIds || []), state.currentUser.id]
          },
        },
      };
    }
    case 'BLOCK_USER': {
      const { userId } = action.payload;
      const currentBlocked = state.currentUser.blockedUserIds || [];
      if (currentBlocked.includes(userId)) return state;
      const updatedBlocked = [...currentBlocked, userId];

      return {
        ...state,
        currentUser: { ...state.currentUser, blockedUserIds: updatedBlocked },
        posts: state.posts.filter(p => p.userId !== userId),
        clips: state.clips.filter(c => c.userId !== userId),
        conversations: state.conversations.map(conv => 
          conv.members.includes(userId) ? { ...conv, status: 'blocked' } : conv
        )
      };
    }
    case 'UNBLOCK_USER': {
      const { userId } = action.payload;
      const currentBlocked = state.currentUser.blockedUserIds || [];
      const updatedBlocked = currentBlocked.filter(id => id !== userId);

      return {
        ...state,
        currentUser: { ...state.currentUser, blockedUserIds: updatedBlocked },
        conversations: state.conversations.map(conv => 
          conv.members.includes(userId) && conv.status === 'blocked' ? { ...conv, status: 'active' } : conv
        )
      };
    }
    case 'TOGGLE_POST_LIKE':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? Math.max(0, (Number(p.likes) || 1) - 1) : (Number(p.likes) || 0) + 1
              }
            : p
        )
      };
    case 'ADD_POST_COMMENT':
      return {
        ...state,
        posts: state.posts.map(p =>
          p.id === action.payload.postId
            ? {
                ...p,
                comments: [action.payload.comment, ...(p.comments || [])]
              }
            : p
        )
      };
    case 'TOGGLE_COMMENT_LIKE':
      return {
        ...state,
        posts: state.posts.map(p => {
          if (p.id !== action.payload.postId) return p;
          return {
            ...p,
            comments: (p.comments || []).map(c => {
              if (c.id !== action.payload.commentId) return c;
              const newLiked = !c.isLiked;
              return {
                ...c,
                isLiked: newLiked,
                likes: newLiked ? (Number(c.likes) || 0) + 1 : Math.max(0, (Number(c.likes) || 1) - 1)
              };
            })
          };
        })
      };
    case 'ADD_COMMENT_REPLY':
      return {
        ...state,
        posts: state.posts.map(p => {
          if (p.id !== action.payload.postId) return p;
          return {
            ...p,
            comments: (p.comments || []).map(c => {
              if (c.id !== action.payload.commentId) return c;
              return {
                ...c,
                replies: [...(c.replies || []), action.payload.reply]
              };
            })
          };
        })
      };
    case 'TOGGLE_CLIP_LIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { 
                ...clip, 
                likes: clip.isLiked ? Math.max(0, (Number(clip.likes) || 1) - 1) : (Number(clip.likes) || 0) + 1, 
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
                dislikes: clip.isDisliked ? Math.max(0, (Number(clip.dislikes) || 1) - 1) : (Number(clip.dislikes) || 0) + 1, 
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
                comments: [action.payload.comment, ...(clip.comments || [])] 
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
                lastMsg: `${message.senderName || 'User'}: ${message.text || 'media'}`,
                time: 'Just now',
                messages: [...(c.messages || []), message]
              }
            : c
        )
      };
    }
    case 'ADD_CONVERSATION': {
      return {
        ...state,
        conversations: [action.payload, ...state.conversations.filter(c => c.id !== action.payload.id)],
        activeConvId: action.payload.id
      };
    }
    case 'SET_CONVERSATIONS': {
      return {
        ...state,
        conversations: action.payload,
        activeConvId: state.activeConvId || (action.payload[0]?.id || null)
      };
    }
    case 'SET_DIRECT_MESSAGES': {
      return {
        ...state,
        directMessages: action.payload
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
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_SOUND_ENABLED':
      return { ...state, soundEnabled: action.payload };
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts.filter(p => p.id !== action.payload.id)] };
    case 'DELETE_POST':
      return { 
        ...state, 
        posts: state.posts.filter(p => p.id !== action.payload.postId),
        clips: state.clips.filter(c => c.id !== action.payload.postId)
      };
    case 'SET_POSTS':
      return { ...state, posts: action.payload || [] };
    case 'ADD_CLIP':
      return { ...state, clips: [action.payload, ...state.clips.filter(c => c.id !== action.payload.id)] };
    case 'DELETE_CLIP':
      return { ...state, clips: state.clips.filter(c => c.id !== action.payload.clipId) };
    case 'SET_CLIPS':
      return { ...state, clips: action.payload || [] };
    case 'ADD_LONG_VIDEO':
      return { ...state, longVideos: [action.payload, ...state.longVideos] };
    case 'ADD_ROM':
      return { ...state, roms: [action.payload, ...state.roms.filter(r => r.id !== action.payload.id)] };
    case 'SET_ROMS':
      return { ...state, roms: action.payload || [] };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products.filter(p => p.id !== action.payload.id)] };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload || [] };
    case 'ADD_SHARED_FILE':
      return { ...state, files: [action.payload, ...state.files.filter(f => f.id !== action.payload.id)] };
    case 'SET_SHARED_FILES':
      return { ...state, files: action.payload || [] };
    case 'ADD_AUDIO_TRACK':
      return { ...state, audioTracks: [action.payload, ...state.audioTracks.filter(a => a.id !== action.payload.id)] };
    case 'SET_AUDIO_TRACKS':
      return { ...state, audioTracks: action.payload || [] };
    case 'ADD_FILM':
      return { ...state, films: [action.payload, ...state.films.filter(f => f.id !== action.payload.id)] };
    case 'SET_FILMS':
      return { ...state, films: action.payload || [] };
    case 'SET_CLOUD_SYNCING':
      return { ...state, isCloudSyncing: action.payload };
    case 'SET_LAST_CLOUD_SYNC':
      return { ...state, lastCloudSync: action.payload };
    case 'PURGE_ACCOUNT': {
      return {
        ...state,
        posts: state.posts.filter(p => p.userId !== state.currentUser.id),
        clips: state.clips.filter(c => c.userId !== state.currentUser.id),
        conversations: [],
        directMessages: []
      };
    }
    default:
      return state;
  }
};