import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { wevidsReducer, initialWevidsState, WevidsState } from './wevidsReducer';
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
  ViewName, 
  DirectMessageItem, 
  ChatMessage 
} from '../types/wevids';
import { supabase, isSupabaseConfigured, getStoredSession, checkContentModeration } from '../lib/supabase';
import { sanitizePostForSchema } from '../lib/schemaAdapter';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

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
  syncWithSupabase: (silent?: boolean) => Promise<void>;
  setActiveView: (view: ViewName) => void;
  setActiveConvId: (id: string | null) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsVideoCallOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  openShareModal: (title: string, url: string) => void;
  closeShareModal: () => void;
  openUserProfileModal: (user: UserProfile) => void;
  closeUserProfileModal: () => void;
  setIsSupabaseModalOpen: (open: boolean) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
  toggleFollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId?: string) => boolean;
  isMutualFriend: (userId?: string) => boolean;
  togglePostLike: (postId: string) => Promise<void>;
  addPostComment: (postId: string, comment: any) => Promise<void>;
  toggleClipLike: (clipId: string) => Promise<void>;
  toggleClipDislike: (clipId: string) => Promise<void>;
  toggleClipBookmark: (clipId: string) => void;
  addClipComment: (clipId: string, comment: any) => Promise<void>;
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

  // Authenticate session or restore user
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

  // Helper to construct and group direct messages into active conversations
  const buildConversationsFromDms = (
    dms: DirectMessageItem[],
    profilesMap: Record<string, UserProfile>,
    currentUserId: string
  ): Conversation[] => {
    const map = new Map<string, { partnerId: string; messages: ChatMessage[]; lastMsg: string; time: string; status: 'active' | 'pending_request' | 'declined' | 'blocked'; requestedBy?: string }>();

    dms.forEach((dm) => {
      const partnerId = dm.sender_id === currentUserId ? dm.receiver_id : dm.sender_id;
      if (!partnerId) return;

      const partner = profilesMap[partnerId] || {
        id: partnerId,
        name: partnerId.startsWith('guest-') ? `Guest_${partnerId.replace('guest-', '')}` : 'Creator',
        handle: `@${partnerId}`,
        avatar: partnerId.startsWith('guest-') ? 'G' : 'C',
        color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
      };

      const sender = profilesMap[dm.sender_id] || (dm.sender_id === currentUserId ? state.currentUser : partner);

      const chatMsg: ChatMessage = {
        id: dm.id,
        fromId: dm.sender_id,
        senderName: sender.name || 'User',
        senderAvatar: sender.avatar || 'U',
        senderColor: sender.color || '#00e5ff',
        text: dm.content,
        mediaUrl: dm.mediaUrl,
        type: (dm.type as any) || (dm.mediaUrl ? 'image' : 'text'),
        timestamp: new Date(dm.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_friend_request: dm.is_friend_request,
        is_approved: dm.is_approved
      };

      if (!map.has(partnerId)) {
        map.set(partnerId, {
          partnerId,
          messages: [chatMsg],
          lastMsg: dm.content || 'Media',
          time: new Date(dm.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: dm.is_blocked ? 'blocked' : dm.is_friend_request && dm.is_approved === null ? 'pending_request' : dm.is_approved === false ? 'declined' : 'active',
          requestedBy: dm.sender_id
        });
      } else {
        const item = map.get(partnerId)!;
        item.messages.push(chatMsg);
        item.lastMsg = dm.content || 'Media';
        item.time = new Date(dm.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (dm.is_blocked) item.status = 'blocked';
      }
    });

    const result: Conversation[] = [];
    map.forEach((val, partnerId) => {
      const partner = profilesMap[partnerId];
      result.push({
        id: `conv-${currentUserId}-${partnerId}`,
        isGroup: false,
        avatar: partner?.avatar || partnerId.charAt(0).toUpperCase() || 'C',
        color: partner?.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        members: [currentUserId, partnerId],
        lastMsg: val.lastMsg,
        time: val.time,
        unread: 0,
        messages: val.messages,
        status: val.status,
        requestedBy: val.requestedBy
      });
    });

    return result;
  };

  // Automated Supabase live synchronization
  const syncWithSupabase = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured()) return;
    if (!silent) dispatch({ type: 'SET_CLOUD_SYNCING', payload: true });

    try {
      const [
        postsRes, 
        clipsRes, 
        profilesRes, 
        audioRes, 
        filmsRes, 
        romsRes, 
        filesRes, 
        prodsRes,
        dmsRes
      ] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('clips').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('audio_tracks').select('*').order('created_at', { ascending: false }),
        supabase.from('films').select('*').order('created_at', { ascending: false }),
        supabase.from('roms').select('*').order('created_at', { ascending: false }),
        supabase.from('files').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('direct_messages').select('*').order('created_at', { ascending: true })
      ]);

      const profileMap: Record<string, UserProfile> = {};
      if (profilesRes.data && profilesRes.data.length > 0) {
        profilesRes.data.forEach((p: UserProfile) => {
          if (p && p.id) profileMap[p.id] = p;
        });
        dispatch({ type: 'SET_ALL_USERS', payload: profileMap });

        if (profileMap[state.currentUser.id]) {
          dispatch({
            type: 'UPDATE_CURRENT_USER',
            payload: profileMap[state.currentUser.id]
          });
        }
      }

      if (postsRes.data) dispatch({ type: 'SET_POSTS', payload: postsRes.data });
      if (clipsRes.data) dispatch({ type: 'SET_CLIPS', payload: clipsRes.data });
      if (audioRes.data) dispatch({ type: 'SET_AUDIO_TRACKS', payload: audioRes.data });
      if (filmsRes.data) dispatch({ type: 'SET_FILMS', payload: filmsRes.data });
      if (romsRes.data) dispatch({ type: 'SET_ROMS', payload: romsRes.data });
      if (filesRes.data) dispatch({ type: 'SET_SHARED_FILES', payload: filesRes.data });
      if (prodsRes.data) dispatch({ type: 'SET_PRODUCTS', payload: prodsRes.data });

      if (dmsRes.data && Array.isArray(dmsRes.data)) {
        dispatch({ type: 'SET_DIRECT_MESSAGES', payload: dmsRes.data });
        const userConversations = buildConversationsFromDms(dmsRes.data, profileMap, state.currentUser.id);
        if (userConversations.length > 0) {
          dispatch({ type: 'SET_CONVERSATIONS', payload: userConversations });
        }
      }

      dispatch({ type: 'SET_LAST_CLOUD_SYNC', payload: new Date().toLocaleTimeString() });
    } catch {
      // Safe offline fallback
    } finally {
      if (!silent) dispatch({ type: 'SET_CLOUD_SYNCING', payload: false });
    }
  }, [state.currentUser.id]);

  // Initial fetch and automatic real-time WebSocket channel subscriptions
  useEffect(() => {
    syncWithSupabase(true);

    if (!isSupabaseConfigured()) return;

    // Realtime listeners across multiple tables
    const postsChannel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        syncWithSupabase(true);
      })
      .subscribe();

    const clipsChannel = supabase
      .channel('realtime-clips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clips' }, () => {
        syncWithSupabase(true);
      })
      .subscribe();

    const dmsChannel = supabase
      .channel('realtime-dms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        syncWithSupabase(true);
      })
      .subscribe();

    const handleFocus = () => syncWithSupabase(true);
    const handleOnline = () => {
      toast.success('Connection restored! Syncing with Supabase...');
      syncWithSupabase();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Periodic automatic background sync heartbeat (every 5 seconds)
    const interval = setInterval(() => syncWithSupabase(true), 5000);

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(clipsChannel);
      supabase.removeChannel(dmsChannel);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [syncWithSupabase]);

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
      likes: 0,
      dislikes: 0,
      shares: 0,
      comments: [],
      tags: post.tags || ['#WEVIDS'],
      created_at: new Date().toISOString()
    };

    sounds.success();
    dispatch({ type: 'ADD_POST', payload: fullPost });
    toast.success('Post published to Supabase!');

    if (isSupabaseConfigured()) {
      try {
        const safePost = await sanitizePostForSchema(fullPost as unknown as Record<string, any>);
        await supabase.from('posts').upsert(safePost);
      } catch (err: any) {
        toast.error('Failed to write post to Supabase: ' + err.message);
      }
    }
    return true;
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    sounds.pop();
    dispatch({ type: 'DELETE_POST', payload: { postId } });
    toast.success('Post deleted.');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').delete().eq('id', postId);
      } catch (err: any) {
        toast.error('Failed to delete post: ' + err.message);
      }
    }
    return true;
  };

  const togglePostLike = async (postId: string) => {
    sounds.like();
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;

    const newLiked = !post.isLiked;
    const newLikesCount = newLiked ? (Number(post.likes) || 0) + 1 : Math.max(0, (Number(post.likes) || 1) - 1);

    dispatch({ type: 'TOGGLE_POST_LIKE', payload: { postId } });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').update({ likes: newLikesCount }).eq('id', postId);
      } catch {
        // Safe offline
      }
    }
  };

  const addPostComment = async (postId: string, comment: any) => {
    sounds.pop();
    const post = state.posts.find(p => p.id === postId);
    const newComment = {
      id: `c-${Date.now()}`,
      user: state.currentUser.id,
      userName: state.currentUser.name,
      userAvatar: state.currentUser.avatar,
      userColor: state.currentUser.color,
      text: comment.text,
      media: comment.media,
      mediaType: comment.mediaType,
      timestamp: 'Just now',
      likes: 0
    };

    dispatch({ type: 'ADD_POST_COMMENT', payload: { postId, comment: newComment } });

    if (isSupabaseConfigured() && post) {
      try {
        const updatedComments = [newComment, ...(post.comments || [])];
        await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
      } catch {
        // Safe offline
      }
    }
  };

  const addClip = async (clip: ShortClipItem) => {
    sounds.success();
    dispatch({ type: 'ADD_CLIP', payload: clip });
    toast.success('Clip published to Supabase!');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clips').upsert(clip);
      } catch (err: any) {
        toast.error('Failed to upload clip: ' + err.message);
      }
    }
  };

  const toggleClipLike = async (clipId: string) => {
    sounds.like();
    const clip = state.clips.find(c => c.id === clipId);
    if (!clip) return;

    const newLiked = !clip.isLiked;
    const newLikesCount = newLiked ? (Number(clip.likes) || 0) + 1 : Math.max(0, (Number(clip.likes) || 1) - 1);

    dispatch({ type: 'TOGGLE_CLIP_LIKE', payload: { clipId } });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clips').update({ likes: newLikesCount }).eq('id', clipId);
      } catch {
        // Safe offline
      }
    }
  };

  const toggleClipDislike = async (clipId: string) => {
    sounds.pop();
    const clip = state.clips.find(c => c.id === clipId);
    if (!clip) return;

    const newDisliked = !clip.isDisliked;
    const newDislikesCount = newDisliked ? (Number(clip.dislikes) || 0) + 1 : Math.max(0, (Number(clip.dislikes) || 1) - 1);

    dispatch({ type: 'TOGGLE_CLIP_DISLIKE', payload: { clipId } });

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('clips').update({ dislikes: newDislikesCount }).eq('id', clipId);
      } catch {
        // Safe offline
      }
    }
  };

  const toggleClipBookmark = (clipId: string) => {
    sounds.click();
    dispatch({ type: 'TOGGLE_CLIP_BOOKMARK', payload: { clipId } });
    toast.success('Saved to Vault!');
  };

  const addClipComment = async (clipId: string, comment: any) => {
    sounds.pop();
    const clip = state.clips.find(c => c.id === clipId);
    const newComment = {
      id: `comm-${Date.now()}`,
      user: comment.user,
      userName: comment.userName,
      userAvatar: comment.userAvatar,
      userColor: comment.userColor,
      text: comment.text,
      timestamp: 'Just now',
      likes: 0
    };

    dispatch({ type: 'ADD_CLIP_COMMENT', payload: { clipId, comment: newComment } });

    if (isSupabaseConfigured() && clip) {
      try {
        const updatedComments = [newComment, ...(clip.comments || [])];
        await supabase.from('clips').update({ comments: updatedComments }).eq('id', clipId);
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
      genre: track.genre || 'Electronic',
      bpm: track.bpm || 120,
      url: track.url || '',
      cover: track.cover || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
      uploaderId: state.currentUser.id,
      createdAt: new Date().toISOString()
    };

    dispatch({ type: 'ADD_AUDIO_TRACK', payload: fullTrack });
    sounds.success();
    toast.success(`Track "${fullTrack.title}" saved!`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('audio_tracks').upsert(fullTrack);
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
      views: '0'
    };

    dispatch({ type: 'ADD_FILM', payload: fullFilm });
    sounds.success();
    toast.success(`Film "${fullFilm.title}" premiered!`);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('films').upsert(fullFilm);
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
    dispatch({ type: 'ADD_ROM', payload: fullRom });
    toast.success('ROM package saved to Vault!');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('roms').upsert(fullRom);
      } catch {
        // Safe offline
      }
    }
  };

  const addProduct = async (product: ProductItem) => {
    sounds.success();
    dispatch({ type: 'ADD_PRODUCT', payload: product });
    toast.success('Product added to Mall!');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('products').upsert(product);
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
      checksum: file.checksum || 'sha256_hash',
      downloads: 0,
      uploadedAt: 'Just now'
    };
    sounds.success();
    dispatch({ type: 'ADD_SHARED_FILE', payload: fullFile });
    toast.success('File package saved!');

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('files').upsert(fullFile);
      } catch {
        // Safe offline
      }
    }
  };

  const addLongVideo = (video: LongVideoItem) => {
    sounds.success();
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

  const setIsMobileSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_IS_MOBILE_SIDEBAR_OPEN', payload: open });
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

  const updateCurrentUser = async (updates: Partial<UserProfile>) => {
    sounds.pop();
    dispatch({ type: 'UPDATE_CURRENT_USER', payload: updates });

    const mergedUser = { ...state.currentUser, ...updates };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert(mergedUser);
      } catch {
        // Safe offline
      }
    }
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

    const targetUser = state.allUsers[userId];
    const newFollowingIds = currentlyFollowing
      ? (state.currentUser.followingIds || []).filter(id => id !== userId)
      : [...(state.currentUser.followingIds || []), userId];

    const newTargetFollowerIds = targetUser ? (
      currentlyFollowing 
        ? (targetUser.followerIds || []).filter(id => id !== state.currentUser.id)
        : [...(targetUser.followerIds || []), state.currentUser.id]
    ) : [];

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').update({
          followingIds: newFollowingIds,
          following: newFollowingIds.length
        }).eq('id', state.currentUser.id);

        if (targetUser) {
          await supabase.from('profiles').update({
            followerIds: newTargetFollowerIds,
            followers: newTargetFollowerIds.length
          }).eq('id', userId);
        }
      } catch {
        // Safe offline
      }
    }

    if (!currentlyFollowing) {
      toast.success('Following creator!');
    } else {
      toast.info('Unfollowed.');
    }
  };

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
        bio: '',
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
        await supabase.from('direct_messages').insert({
          id: newMessage.id,
          sender_id: state.currentUser.id,
          receiver_id: receiverId,
          content: message.text || (message.type ? `[${message.type}]` : 'Media'),
          mediaUrl: message.mediaUrl,
          type: message.type || 'text',
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
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'active' } });
    toast.success('Message request accepted!');
  };

  const declineMessageRequest = async (convId: string) => {
    sounds.click();
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'declined' } });
    toast.info('Message request declined.');
  };

  const blockMessageUser = async (convId: string) => {
    sounds.pop();
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'blocked' } });
    toast.error('User blocked.');
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
    dispatch({ type: 'ADD_TO_CART', payload: { product } });
  };

  const removeFromCart = (productId: string) => {
    sounds.click();
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
    setIsMobileSidebarOpen,
    openShareModal,
    closeShareModal,
    openUserProfileModal,
    closeUserProfileModal,
    setIsSupabaseModalOpen,
    updateCurrentUser,
    toggleFollowUser,
    isFollowing,
    isMutualFriend,
    togglePostLike,
    addPostComment,
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