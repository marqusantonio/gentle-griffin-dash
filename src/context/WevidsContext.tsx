import React, { createContext, useContext, useReducer, useState, useEffect, ReactNode } from 'react';
import { PostItem, ShortClipItem, LongVideoItem, RomItem, ProductItem, Conversation, UserProfile, CartItem, SavedCollection, SharedFileItem, ViewName } from '../types/wevids';
import { supabase, isSupabaseConfigured, getStoredSession } from '../lib/supabase';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

// Types
interface WevidsState {
  // Core content
  posts: PostItem[];
  clips: ShortClipItem[];
  longVideos: LongVideoItem[];
  roms: RomItem[];
  products: ProductItem[];
  files: SharedFileItem[];
  
  // UI state
  activeView: ViewName;
  activeConvId: string | null;
  isCartOpen: boolean;
  isVideoCallOpen: boolean;
  activeShare: { title: string; url: string } | null;
  viewingProfileUser: UserProfile | null;
  isSupabaseModalOpen: boolean;
  
  // User & auth
  currentUser: UserProfile;
  allUsers: Record<string, UserProfile>;
  soundEnabled: boolean;
  
  // Cart & bookmarks
  cart: CartItem[];
  collections: SavedCollection[];
}

interface WevidsActions {
  // Content actions
  addPost: (post: PostItem) => Promise<void>;
  addClip: (clip: ShortClipItem) => void;
  addLongVideo: (video: LongVideoItem) => void;
  addRom: (rom: RomItem) => void;
  addProduct: (product: ProductItem) => void;
  addSharedFile: (file: SharedFileItem) => void;
  
  // UI actions
  setActiveView: (view: ViewName) => void;
  setActiveConvId: (id: string | null) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsVideoCallOpen: (open: boolean) => void;
  openShareModal: (title: string, url: string) => void;
  closeShareModal: () => void;
  openUserProfileModal: (user: UserProfile) => void;
  closeUserProfileModal: () => void;
  setIsSupabaseModalOpen: (open: boolean) => void;
  
  // User actions
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  toggleFollowUser: (userId: string) => void;
  toggleClipLike: (clipId: string) => void;
  toggleClipDislike: (clipId: string) => void;
  toggleClipBookmark: (clipId: string) => void;
  addClipComment: (clipId: string, comment: any) => void;
  startOrOpenChatWithUser: (userId: string) => void;
  sendMessage: (convId: string, message: any) => void;
  acceptMessageRequest: (convId: string) => void;
  declineMessageRequest: (convId: string) => void;
  openVideoCall: (userName: string) => void;
  closeVideoCall: () => void;
  
  // Cart actions
  addToCart: (product: ProductItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Sound
  setSoundEnabled: (enabled: boolean) => void;
}

// Initial state
const initialUser: UserProfile = {
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

const initialState: WevidsState = {
  posts: [],
  clips: [],
  longVideos: [],
  roms: [],
  products: [],
  files: [],
  activeView: 'feed',
  activeConvId: null,
  isCartOpen: false,
  isVideoCallOpen: false,
  activeShare: null,
  viewingProfileUser: null,
  isSupabaseModalOpen: false,
  currentUser: initialUser,
  allUsers: {
    you: initialUser,
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
  },
  soundEnabled: true,
  cart: [],
  collections: [],
};

// Reducer
const reducer = (state: WevidsState, action: any): WevidsState => {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_ACTIVE_CONV_ID':
      return { ...state, activeConvId: action.payload };
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
      return { ...state, currentUser: { ...state.currentUser, ...action.payload } };
    case 'TOGGLE_FOLLOW_USER':
      return {
        ...state,
        allUsers: {
          ...state.allUsers,
          [action.payload.userId]: {
            ...state.allUsers[action.payload.userId],
            followers: action.payload.isFollowing
              ? state.allUsers[action.payload.userId].followers + 1
              : state.allUsers[action.payload.userId].followers - 1,
          },
        },
      };
    case 'TOGGLE_CLIP_LIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { ...clip, likes: clip.isLiked ? clip.likes - 1 : clip.likes + 1, isLiked: !clip.isLiked }
            : clip
        ),
      };
    case 'TOGGLE_CLIP_DISLIKE':
      return {
        ...state,
        clips: state.clips.map(clip =>
          clip.id === action.payload.clipId
            ? { ...clip, dislikes: action.payload.isDisliked ? clip.dislikes - 1 : clip.dislikes + 1, isDisliked: !clip.isDisliked }
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
            ? { ...clip, comments: [...clip.comments, action.payload.comment] }
            : clip
        ),
      };
    case 'ADD_TO_CART':
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
      return { ...state, posts: [action.payload, ...state.posts] };
    case 'ADD_CLIP':
      return { ...state, clips: [action.payload, ...state.clips] };
    case 'ADD_LONG_VIDEO':
      return { ...state, longVideos: [action.payload, ...state.longVideos] };
    case 'ADD_ROM':
      return { ...state, roms: [action.payload, ...state.roms] };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'ADD_SHARED_FILE':
      return { ...state, files: [action.payload, ...state.files] };
    default:
      return state;
  }
};

// Context
const WevidsContext = createContext<{
  state: WevidsState;
  dispatch: React.Dispatch<any>;
} | undefined>(undefined);

// Provider
export const WevidsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize data from localStorage and Supabase
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load from localStorage as fallback
        const savedPosts = localStorage.getItem('wevids_posts');
        const savedClips = localStorage.getItem('wevids_clips');
        const savedVideos = localStorage.getItem('wevids_videos');
        
        if (savedPosts) {
          dispatch({ type: 'ADD_POST', payload: JSON.parse(savedPosts) });
        }
        if (savedClips) {
          dispatch({ type: 'ADD_CLIP', payload: JSON.parse(savedClips) });
        }
        if (savedVideos) {
          dispatch({ type: 'ADD_LONG_VIDEO', payload: JSON.parse(savedVideos) });
        }

        // Try to load from Supabase if configured
        if (isSupabaseConfigured()) {
          try {
            const { data: supabasePosts } = await supabase
              .from('posts')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (supabasePosts?.length) {
              supabasePosts.forEach(post => {
                dispatch({ type: 'ADD_POST', payload: post });
              });
            }
          } catch (err) {
            console.log('Supabase posts load failed, using localStorage:', err);
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization failed:', err);
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  // Save to localStorage when posts change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('wevids_posts', JSON.stringify(state.posts));
    }
  }, [state.posts, isInitialized]);

  // Actions
  const addPost = async (post: PostItem) => {
    sounds.success();
    toast.success('Post created successfully!');
    
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert([post])
          .select();
        if (error) throw error;
        if (data) {
          dispatch({ type: 'ADD_POST', payload: data[0] });
        }
      } catch (err) {
        console.error('Supabase post failed, using localStorage:', err);
        dispatch({ type: 'ADD_POST', payload: post });
      }
    } else {
      dispatch({ type: 'ADD_POST', payload: post });
    }
  };

  const addClip = (clip: ShortClipItem) => {
    sounds.success();
    toast.success('Clip added!');
    dispatch({ type: 'ADD_CLIP', payload: clip });
  };

  const addLongVideo = (video: LongVideoItem) => {
    sounds.success();
    toast.success('Long video added!');
    dispatch({ type: 'ADD_LONG_VIDEO', payload: video });
  };

  const addRom = (rom: RomItem) => {
    sounds.success();
    toast.success('ROM added!');
    dispatch({ type: 'ADD_ROM', payload: rom });
  };

  const addProduct = (product: ProductItem) => {
    sounds.success();
    toast.success('Product added!');
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const addSharedFile = (file: SharedFileItem) => {
    sounds.success();
    toast.success('File added!');
    dispatch({ type: 'ADD_SHARED_FILE', payload: file });
  };

  const setActiveView = (view: ViewName) => {
    sounds.click();
    dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
  };

  const setActiveConvId = (id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CONV_ID', payload: id });
  };

  const setIsCartOpen = (open: boolean) => {
    dispatch({ type: 'SET_IS_CART_OPEN', payload: open });
  };

  const setIsVideoCallOpen = (open: boolean) => {
    dispatch({ type: 'SET_IS_VIDEO_CALL_OPEN', payload: open });
  };

  const openShareModal = (title: string, url: string) => {
    sounds.click();
    dispatch({ type: 'OPEN_SHARE_MODAL', payload: { title, url } });
  };

  const closeShareModal = () => {
    dispatch({ type: 'CLOSE_SHARE_MODAL' });
  };

  const openUserProfileModal = (user: UserProfile) => {
    sounds.click();
    dispatch({ type: 'OPEN_USER_PROFILE_MODAL', payload: user });
  };

  const closeUserProfileModal = () => {
    dispatch({ type: 'CLOSE_USER_PROFILE_MODAL' });
  };

  const setIsSupabaseModalOpen = (open: boolean) => {
    dispatch({ type: 'SET_IS_SUPABASE_MODAL_OPEN', payload: open });
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    sounds.pop();
    dispatch({ type: 'UPDATE_CURRENT_USER', payload: updates });
  };

  const toggleFollowUser = (userId: string) => {
    sounds.click();
    const user = state.allUsers[userId];
    const isFollowing = user.followers > 0;
    dispatch({ type: 'TOGGLE_FOLLOW_USER', payload: { userId, isFollowing } });
  };

  const toggleClipLike = (clipId: string) => {
    sounds.click();
    dispatch({ type: 'TOGGLE_CLIP_LIKE', payload: { clipId } });
  };

  const toggleClipDislike = (clipId: string) => {
    sounds.click();
    const clip = state.clips.find(c => c.id === clipId);
    const isDisliked = clip?.isDisliked;
    dispatch({ type: 'TOGGLE_CLIP_DISLIKE', payload: { clipId, isDisliked } });
  };

  const toggleClipBookmark = (clipId: string) => {
    sounds.click();
    dispatch({ type: 'TOGGLE_CLIP_BOOKMARK', payload: { clipId } });
  };

  const addClipComment = (clipId: string, comment: any) => {
    sounds.pop();
    dispatch({ type: 'ADD_CLIP_COMMENT', payload: { clipId, comment } });
  };

  const startOrOpenChatWithUser = (userId: string) => {
    sounds.click();
    const existingConv = state.conversations.find(c => 
      !c.isGroup && c.members.includes(userId) && c.members.includes(state.currentUser.id)
    );
    
    if (existingConv) {
      setActiveConvId(existingConv.id);
    } else {
      const otherUser = state.allUsers[userId];
      const newConv: Conversation = {
        id: `conv-${userId}`,
        isGroup: false,
        avatar: otherUser.avatar,
        color: otherUser.color,
        members: [state.currentUser.id, userId],
        lastMsg: 'Start conversation...',
        time: 'Just now',
        unread: 0,
        messages: [],
        status: 'active',
      };
      setActiveConvId(newConv.id);
    }
  };

  const sendMessage = (convId: string, message: any) => {
    sounds.pop();
    const conv = state.conversations.find(c => c.id === convId);
    if (conv) {
      const newMessage: any = {
        id: `msg-${Date.now()}`,
        fromId: state.currentUser.id,
        senderName: state.currentUser.name,
        senderAvatar: state.currentUser.avatar,
        senderColor: state.currentUser.color,
        text: message.text,
        type: message.type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: { convId, message: newMessage } });
    }
  };

  const acceptMessageRequest = (convId: string) => {
    sounds.success();
    toast.success('Message request accepted!');
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'active' } });
  };

  const declineMessageRequest = (convId: string) => {
    sounds.click();
    toast.info('Message request declined');
    dispatch({ type: 'REMOVE_CONVERSATION', payload: { convId } });
  };

  const openVideoCall = (userName: string) => {
    sounds.success();
    setIsVideoCallOpen(true);
    toast.success(`Starting video call with ${userName}`);
  };

  const closeVideoCall = () => {
    sounds.pop();
    setIsVideoCallOpen(false);
    toast.info('Video call ended');
  };

  const addToCart = (product: ProductItem) => {
    sounds.success();
    toast.success(`${product.title} added to cart!`);
    dispatch({ type: 'ADD_TO_CART', payload: { product } });
  };

  const removeFromCart = (productId: string) => {
    sounds.click();
    toast.info('Item removed from cart');
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    sounds.pop();
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    sounds.click();
    toast.info('Cart cleared');
    dispatch({ type: 'CLEAR_CART' });
  };

  const setSoundEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_SOUND_ENABLED', payload: enabled });
  };

  const value = {
    state,
    dispatch,
    // Actions
    addPost,
    addClip,
    addLongVideo,
    addRom,
    addProduct,
    addSharedFile,
    setActiveView,
    setActiveConvId,
    setIsCartOpen,
    setIsVideoCallOpen,
    openShareModal,
    closeShareModal,
    openUserProfileModal,
    closeUserProfileModal,
    setIsSupabaseModalOpen,
    updateCurrentUser,
    toggleFollowUser,
    toggleClipLike,
    toggleClipDislike,
    toggleClipBookmark,
    addClipComment,
    startOrOpenChatWithUser,
    sendMessage,
    acceptMessageRequest,
    declineMessageRequest,
    openVideoCall,
    closeVideoCall,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    setSoundEnabled,
  };

  return <WevidsContext.Provider value={value}>{children}</WevidsContext.Provider>;
};

export const useWevids = () => {
  const context = useContext(WevidsContext);
  if (context === undefined) {
    throw new Error('useWevids must be used within a WevidsProvider');
  }
  return context;
};