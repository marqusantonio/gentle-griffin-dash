import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useState } from 'react';
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
  ChatMessage,
  FollowRecord,
  CommentItem,
  CommentReply
} from '../types/wevids';
import { supabase, isSupabaseConfigured, getStoredSession, checkContentModeration } from '../lib/supabase';
import { insertPostWithAutoFallback, syncPostCommentsToCloud, syncClipCommentsToCloud, insertClipWithAutoFallback } from '../lib/schemaAdapter';
import { resolveVideoUrl, isValidVideoUrl } from '../lib/videoUtils';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

export interface WevidsContextType extends WevidsState {
  addPost: (post: Partial<PostItem>) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  addClip: (clip: ShortClipItem) => Promise<void>;
  deleteClip: (clipId: string) => Promise<boolean>;
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
  setIsEasterEggOpen: (open: boolean) => void;
  triggerEasterEggClick: () => void;
  openShareModal: (title: string, url: string) => void;
  closeShareModal: () => void;
  openUserProfileModal: (user: UserProfile) => void;
  closeUserProfileModal: () => void;
  setIsSupabaseModalOpen: (open: boolean) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
  toggleFollowUser: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId?: string) => boolean;
  isFollowing: (userId?: string) => boolean;
  isFollowedBy: (userId?: string) => boolean;
  getFollowStatus: (userId?: string) => 'none' | 'pending' | 'accepted';
  isMutualFriend: (userId?: string) => boolean;
  togglePostLike: (postId: string) => Promise<void>;
  addPostComment: (postId: string, comment: any) => Promise<void>;
  toggleCommentLike: (postId: string, commentId: string) => Promise<void>;
  toggleReplyLike: (postId: string, commentId: string, replyId: string) => Promise<void>;
  addCommentReply: (postId: string, commentId: string, replyData: { text: string; media?: string; mediaType?: 'image' | 'video' | 'gif' | 'sticker' | 'audio' }) => Promise<void>;
  toggleClipLike: (clipId: string) => Promise<void>;
  toggleClipDislike: (clipId: string) => Promise<void>;
  toggleClipBookmark: (clipId: string) => void;
  addClipComment: (clipId: string, comment: any) => Promise<void>;
  startOrOpenChatWithUser: (userId: string) => Promise<void>;
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
  deactivateAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const WevidsContext = createContext<WevidsContextType | undefined>(undefined);

export const WevidsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(wevidsReducer, initialWevidsState);
  const [logoClickCount, setLogoClickCount] = useState(0);

  useEffect(() => {
    sounds.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

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

  const triggerEasterEggClick = () => {
    sounds.pop();
    const nextCount = logoClickCount + 1;
    if (nextCount >= 5) {
      sounds.success();
      toast.success('🎉 You unlocked the secret Gubby Easter Egg!');
      dispatch({ type: 'SET_IS_EASTER_EGG_OPEN', payload: true });
      setLogoClickCount(0);
    } else {
      setLogoClickCount(nextCount);
      if (nextCount >= 2) {
        toast.info(`${5 - nextCount} more taps to unlock secret Easter Egg... 🤫`);
      }
    }
  };

  const setIsEasterEggOpen = (open: boolean) => {
    dispatch({ type: 'SET_IS_EASTER_EGG_OPEN', payload: open });
  };

  const buildConversationsFromDms = (
    dms: DirectMessageItem[],
    profilesMap: Record<string, UserProfile>,
    currentUserId: string,
    followsList: FollowRecord[] = []
  ): Conversation[] => {
    const map = new Map<string, { partnerId: string; messages: ChatMessage[]; lastMsg: string; time: string; status: 'active' | 'pending_request' | 'declined' | 'blocked'; requestedBy?: string }>();

    const approvedPartners = new Set<string>();
    const declinedPartners = new Set<string>();
    dms.forEach(dm => {
      const pId = dm.sender_id === currentUserId ? dm.receiver_id : dm.sender_id;
      if (dm.is_approved === true) approvedPartners.add(pId);
      if (dm.is_approved === false) declinedPartners.add(pId);
    });

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
        senderName: sender?.name || 'User',
        senderAvatar: sender?.avatar || 'U',
        senderColor: sender?.color || '#00e5ff',
        text: dm.content,
        mediaUrl: dm.mediaUrl,
        type: (dm.type as any) || (dm.mediaUrl ? 'image' : 'text'),
        timestamp: new Date(dm.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_friend_request: dm.is_friend_request,
        is_approved: dm.is_approved
      };

      const myFollow = followsList.find(f => f.follower_id === currentUserId && f.following_id === partnerId);
      const theyFollow = followsList.find(f => f.follower_id === partnerId && f.following_id === currentUserId);
      const isMutual = Boolean(
        (myFollow?.status === 'accepted' && theyFollow?.status === 'accepted') ||
        ((state.currentUser.followingIds || []).includes(partnerId) && ((partner.followerIds || []).includes(currentUserId) || (partner.followingIds || []).includes(currentUserId)))
      );

      const isApprovedRequest = Boolean(
        approvedPartners.has(partnerId) || 
        dm.is_approved === true || 
        (theyFollow && myFollow)
      );

      const computedStatus: 'active' | 'pending_request' | 'declined' | 'blocked' = dm.is_blocked
        ? 'blocked'
        : (isMutual || isApprovedRequest)
        ? 'active'
        : declinedPartners.has(partnerId)
        ? 'declined'
        : dm.is_friend_request && dm.is_approved === null
        ? 'pending_request'
        : 'active';

      if (!map.has(partnerId)) {
        map.set(partnerId, {
          partnerId,
          messages: [chatMsg],
          lastMsg: dm.content || 'Media',
          time: new Date(dm.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: computedStatus,
          requestedBy: dm.sender_id
        });
      } else {
        const item = map.get(partnerId)!;
        item.messages.push(chatMsg);
        item.lastMsg = dm.content || 'Media';
        item.time = new Date(dm.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (dm.is_blocked) item.status = 'blocked';
        if (computedStatus === 'active') item.status = 'active';
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
        requestedBy: val.requestedBy,
        streakCount: 0
      });
    });

    return result;
  };

  const syncWithSupabase = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured()) return;
    if (!silent) dispatch({ type: 'SET_CLOUD_SYNCING', payload: true });

    try {
      const [
        postsRes, 
        clipsRes, 
        profilesRes, 
        followsRes,
        dmsRes,
        audioRes,
        filmsRes,
        romsRes,
        filesRes,
        productsRes
      ] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('clips').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('follows').select('*'),
        supabase.from('direct_messages').select('*').order('created_at', { ascending: true }),
        supabase.from('audio_tracks').select('*').order('created_at', { ascending: false }),
        supabase.from('films').select('*').order('created_at', { ascending: false }),
        supabase.from('roms').select('*').order('created_at', { ascending: false }),
        supabase.from('files').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false })
      ]);

      const profileMap: Record<string, UserProfile> = {};
      if (profilesRes.data && profilesRes.data.length > 0) {
        profilesRes.data.forEach((p: any) => {
          if (p && p.id) {
            profileMap[p.id] = {
              ...p,
              follower_count: p.follower_count ?? p.followers ?? 0,
              following_count: p.following_count ?? p.following ?? 0,
              likes_count: p.likes_count ?? p.likes ?? 0
            };
          }
        });
        dispatch({ type: 'SET_ALL_USERS', payload: profileMap });

        if (profileMap[state.currentUser.id]) {
          dispatch({
            type: 'UPDATE_CURRENT_USER',
            payload: profileMap[state.currentUser.id]
          });
        }
      }

      if (postsRes.data) {
        dispatch({ type: 'SET_POSTS', payload: postsRes.data });
      }

      if (clipsRes.data && clipsRes.data.length > 0) {
        // Use shared video URL validation to filter out invalid placeholder entries
        const genuineClips = clipsRes.data.filter((c: any) => {
          const url = resolveVideoUrl([c.videoUrl, c.video_url, c.mediaUrl]);
          return isValidVideoUrl(url);
        });
        dispatch({ type: 'SET_CLIPS', payload: genuineClips });
      }

      if (audioRes.data && audioRes.data.length > 0) {
        dispatch({ type: 'SET_AUDIO_TRACKS', payload: audioRes.data });
      }

      if (filmsRes.data && filmsRes.data.length > 0) {
        dispatch({ type: 'SET_FILMS', payload: filmsRes.data });
      }

      if (romsRes.data && romsRes.data.length > 0) {
        dispatch({ type: 'SET_ROMS', payload: romsRes.data });
      }

      if (filesRes.data && filesRes.data.length > 0) {
        dispatch({ type: 'SET_SHARED_FILES', payload: filesRes.data });
      }

      if (productsRes.data && productsRes.data.length > 0) {
        dispatch({ type: 'SET_PRODUCTS', payload: productsRes.data });
      }

      const followsList: FollowRecord[] = followsRes.data || [];

      if (dmsRes.data && Array.isArray(dmsRes.data)) {
        dispatch({ type: 'SET_DIRECT_MESSAGES', payload: dmsRes.data });
        const userConversations = buildConversationsFromDms(
          dmsRes.data, 
          profileMap, 
          state.currentUser.id, 
          followsList
        );
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

  // Real-time Supabase Channel Subscriptions for instant live updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channel = supabase.channel('global-database-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clips' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profile_likes' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_tracks' }, () => syncWithSupabase(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roms' }, () => syncWithSupabase(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  useEffect(() => {
    syncWithSupabase(true);
    const interval = setInterval(() => syncWithSupabase(true), 25000);
    return () => clearInterval(interval);
  }, [syncWithSupabase]);

  const addPost = async (post: Partial<PostItem>): Promise<boolean> => {
    const moderation = checkContentModeration(post.content || '');
    if (moderation.flagged) {
      toast.error(moderation.reason || 'Post violates community guidelines.');
      return false;
    }

    sounds.success();

    const newPostItem: PostItem = {
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
      shares: 0,
      comments: [],
      tags: post.tags || ['#WEVIDS'],
      created_at: new Date().toISOString()
    };

    dispatch({ type: 'ADD_POST', payload: newPostItem });

    insertPostWithAutoFallback({
      id: newPostItem.id,
      userId: newPostItem.userId,
      authorName: newPostItem.authorName,
      authorHandle: newPostItem.authorHandle,
      authorAvatar: newPostItem.authorAvatar,
      authorColor: newPostItem.authorColor,
      location: newPostItem.location,
      time: 'Just now',
      content: newPostItem.content,
      mediaUrl: newPostItem.mediaUrl,
      mediaType: newPostItem.mediaType,
      video_url: newPostItem.mediaType === 'video' ? newPostItem.mediaUrl : 'none',
      tags: newPostItem.tags
    }).then(({ error }) => {
      if (!error) syncWithSupabase(true);
    });

    return true;
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    sounds.pop();
    dispatch({ type: 'DELETE_POST', payload: { postId } });
    toast.success('Post deleted.');

    try {
      await supabase.from('posts').delete().eq('id', postId);
      await supabase.from('clips').delete().eq('id', postId);
    } catch {}
    return true;
  };

  const deleteClip = async (clipId: string): Promise<boolean> => {
    sounds.pop();
    dispatch({ type: 'DELETE_CLIP', payload: { clipId } });
    toast.success('Clip removed.');

    try {
      await supabase.from('clips').delete().eq('id', clipId);
      await supabase.from('posts').delete().eq('id', clipId);
    } catch {}
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
      } catch (err) {
        console.error('Post like persist error:', err);
      }
    }
  };

  const addPostComment = async (postId: string, comment: any) => {
    sounds.pop();
    const post = state.posts.find(p => p.id === postId);
    const newComment: CommentItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: state.currentUser.id,
      userName: state.currentUser.name,
      userAvatar: state.currentUser.avatar,
      userColor: state.currentUser.color,
      text: comment.text,
      media: comment.media,
      mediaType: comment.mediaType,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: []
    };

    dispatch({ type: 'ADD_POST_COMMENT', payload: { postId, comment: newComment } });

    if (post && isSupabaseConfigured()) {
      const updatedComments = [newComment, ...(post.comments || [])];
      syncPostCommentsToCloud(postId, updatedComments);
    }
  };

  const toggleCommentLike = async (postId: string, commentId: string) => {
    sounds.like();
    dispatch({ type: 'TOGGLE_COMMENT_LIKE', payload: { postId, commentId } });

    const post = state.posts.find(p => p.id === postId);
    if (post && isSupabaseConfigured()) {
      const updatedComments = (post.comments || []).map(c => {
        if (c.id !== commentId) return c;
        const newLiked = !c.isLiked;
        return {
          ...c,
          isLiked: newLiked,
          likes: newLiked ? (Number(c.likes) || 0) + 1 : Math.max(0, (Number(c.likes) || 1) - 1)
        };
      });
      syncPostCommentsToCloud(postId, updatedComments);
    }
  };

  const toggleReplyLike = async (postId: string, commentId: string, replyId: string) => {
    sounds.like();
    dispatch({ type: 'TOGGLE_REPLY_LIKE', payload: { postId, commentId, replyId } });

    const post = state.posts.find(p => p.id === postId);
    if (post && isSupabaseConfigured()) {
      const updatedComments = (post.comments || []).map(c => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          replies: (c.replies || []).map(r => {
            if (r.id !== replyId) return r;
            const newLiked = !r.isLiked;
            return {
              ...r,
              isLiked: newLiked,
              likes: newLiked ? (Number(r.likes) || 0) + 1 : Math.max(0, (Number(r.likes) || 1) - 1)
            };
          })
        };
      });
      syncPostCommentsToCloud(postId, updatedComments);
    }
  };

  const addCommentReply = async (
    postId: string, 
    commentId: string, 
    replyData: { text: string; media?: string; mediaType?: 'image' | 'video' | 'gif' | 'sticker' | 'audio' }
  ) => {
    sounds.pop();

    const newReply: CommentReply = {
      id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user: state.currentUser.id,
      userName: state.currentUser.name,
      userAvatar: state.currentUser.avatar,
      userColor: state.currentUser.color,
      text: replyData.text || '',
      media: replyData.media,
      mediaType: replyData.mediaType,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false
    };

    dispatch({ type: 'ADD_COMMENT_REPLY', payload: { postId, commentId, reply: newReply } });

    const post = state.posts.find(p => p.id === postId);
    if (post && isSupabaseConfigured()) {
      const updatedComments = (post.comments || []).map(c => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      });
      syncPostCommentsToCloud(postId, updatedComments);
    }
  };

  const addClip = async (clip: ShortClipItem) => {
    sounds.success();
    dispatch({ type: 'ADD_CLIP', payload: clip });

    try {
      // Use schema adapter for proper serialization, ensuring both videoUrl and video_url are set.
      await insertClipWithAutoFallback(clip);
      syncWithSupabase(true);
    } catch (err) {
      console.error('[addClip] Error persisting clip:', err);
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
      } catch (err) {
        console.error('Clip like persist error:', err);
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
      } catch {}
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
    const newComment: CommentItem = {
      id: `comm-${Date.now()}`,
      user: comment.user || state.currentUser.id,
      userName: comment.userName || state.currentUser.name,
      userAvatar: comment.userAvatar || state.currentUser.avatar,
      userColor: comment.userColor || state.currentUser.color,
      text: comment.text,
      media: comment.media,
      mediaType: comment.mediaType,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      replies: []
    };

    dispatch({ type: 'ADD_CLIP_COMMENT', payload: { clipId, comment: newComment } });

    if (clip && isSupabaseConfigured()) {
      const updatedComments = [newComment, ...(clip.comments || [])];
      syncClipCommentsToCloud(clipId, updatedComments);
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

    try {
      await supabase.from('audio_tracks').upsert([fullTrack]);
    } catch {}
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

    try {
      await supabase.from('films').upsert([fullFilm]);
    } catch {}
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

    try {
      await supabase.from('roms').upsert([fullRom]);
    } catch {}
  };

  const addProduct = async (product: ProductItem) => {
    sounds.success();
    dispatch({ type: 'ADD_PRODUCT', payload: product });
    toast.success('Product added to Mall!');

    try {
      await supabase.from('products').upsert([product]);
    } catch {}
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

    try {
      await supabase.from('files').upsert([fullFile]);
    } catch {}
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
        await supabase.from('profiles').upsert([mergedUser]);
      } catch {}
    }
  };

  const isFollowing = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    return (state.currentUser.followingIds || []).includes(userId);
  };

  const isFollowedBy = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    const targetUser = state.allUsers[userId];
    return Boolean(
      (state.currentUser.followerIds || []).includes(userId) ||
      (targetUser?.followingIds || []).includes(state.currentUser.id)
    );
  };

  const isMutualFriend = (userId?: string) => {
    if (!userId || userId === state.currentUser.id) return false;
    return Boolean(isFollowing(userId) && isFollowedBy(userId));
  };

  const getFollowStatus = (userId?: string): 'none' | 'pending' | 'accepted' => {
    if (!userId || userId === state.currentUser.id) return 'none';
    if (isMutualFriend(userId)) return 'accepted';
    if (isFollowing(userId)) return 'pending';
    return 'none';
  };

  const isBlocked = (userId?: string) => {
    if (!userId) return false;
    return (state.currentUser.blockedUserIds || []).includes(userId);
  };

  const toggleFollowUser = async (userId: string) => {
    sounds.click();
    const currentlyFollowing = isFollowing(userId);
    const wasFollowedByThem = isFollowedBy(userId);

    dispatch({ type: 'TOGGLE_FOLLOW_USER', payload: { userId, isFollowing: currentlyFollowing } });

    const willBeMutual = !currentlyFollowing && wasFollowedByThem;

    if (willBeMutual) {
      toast.success('Mutual Friends Unlocked! 🤝 Unrestricted Direct Messaging enabled.');
    } else if (!currentlyFollowing) {
      toast.info('Followed creator!');
    } else {
      toast.info('Unfollowed creator.');
    }

    if (isSupabaseConfigured() && state.currentUser?.id) {
      try {
        if (!currentlyFollowing) {
          await supabase.from('follows').upsert([{
            follower_id: state.currentUser.id,
            following_id: userId,
            status: willBeMutual ? 'accepted' : 'pending'
          }]);

          if (willBeMutual) {
            await supabase.from('follows').update({ status: 'accepted' })
              .eq('follower_id', userId)
              .eq('following_id', state.currentUser.id);
          }
        } else {
          await supabase.from('follows').delete()
            .eq('follower_id', state.currentUser.id)
            .eq('following_id', userId);
        }

        const myNewFollowing = !currentlyFollowing
          ? [...(state.currentUser.followingIds || []), userId]
          : (state.currentUser.followingIds || []).filter(id => id !== userId);

        await supabase.from('profiles').update({
          followingIds: myNewFollowing,
          following: myNewFollowing.length,
          following_count: myNewFollowing.length
        }).eq('id', state.currentUser.id);

        const targetUser = state.allUsers[userId];
        const targetFollowerIds = targetUser?.followerIds || [];
        const targetNewFollowers = !currentlyFollowing
          ? [...targetFollowerIds, state.currentUser.id]
          : targetFollowerIds.filter(id => id !== state.currentUser.id);

        await supabase.from('profiles').update({
          followerIds: targetNewFollowers,
          followers: targetNewFollowers.length,
          follower_count: targetNewFollowers.length
        }).eq('id', userId);
      } catch (err) {
        console.error('Supabase follow persistence handled:', err);
      }
    }
  };

  const blockUser = async (userId: string) => {
    sounds.pop();
    dispatch({ type: 'BLOCK_USER', payload: { userId } });
    toast.error('User blocked. Their posts and messages are hidden.');

    const newBlocked = [...(state.currentUser.blockedUserIds || []), userId];
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').update({
          blockedUserIds: newBlocked
        }).eq('id', state.currentUser.id);
      } catch {}
    }
  };

  const unblockUser = async (userId: string) => {
    sounds.pop();
    dispatch({ type: 'UNBLOCK_USER', payload: { userId } });
    toast.success('User unblocked.');

    const newBlocked = (state.currentUser.blockedUserIds || []).filter(id => id !== userId);
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').update({
          blockedUserIds: newBlocked
        }).eq('id', state.currentUser.id);
      } catch {}
    }
  };

  const deactivateAccount = async () => {
    sounds.pop();
    await updateCurrentUser({ isDeactivated: true });
    toast.info('Account deactivated. Your profile is now hidden.');
  };

  const deleteAccount = async () => {
    sounds.pop();
    dispatch({ type: 'PURGE_ACCOUNT' });
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').delete().eq('userId', state.currentUser.id);
        await supabase.from('clips').delete().eq('userId', state.currentUser.id);
        await supabase.from('profiles').delete().eq('id', state.currentUser.id);
      } catch {}
    }
    localStorage.clear();
    toast.success('Your account and data have been permanently deleted.');
    window.location.reload();
  };

  const startOrOpenChatWithUser = async (userId: string) => {
    sounds.click();
    const isFriend = isMutualFriend(userId);

    const conversationId = `conv-${state.currentUser.id}-${userId}`;

    const existingConv = state.conversations.find(c => 
      c.id === conversationId || (!c.isGroup && c.members.includes(userId) && c.members.includes(state.currentUser.id))
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
        id: conversationId,
        isGroup: false,
        avatar: otherUser.avatar || 'U',
        color: otherUser.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        members: [state.currentUser.id, userId],
        lastMsg: isFriend ? 'Mutual friends connected 🤝' : 'Message request initiated',
        time: 'Just now',
        unread: 0,
        messages: [],
        status: isFriend ? 'active' : 'pending_request',
        requestedBy: state.currentUser.id,
        streakCount: 0
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

    if (!isFriend && activeConv.status === 'pending_request' && activeConv.requestedBy === state.currentUser.id && activeConv.messages.length >= 1) {
      toast.error('Request Limit: You can only send 1 request message until recipient accepts or follows back.');
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

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('direct_messages').insert([{
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
        }]);
      } catch {}
    }
  };

  const acceptMessageRequest = async (convId: string) => {
    sounds.success();
    const conv = state.conversations.find(c => c.id === convId);
    const partnerId = conv?.members.find(m => m !== state.currentUser.id);

    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'active' } });

    if (partnerId) {
      const currentlyFollowing = isFollowing(partnerId);
      if (!currentlyFollowing) {
        dispatch({ type: 'TOGGLE_FOLLOW_USER', payload: { userId: partnerId, isFollowing: false } });
      }

      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('direct_messages')
            .update({ is_approved: true })
            .eq('sender_id', partnerId)
            .eq('receiver_id', state.currentUser.id);

          await supabase
            .from('direct_messages')
            .update({ is_approved: true })
            .eq('sender_id', state.currentUser.id)
            .eq('receiver_id', partnerId);
        } catch {}
      }
    }

    toast.success('Message request accepted! You are now Friends 🤝');
  };

  const declineMessageRequest = async (convId: string) => {
    sounds.click();
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'declined' } });
    
    const conv = state.conversations.find(c => c.id === convId);
    const partnerId = conv?.members.find(m => m !== state.currentUser.id);
    if (partnerId && isSupabaseConfigured()) {
      try {
        await supabase.from('direct_messages').update({
          is_approved: false
        }).eq('sender_id', partnerId).eq('receiver_id', state.currentUser.id);
      } catch {}
    }
    toast.info('Message request declined.');
  };

  const blockMessageUser = async (convId: string) => {
    const conv = state.conversations.find(c => c.id === convId);
    const partnerId = conv?.members.find(m => m !== state.currentUser.id);
    if (partnerId) {
      await blockUser(partnerId);
    }
    dispatch({ type: 'SET_CONVERSATION_STATUS', payload: { convId, status: 'blocked' } });
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
    deleteClip,
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
    setIsEasterEggOpen,
    triggerEasterEggClick,
    openShareModal,
    closeShareModal,
    openUserProfileModal,
    closeUserProfileModal,
    setIsSupabaseModalOpen,
    updateCurrentUser,
    toggleFollowUser,
    blockUser,
    unblockUser,
    isBlocked,
    isFollowing,
    isFollowedBy,
    getFollowStatus,
    isMutualFriend,
    togglePostLike,
    addPostComment,
    toggleCommentLike,
    toggleReplyLike,
    addCommentReply,
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
    deactivateAccount,
    deleteAccount
  };

  return <WevidsContext.Provider value={value}>{children}</WevidsContext.Provider>;
};

export const useWevids = () => {
  const context = useContext(WevidsContext);
  if (context === undefined) {
    throw new Error('useWevids overpowering Context Provider constraint');
  }
  return context;
};