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
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

export { INITIAL_AUDIO_TRACKS, INITIAL_FILMS } from '../data/mediaData';

export interface WevidsContextType extends WevidsState {
  addPost: (post: Partial<PostItem>) => Promise<void>;
  addClip: (clip: ShortClipItem) => void;
  addLongVideo: (video: LongVideoItem) => void;
  addRom: (rom: Partial<RomItem>) => void;
  addProduct: (product: ProductItem) => void;
  addSharedFile: (file: Partial<SharedFileItem>) => void;
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
  toggleFollowUser: (userId: string) => void;
  isFollowing: (userId?: string) => boolean;
  isMutualFriend: (userId?: string) => boolean;
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

  const syncWithSupabase = async () => {
    if (!isSupabaseConfigured()) return;

    dispatch({ type: 'SET_CLOUD_SYNCING', payload: true });
    
    try {
      const [audioRes, filmRes] = await Promise.all([
        supabase.select('audio_tracks'),
        supabase.select('films'),
      ]);

      if (audioRes.data && Array.isArray(audioRes.data) && audioRes.data.length > 0) {
        const mappedAudio: AudioTrackItem[] = audioRes.data.map(item => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          duration: item.duration || '03:30',
          genre: item.genre || 'Cyberpunk',
          bpm: item.bpm || 120,
          url: item.url,
          cover: item.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
          uploaderId: item.uploader_id,
          createdAt: item.created_at
        }));
        
        const existingIds = new Set(mappedAudio.map(a => a.id));
        const combined = [...mappedAudio, ...INITIAL_AUDIO_TRACKS.filter(a => !existingIds.has(a.id))];
        dispatch({ type: 'SET_AUDIO_TRACKS', payload: combined });
      }

      if (filmRes.data && Array.isArray(filmRes.data) && filmRes.data.length > 0) {
        const mappedFilms: FilmItem[] = filmRes.data.map(item => ({
          id: item.id,
          title: item.title,
          synopsis: item.synopsis || '',
          director: item.director || 'Director',
          releaseYear: item.release_year || 2026,
          duration: item.duration || '1h 30m',
          genre: item.genre || 'Cyberpunk Sci-Fi',
          rating: item.rating || 5.0,
          videoUrl: item.video_url || item.url,
          posterUrl: item.poster_url || item.poster,
          backdropUrl: item.backdrop_url || item.backdrop,
          uploaderId: item.uploader_id,
          views: item.views || '1.5K'
        }));

        const existingFilmIds = new Set(mappedFilms.map(f => f.id));
        const combinedFilms = [...mappedFilms, ...INITIAL_FILMS.filter(f => !existingFilmIds.has(f.id))];
        dispatch({ type: 'SET_FILMS', payload: combinedFilms });
      }

      dispatch({ type: 'SET_LAST_CLOUD_SYNC', payload: new Date().toLocaleTimeString() });
    } catch {
      // Safe offline fallback
    } finally {
      dispatch({ type: 'SET_CLOUD_SYNCING', payload: false });
    }
  };

  useEffect(() => {
    syncWithSupabase();
  }, []);

  const addPost = async (post: Partial<PostItem>) => {
    const fullPost: PostItem = {
      id: `post-${Date.now()}`,
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
      likes: 0,
      dislikes: 0,
      shares: 0,
      comments: [],
      tags: post.tags || []
    };

    sounds.success();
    toast.success('Post published to Global Feed!');
    dispatch({ type: 'ADD_POST', payload: fullPost });

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('posts', {
          id: fullPost.id,
          user_id: fullPost.userId,
          author_name: fullPost.authorName,
          author_handle: fullPost.authorHandle,
          author_avatar: fullPost.authorAvatar,
          author_color: fullPost.authorColor,
          content: fullPost.content,
          media_url: fullPost.mediaUrl,
          media_type: fullPost.mediaType,
          likes: fullPost.likes,
          shares: fullPost.shares,
          tags: fullPost.tags
        });
      } catch {
        // Offline safe
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
    toast.success(`"${fullTrack.title}" added to Audio Deck!`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('audio_tracks', {
          id: fullTrack.id,
          title: fullTrack.title,
          artist: fullTrack.artist,
          duration: fullTrack.duration,
          genre: fullTrack.genre,
          bpm: fullTrack.bpm,
          url: fullTrack.url.length > 5000 ? 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' : fullTrack.url,
          cover: fullTrack.cover,
          uploader_id: fullTrack.uploaderId
        });
      } catch {
        // Offline safe
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
    toast.success(`Film "${fullFilm.title}" premiered to Cinema Hub!`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.upsert('films', {
          id: fullFilm.id,
          title: fullFilm.title,
          synopsis: fullFilm.synopsis,
          director: fullFilm.director,
          release_year: fullFilm.releaseYear,
          duration: fullFilm.duration,
          genre: fullFilm.genre,
          rating: fullFilm.rating,
          video_url: fullFilm.videoUrl,
          poster_url: fullFilm.posterUrl,
          backdrop_url: fullFilm.backdropUrl,
          uploader_id: fullFilm.uploaderId
        });
      } catch {
        // Offline safe
      }
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

  const addRom = (rom: Partial<RomItem>) => {
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
    toast.success('ROM package submitted to Vault!');
    dispatch({ type: 'ADD_ROM', payload: fullRom });
  };

  const addProduct = (product: ProductItem) => {
    sounds.success();
    toast.success('Product added!');
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const addSharedFile = (file: Partial<SharedFileItem>) => {
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
    toast.success('File package shared to Vault!');
    dispatch({ type: 'ADD_SHARED_FILE', payload: fullFile });
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

  const isFollowing = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    return (state.currentUser.followingIds || []).includes(userId);
  };

  const isMutualFriend = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    const targetUser = state.allUsers[userId];
    const followingThem = (state.currentUser.followingIds || []).includes(userId);
    const theyFollowMe = (targetUser?.followingIds || []).includes(state.currentUser.id);
    return followingThem && theyFollowMe;
  };

  const toggleFollowUser = (userId: string) => {
    sounds.click();
    const currentlyFollowing = isFollowing(userId);
    dispatch({ type: 'TOGGLE_FOLLOW_USER', payload: { userId, isFollowing: currentlyFollowing } });
    toast.success(currentlyFollowing ? 'Unfollowed creator' : 'Following creator! 🚀');
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

  const startOrOpenChatWithUser = (userId: string) => {
    sounds.click();
    const existingConv = state.conversations.find(c => 
      !c.isGroup && c.members.includes(userId) && c.members.includes(state.currentUser.id)
    );
    
    if (existingConv) {
      setActiveConvId(existingConv.id);
      setActiveView('messages');
    } else {
      const otherUser = state.allUsers[userId];
      const newConv: Conversation = {
        id: `conv-${userId}`,
        isGroup: false,
        avatar: otherUser?.avatar || 'U',
        color: otherUser?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        members: [state.currentUser.id, userId],
        lastMsg: '1-Message Connection Request',
        time: 'Just now',
        unread: 0,
        messages: [],
        status: 'pending_request',
        requestedBy: state.currentUser.id,
      };
      dispatch({ type: 'ADD_CONVERSATION', payload: newConv });
      setActiveConvId(newConv.id);
      setActiveView('messages');
      toast.info(`Connection request initiated for ${otherUser?.name || 'user'}. You can send 1 message.`);
    }
  };

  const sendMessage = (convId: string, message: any) => {
    sounds.pop();
    const newMessage = {
      id: `msg-${Date.now()}`,
      fromId: state.currentUser.id,
      senderName: state.currentUser.name,
      senderAvatar: state.currentUser.avatar,
      senderColor: state.currentUser.color,
      text: message.text,
      type: message.type || 'text',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: { convId, message: newMessage } });
  };

  const acceptMessageRequest = (convId: string) => {
    sounds.success();
    toast.success('Connection request accepted! Full direct chat unlocked.');
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'active' } });
  };

  const declineMessageRequest = (convId: string) => {
    sounds.click();
    toast.info('Connection request declined');
    dispatch({ type: 'REMOVE_CONVERSATION', payload: { convId } });
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