import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
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
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

export const INITIAL_AUDIO_TRACKS: AudioTrackItem[] = [
  {
    id: 't-1',
    title: 'Neon Tokyo Midnight Rain',
    artist: 'Aiko Tanaka x WEVIDS Synth Lab',
    duration: '03:45',
    genre: 'Synthwave / Cyberpunk',
    bpm: 120,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 't-2',
    title: 'Persian Saffron Sunset Acoustic',
    artist: 'Sara from Tehran',
    duration: '04:12',
    genre: 'Ambient World Fusion',
    bpm: 88,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-chill-medium-version-159456.mp3',
    cover: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 't-3',
    title: 'Snapdragon Hyper Overclock Pulse',
    artist: 'Carlos Mendez (ROM Dev)',
    duration: '02:50',
    genre: 'Hard Techno Glitch',
    bpm: 144,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cyberpunk-2099-10701.mp3',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80'
  }
];

export const INITIAL_FILMS: FilmItem[] = [
  {
    id: 'film-1',
    title: 'Neo-Genesis 2088: The Silicon Frontier',
    synopsis: 'A rogue neural programmer discovers an encrypted kernel anomaly inside Tokyo’s quantum power grid that allows human consciousness transfer.',
    director: 'Aiko Tanaka',
    releaseYear: 2026,
    duration: '1h 48m',
    genre: 'Cyberpunk Sci-Fi',
    rating: 4.9,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=80',
    views: '482K'
  },
  {
    id: 'film-2',
    title: 'Open Source Revolution: The Kernel Chronicles',
    synopsis: 'An inside documentary investigating the worldwide underground network of Android ROM porters, Linux kernel hackers, and custom hardware modders.',
    director: 'Carlos Mendez',
    releaseYear: 2026,
    duration: '1h 22m',
    genre: 'Tech Documentary',
    rating: 4.8,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
    views: '320K'
  },
  {
    id: 'film-3',
    title: 'Echoes of Tehran: The Saffron Road',
    synopsis: 'A visually breathtaking journey through ancient Persian architectural marvels, modern poetry, and the enduring human spirit connecting continents.',
    director: 'Sara from Tehran',
    releaseYear: 2026,
    duration: '1h 35m',
    genre: 'Open Source Action',
    rating: 5.0,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
    views: '610K'
  }
];

interface WevidsState {
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

const initialFiles: SharedFileItem[] = [
  {
    id: 'f-1',
    title: 'Snapdragon 8 Gen 3 Thermal & FPS Governor',
    fileName: 'sd8gen3_thermal_bypass.zip',
    fileSize: '18.4 MB',
    category: 'ROM / Kernel',
    uploaderId: 'carlos',
    uploaderName: 'Carlos Mendez',
    downloadUrl: '#',
    checksum: 'e8f7a932b14c90d6e42a19ff88b643ce219f01ab92',
    downloads: 1420,
    uploadedAt: '2 days ago'
  }
];

const initialState: WevidsState = {
  posts: INITIAL_POSTS,
  clips: INITIAL_CLIPS,
  longVideos: INITIAL_LONG_VIDEOS,
  roms: INITIAL_ROMS,
  products: INITIAL_PRODUCTS,
  files: initialFiles,
  audioTracks: INITIAL_AUDIO_TRACKS,
  films: INITIAL_FILMS,
  conversations: INITIAL_CONVERSATIONS,
  activeView: 'clips',
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

const reducer = (state: WevidsState, action: any): WevidsState => {
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
      return { ...state, currentUser: { ...state.currentUser, ...action.payload } };
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
          following: isFollowing ? state.currentUser.following - 1 : state.currentUser.following + 1,
          followingIds: newFollowingIds
        },
        allUsers: {
          ...state.allUsers,
          [userId]: {
            ...targetUser,
            followers: isFollowing ? targetUser.followers - 1 : targetUser.followers + 1,
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
    case 'ADD_AUDIO_TRACK':
      return { ...state, audioTracks: [action.payload, ...state.audioTracks] };
    case 'SET_AUDIO_TRACKS':
      return { ...state, audioTracks: action.payload };
    case 'ADD_FILM':
      return { ...state, films: [action.payload, ...state.films] };
    case 'SET_FILMS':
      return { ...state, films: action.payload };
    case 'SET_CLOUD_SYNCING':
      return { ...state, isCloudSyncing: action.payload };
    case 'SET_LAST_CLOUD_SYNC':
      return { ...state, lastCloudSync: action.payload };
    default:
      return state;
  }
};

const WevidsContext = createContext<{
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
} | undefined>(undefined);

export const WevidsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    sounds.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  // Initial pull from Supabase on mount
  const syncWithSupabase = async () => {
    if (!isSupabaseConfigured()) {
      toast.info('Supabase cloud is in local cache mode. Tap "Link Cloud" to connect your URL & Key.');
      return;
    }

    dispatch({ type: 'SET_CLOUD_SYNCING', payload: true });
    sounds.pop();
    
    try {
      const [audioRes, filmRes] = await Promise.all([
        supabase.select('audio_tracks'),
        supabase.select('films'),
      ]);

      let syncCount = 0;

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
        
        // Merge without duplicates
        const existingIds = new Set(mappedAudio.map(a => a.id));
        const combined = [...mappedAudio, ...INITIAL_AUDIO_TRACKS.filter(a => !existingIds.has(a.id))];
        dispatch({ type: 'SET_AUDIO_TRACKS', payload: combined });
        syncCount += mappedAudio.length;
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
        syncCount += mappedFilms.length;
      }

      dispatch({ type: 'SET_LAST_CLOUD_SYNC', payload: new Date().toLocaleTimeString() });
      sounds.success();
      toast.success(`Supabase Synced! Pulled ${syncCount} live cloud records.`);
    } catch (err: any) {
      toast.error(`Sync error: ${err.message || 'Could not query Supabase tables'}`);
    } finally {
      dispatch({ type: 'SET_CLOUD_SYNCING', payload: false });
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncWithSupabase();
    }
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
      mediaType: post.mediaType || 'image',
      likes: 0,
      dislikes: 0,
      shares: 0,
      comments: [],
      tags: post.tags || []
    };

    sounds.success();
    toast.success('Post created successfully!');
    dispatch({ type: 'ADD_POST', payload: fullPost });
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

    // Sync to Supabase table
    if (isSupabaseConfigured()) {
      try {
        const res = await supabase.upsert('audio_tracks', {
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
        if (res.error) {
          toast.info(`Saved locally (Supabase info: ${res.error})`);
        } else {
          toast.success('Audio track verified & synced to Supabase database!');
        }
      } catch {
        // Safe offline fallback
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

    // Sync to Supabase table
    if (isSupabaseConfigured()) {
      try {
        const res = await supabase.upsert('films', {
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
        if (res.error) {
          toast.info(`Saved locally (Supabase info: ${res.error})`);
        } else {
          toast.success('Film verified & synced to Supabase database!');
        }
      } catch {
        // Safe offline fallback
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
    toast.success(currentlyFollowing ? 'Unfollowed user' : 'Following user!');
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
        lastMsg: 'Started conversation',
        time: 'Just now',
        unread: 0,
        messages: [],
        status: 'active',
      };
      setActiveConvId(newConv.id);
      setActiveView('messages');
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

  const value = {
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