import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  PostItem, 
  ShortClipItem, 
  LongVideoItem, 
  RomItem, 
  ProductItem, 
  Conversation, 
  UserProfile, 
  SharedFileItem, 
  AudioTrackItem, 
  FilmItem,
  ViewName 
} from '../types/wevids';
import { wevidsReducer, initialWevidsState, WevidsState } from './wevidsReducer';
import { INITIAL_AUDIO_TRACKS, INITIAL_FILMS } from '../data/mediaData';
import { supabase, isSupabaseConfigured, checkContentModeration, getStoredSession } from '../lib/supabase';
import { loadLocalSyncData, saveLocalSyncData, fetchGlobalCloudState, pushGlobalCloudState } from '../lib/syncService';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

export { INITIAL_AUDIO_TRACKS, INITIAL_FILMS } from '../data/mediaData';

export interface WevidsContextType extends WevidsState {
  addPost: (post: Partial<PostItem>) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  addClip: (clip: ShortClipItem) => Promise<void>;
  addLongVideo: (video: LongVideoItem) => void;
  addRom: (rom: Partial<RomItem>) => Promise<void>;
  addProduct: (product: ProductItem) => Promise<void>;
  addSharedFile: (file: Partial<SharedFileItem>) => Promise<void>;
  addAudioTrack: (track: Partial<AudioTrackItem>) => Promise<void>;
  addFilm: (film: Partial<FilmItem>) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  setActiveView: (view: ViewName) => void;
  setActiveConvId: (id: string | null) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsVideoCallOpen: (open: boolean) => void;
  openShareModal: (title: string, url: string) => void;
  closeShareModal: () => void;
  openUserProfileModal: (user: UserProfile) => void;
  closeUserProfileModal: () => void;
  setIsSupabaseModalOpen: (open: boolean) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  toggleFollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId?: string) => boolean;
  isMutualFriend: (userId?: string) => boolean;
  toggleClipLike: (clipId: string) => void;
  toggleClipDislike: (clipId: string) => void;
  toggleClipBookmark: (clipId: string) => void;
  addClipComment: (clipId: string, comment: any) => void;
  startOrOpenChatWithUser: (userId: string) => void;
  sendMessage: (convId: string, message: any) => Promise<void>;
  acceptMessageRequest: (convId: string) => Promise<void>;
  declineMessageRequest: (convId: string) => Promise<void>;
  blockMessageUser: (convId: string) => Promise<void>;
  openVideoCall: (userName: string) => void;
  closeVideoCall: () => void;
  addToCart: (product: ProductItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const WevidsContext = createContext<WevidsContextType | undefined>(undefined);

export const WevidsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wevidsReducer, initialWevidsState);

  useEffect(() => {
    sounds.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  // Check on boot if active account session exists
  useEffect(() => {
    const session = getStoredSession();
    if (session?.user) {
      const email = session.user.email || 'user@wevids.app';
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
      const avatarImg = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
      dispatch({
        type: 'UPDATE_CURRENT_USER',
        payload: {
          id: session.user.id || 'auth_user',
          name,
          handle: `@${name.toLowerCase().replace(/\s+/g, '_')}`,
          avatar: name.charAt(0).toUpperCase() || 'U',
          avatarImage: avatarImg,
          verified: true,
          isGuest: false,
          email,
        }
      });
    }
  }, []);

  // Sync state across tabs and devices
  const syncWithSupabase = async () => {
    dispatch({ type: 'SET_CLOUD_SYNCING', payload: true });
    
    try {
      const cloudData = await fetchGlobalCloudState();
      if (cloudData) {
        if (cloudData.posts && cloudData.posts.length > 0) {
          dispatch({ type: 'SET_POSTS', payload: cloudData.posts });
        }

        if (cloudData.clips && cloudData.clips.length > 0) {
          dispatch({ type: 'SET_CLIPS', payload: cloudData.clips });
        }

        if (cloudData.audioTracks && cloudData.audioTracks.length > 0) {
          dispatch({ type: 'SET_AUDIO_TRACKS', payload: cloudData.audioTracks });
        }

        if (cloudData.films && cloudData.films.length > 0) {
          dispatch({ type: 'SET_FILMS', payload: cloudData.films });
        }

        if (cloudData.roms && cloudData.roms.length > 0) {
          dispatch({ type: 'SET_ROMS', payload: cloudData.roms });
        }

        if (cloudData.files && cloudData.files.length > 0) {
          dispatch({ type: 'SET_SHARED_FILES', payload: cloudData.files });
        }

        if (cloudData.products && cloudData.products.length > 0) {
          dispatch({ type: 'SET_PRODUCTS', payload: cloudData.products });
        }
      }

      dispatch({ type: 'SET_LAST_CLOUD_SYNC', payload: new Date().toLocaleTimeString() });
    } catch {
      // Safe offline fallback
    } finally {
      dispatch({ type: 'SET_CLOUD_SYNCING', payload: false });
    }
  };

  // Initial load + immediate sync on tab focus + 4-second poll
  useEffect(() => {
    syncWithSupabase();
    
    const handleFocus = () => {
      syncWithSupabase();
    };
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(syncWithSupabase, 4000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const addPost = async (post: Partial<PostItem>): Promise<boolean> => {
    const moderation = checkContentModeration(post.content || '');
    if (moderation.flagged) {
      toast.error(moderation.reason || 'Post violates community guidelines.');
      return false;
    }

    const fullPost: PostItem = {
      id: post.id || `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: post.userId || state.currentUser.id,
      authorName: post.authorName || state.currentUser.name,
      authorHandle: post.authorHandle || state.currentUser.handle,
      authorAvatar: post.authorAvatar || state.currentUser.avatar,
      authorColor: post.authorColor || state.currentUser.color,
      location: post.location || state.currentUser.location,
      time: 'Just now',
      content: post.content || '',
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType || (post.mediaUrl ? 'image' : undefined),
      likes: post.likes || 0,
      dislikes: post.dislikes || 0,
      shares: post.shares || 0,
      comments: post.comments || [],
      tags: post.tags || [],
      created_at: new Date().toISOString()
    };

    sounds.success();
    toast.success('Post published and broadcasted to all devices!');
    dispatch({ type: 'ADD_POST', payload: fullPost });

    const currentPosts = [fullPost, ...state.posts.filter(p => p.id !== fullPost.id)];
    pushGlobalCloudState({ posts: currentPosts });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('posts', fullPost);
      } catch {
        // Safe offline
      }
    }
    return true;
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    sounds.pop();
    dispatch({ type: 'DELETE_POST', payload: { postId } });
    toast.success('Post deleted successfully.');

    const updatedPosts = state.posts.filter(p => p.id !== postId);
    pushGlobalCloudState({ posts: updatedPosts });

    if (isSupabaseConfigured()) {
      try {
        await supabase.delete('posts', 'id', postId);
      } catch {
        // Safe offline
      }
    }
    return true;
  };

  const addClip = async (clip: ShortClipItem) => {
    sounds.success();
    toast.success('Clip published to Global Shorts on all devices!');
    dispatch({ type: 'ADD_CLIP', payload: clip });

    const currentClips = [clip, ...state.clips.filter(c => c.id !== clip.id)];
    pushGlobalCloudState({ clips: currentClips });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('clips', clip);
      } catch {
        // Safe offline
      }
    }
  };

  const addAudioTrack = async (track: Partial<AudioTrackItem>) => {
    const fullTrack: AudioTrackItem = {
      id: track.id || `audio-${Date.now()}`,
      title: track.title || 'Uploaded Audio Track',
      artist: track.artist || state.currentUser.name,
      duration: track.duration || '03:20',
      genre: track.genre || 'Cyber Lo-Fi / Synth',
      bpm: track.bpm || 120,
      url: track.url || '',
      cover: track.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
      uploaderId: state.currentUser.id,
      createdAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_AUDIO_TRACK', payload: fullTrack });
    sounds.success();
    toast.success(`"${fullTrack.title}" synced to Audio Deck!`);

    const currentTracks = [fullTrack, ...state.audioTracks.filter(a => a.id !== fullTrack.id)];
    pushGlobalCloudState({ audioTracks: currentTracks });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('audio_tracks', fullTrack);
      } catch {
        // Safe offline
      }
    }
  };

  const addFilm = async (film: Partial<FilmItem>) => {
    const fullFilm: FilmItem = {
      id: film.id || `film-${Date.now()}`,
      title: film.title || 'New Cinema Feature',
      synopsis: film.synopsis || 'Full HD Feature Film.',
      director: film.director || state.currentUser.name,
      releaseYear: film.releaseYear || 2026,
      duration: film.duration || '1h 30m',
      genre: film.genre || 'Cyberpunk Sci-Fi',
      rating: film.rating || 5.0,
      videoUrl: film.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      posterUrl: film.posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      backdropUrl: film.backdropUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80',
      uploaderId: state.currentUser.id,
      views: '1.2K'
    };

    dispatch({ type: 'ADD_FILM', payload: fullFilm });
    sounds.success();
    toast.success(`Film "${fullFilm.title}" premiered and synced!`);

    const currentFilms = [fullFilm, ...state.films.filter(f => f.id !== fullFilm.id)];
    pushGlobalCloudState({ films: currentFilms });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('films', fullFilm);
      } catch {
        // Safe offline
      }
    }
  };

  const addRom = async (rom: Partial<RomItem>) => {
    const fullRom: RomItem = {
      id: `rom-${Date.now()}`,
      title: rom.title || 'New ROM Build',
      device: rom.device || 'Generic Device',
      brand: rom.brand || 'Xiaomi / Redmi',
      romType: rom.romType || 'China ROM Port',
      status: rom.status || 'Official',
      maintainer: rom.maintainer || state.currentUser.name,
      maintainerHandle: rom.maintainerHandle || state.currentUser.handle,
      version: rom.version || 'v1.0',
      androidVersion: rom.androidVersion || 'Android 15',
      fileSize: rom.fileSize || '4.5 GB',
      checksum: rom.checksum || '8f92ab1c09',
      downloadCount: 0,
      downloadUrl: rom.downloadUrl || '#',
      githubUrl: rom.githubUrl,
      releaseDate: 'Today',
      changelog: rom.changelog || ['Initial release build']
    };
    sounds.success();
    toast.success('ROM package submitted and synced to Vault!');
    dispatch({ type: 'ADD_ROM', payload: fullRom });

    const currentRoms = [fullRom, ...state.roms.filter(r => r.id !== fullRom.id)];
    pushGlobalCloudState({ roms: currentRoms });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('roms', fullRom);
      } catch {
        // Safe offline
      }
    }
  };

  const addProduct = async (product: ProductItem) => {
    sounds.success();
    toast.success('Product added to Mall!');
    dispatch({ type: 'ADD_PRODUCT', payload: product });

    const currentProds = [product, ...state.products.filter(p => p.id !== product.id)];
    pushGlobalCloudState({ products: currentProds });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('products', product);
      } catch {
        // Safe offline
      }
    }
  };

  const addSharedFile = async (file: Partial<SharedFileItem>) => {
    const fullFile: SharedFileItem = {
      id: `file-${Date.now()}`,
      title: file.title || 'Shared File',
      fileName: file.fileName || 'archive.zip',
      fileSize: file.fileSize || '10.0 MB',
      category: file.category || 'ROM / Kernel',
      uploaderId: file.uploaderId || state.currentUser.id,
      uploaderName: file.uploaderName || state.currentUser.name,
      downloadUrl: file.downloadUrl || '#',
      checksum: file.checksum || 'sha256_mock_hash',
      downloads: 0,
      uploadedAt: 'Just now'
    };
    sounds.success();
    toast.success('File package shared to Vault on all devices!');
    dispatch({ type: 'ADD_SHARED_FILE', payload: fullFile });

    const currentFiles = [fullFile, ...state.files.filter(f => f.id !== fullFile.id)];
    pushGlobalCloudState({ files: currentFiles });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('files', fullFile);
      } catch {
        // Safe offline
      }
    }
  };

  const addLongVideo = (video: LongVideoItem) => {
    sounds.success();
    toast.success('Long video added!');
    dispatch({ type: 'ADD_LONG_VIDEO', payload: video });
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
    // Ensure this user exists in directory
    if (user && user.id && !state.allUsers[user.id]) {
      dispatch({
        type: 'UPDATE_CURRENT_USER',
        payload: {} // Trigger state pass
      });
    }
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

  const isFollowing = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    return (state.currentUser.followingIds || []).includes(userId);
  };

  const isMutualFriend = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    const targetUser = state.allUsers[userId];
    const followingThem = (state.currentUser.followingIds || []).includes(userId);
    const theyFollowMe = (targetUser?.followerIds || []).includes(state.currentUser.id) || 
                         (targetUser?.followingIds || []).includes(state.currentUser.id);
    return Boolean(followingThem && theyFollowMe);
  };

  const toggleFollowUser = async (userId: string) => {
    sounds.click();
    const currentlyFollowing = isFollowing(userId);
    dispatch({ type: 'TOGGLE_FOLLOW_USER', payload: { userId, isFollowing: currentlyFollowing } });

    if (!currentlyFollowing) {
      const targetUser = state.allUsers[userId];
      const targetFollowsMe = (targetUser?.followingIds || []).includes(state.currentUser.id);

      if (targetFollowsMe) {
        sounds.success();
        toast.success(`You and ${targetUser?.name || 'this creator'} are now mutual friends! Direct messaging unlocked. 🤝`);
      } else {
        toast.success('Following creator! 🚀');
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase.insert('follows', {
            follower_id: state.currentUser.id,
            following_id: userId,
          });
        } catch {
          // Safe offline
        }
      }
    } else {
      toast.info('Unfollowed creator.');
      if (isSupabaseConfigured()) {
        try {
          await supabase.delete('follows', 'follower_id', state.currentUser.id);
        } catch {
          // Safe offline
        }
      }
    }
  };

  const toggleClipLike = (clipId: string) => {
    sounds.like();
    dispatch({ type: 'TOGGLE_CLIP_LIKE', payload: { clipId } });
  };

  const toggleClipDislike = (clipId: string) => {
    sounds.pop();
    dispatch({ type: 'TOGGLE_CLIP_DISLIKE', payload: { clipId } });
  };

  const toggleClipBookmark = (clipId: string) => {
    sounds.click();
    dispatch({ type: 'TOGGLE_CLIP_BOOKMARK', payload: { clipId } });
    toast.success('Saved to your Library collections!');
  };

  const addClipComment = (clipId: string, comment: any) => {
    sounds.pop();
    dispatch({ type: 'ADD_CLIP_COMMENT', payload: { clipId, comment } });
  };

  // Safe Start or Open Chat with Any User (Guest or Real Account)
  const startOrOpenChatWithUser = (userId: string) => {
    sounds.click();
    const isFriend = isMutualFriend(userId);

    const existingConv = state.conversations.find(c => 
      !c.isGroup && c.members.includes(userId) && c.members.includes(state.currentUser.id)
    );
    
    if (existingConv) {
      dispatch({ type: 'SET_ACTIVE_CONV_ID', payload: existingConv.id });
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'messages' });
    } else {
      const otherUser = state.allUsers[userId] || {
        id: userId,
        name: userId.startsWith('guest-') ? `Guest_${userId.replace('guest-', '')}` : `Creator_${userId.slice(0, 5)}`,
        avatar: userId.startsWith('guest-') ? 'G' : 'C',
        color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        handle: `@${userId}`,
        followers: 0,
        following: 0,
        location: 'Earth Node',
        bio: 'WEVIDS creator',
        videos: 0,
        likes: 0,
        views: '0',
        joined: '2026',
        walletBalance: 0,
        isGuest: userId.startsWith('guest-')
      };

      const newConv: Conversation = {
        id: `conv-${state.currentUser.id}-${userId}`,
        isGroup: false,
        avatar: otherUser.avatar || 'U',
        color: otherUser.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        members: [state.currentUser.id, userId],
        lastMsg: isFriend ? 'Mutual friends connected' : 'Message request initiated',
        time: 'Just now',
        unread: 0,
        messages: [],
        status: isFriend ? 'active' : 'pending_request',
        requestedBy: state.currentUser.id,
      };

      dispatch({ type: 'ADD_CONVERSATION', payload: newConv });
      dispatch({ type: 'SET_ACTIVE_CONV_ID', payload: newConv.id });
      dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'messages' });
    }
  };

  const sendMessage = async (convId: string, message: any) => {
    const activeConv = state.conversations.find(c => c.id === convId);
    if (!activeConv) return;

    const receiverId = activeConv.members.find(m => m !== state.currentUser.id) || '';
    const isFriend = isMutualFriend(receiverId);

    // Blocked check
    if (activeConv.status === 'blocked') {
      toast.error('Cannot send message. Communication is blocked.');
      return;
    }

    sounds.pop();
    const newMessage = {
      id: `msg-${Date.now()}`,
      fromId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderAvatar: state.currentUser.avatar,
      senderColor: state.currentUser.color,
      text: message.text,
      type: message.type || 'text',
      mediaUrl: message.mediaUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_friend_request: !isFriend,
      is_approved: isFriend ? true : null
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: { convId, message: newMessage } });

    if (isSupabaseConfigured() && receiverId) {
      try {
        await supabase.insert('direct_messages', {
          id: newMessage.id,
          sender_id: state.currentUser.id,
          receiver_id: receiverId,
          content: message.text || (message.type ? `[${message.type}]` : 'Media'),
          is_friend_request: !isFriend,
          is_approved: isFriend ? true : null,
          is_blocked: false,
          created_at: new Date().toISOString()
        });
      } catch {
        // Safe offline
      }
    }
  };

  const acceptMessageRequest = async (convId: string) => {
    sounds.success();
    const activeConv = state.conversations.find(c => c.id === convId);
    if (activeConv) {
      const partnerId = activeConv.members.find(m => m !== state.currentUser.id);
      if (partnerId) {
        dispatch({ type: 'TOGGLE_FOLLOW_USER', payload: { userId: partnerId, isFollowing: false } });
      }
    }
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'active' } });
    toast.success('Message request accepted! You are now mutual friends. 🤝');

    if (isSupabaseConfigured()) {
      try {
        await supabase.update('direct_messages', 'receiver_id', state.currentUser.id, {
          is_approved: true,
          is_friend_request: false,
        });
      } catch {
        // Safe offline
      }
    }
  };

  const declineMessageRequest = async (convId: string) => {
    sounds.click();
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'declined' } });
    toast.info('Message request declined.');

    if (isSupabaseConfigured()) {
      try {
        await supabase.update('direct_messages', 'receiver_id', state.currentUser.id, {
          is_approved: false,
        });
      } catch {
        // Safe offline
      }
    }
  };

  const blockMessageUser = async (convId: string) => {
    sounds.pop();
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'blocked' } });
    toast.error('User blocked from messaging you.');

    if (isSupabaseConfigured()) {
      try {
        await supabase.update('direct_messages', 'receiver_id', state.currentUser.id, {
          is_blocked: true,
        });
      } catch {
        // Safe offline
      }
    }
  };

  const openVideoCall = (userName: string) => {
    sounds.success();
    dispatch({ type: 'SET_ACTIVE_CALL_USER', payload: userName });
    setIsVideoCallOpen(true);
  };

  const closeVideoCall = () => {
    sounds.pop();
    setIsVideoCallOpen(false);
    dispatch({ type: 'SET_ACTIVE_CALL_USER', payload: null });
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
    dispatch({ type: 'CLEAR_CART' });
  };

  const setSoundEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_SOUND_ENABLED', payload: enabled });
  };

  const value: WevidsContextType = {
    ...state,
    addPost,
    deletePost,
    addClip,
    addLongVideo,
    addRom,
    addProduct,
    addSharedFile,
    addAudioTrack,
    addFilm,
    syncWithSupabase,
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
    isFollowing,
    isMutualFriend,
    toggleClipLike,
    toggleClipDislike,
    toggleClipBookmark,
    addClipComment,
    startOrOpenChatWithUser,
    sendMessage,
    acceptMessageRequest,
    declineMessageRequest,
    blockMessageUser,
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