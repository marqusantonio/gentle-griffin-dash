import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ViewName, 
  UserProfile, 
  PostItem, 
  ShortClipItem, 
  SharedFileItem, 
  ProductItem, 
  CartItem, 
  Conversation, 
  CommentItem,
  RomItem,
  LongVideoItem,
  SavedCollection
} from '../types/wevids';
import { 
  CURRENT_USER, 
  INITIAL_POSTS, 
  INITIAL_CLIPS, 
  INITIAL_PRODUCTS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_ROMS,
  INITIAL_LONG_VIDEOS,
  INITIAL_BOOKMARKS,
  MOCK_USERS 
} from '../data/initialData';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

export const INITIAL_FILES: SharedFileItem[] = [
  {
    id: 'file-1',
    title: 'HyperOS 2.0 Fastboot Overclock Script',
    fileName: 'hyperos2_fastboot_gpu_fix.zip',
    fileSize: '48.6 MB',
    category: 'ROM / Kernel',
    uploaderId: 'carlos',
    uploaderName: 'Carlos Mendez',
    downloadUrl: '#',
    checksum: '8fa9284bc7102e88a',
    downloads: 1420,
    uploadedAt: 'Today'
  },
  {
    id: 'file-2',
    title: 'Cyberpunk Neon Lightroom & Premiere LUTs Pack',
    fileName: 'tokyo_neon_luts_2026.cube',
    fileSize: '12.4 MB',
    category: 'LUTs / Preset',
    uploaderId: 'aiko',
    uploaderName: 'Aiko Tanaka',
    downloadUrl: '#',
    checksum: 'c2b489ef01a8893d',
    downloads: 3840,
    uploadedAt: 'Yesterday'
  }
];

interface WevidsContextType {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  currentUser: UserProfile;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  allUsers: Record<string, UserProfile>;
  
  // Follow / Friends System
  toggleFollowUser: (targetUserId: string) => void;
  isFollowing: (targetUserId: string) => boolean;
  isMutualFriend: (targetUserId: string) => boolean;
  
  // Posts & Feed
  posts: PostItem[];
  addPost: (post: Omit<PostItem, 'id' | 'likes' | 'dislikes' | 'shares' | 'comments'>) => void;
  togglePostLike: (postId: string) => void;
  togglePostDislike: (postId: string) => void;
  addPostComment: (postId: string, comment: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => void;
  
  // Clips / Shorts
  clips: ShortClipItem[];
  toggleClipLike: (clipId: string) => void;
  toggleClipDislike: (clipId: string) => void;
  toggleClipBookmark: (clipId: string) => void;
  addClipComment: (clipId: string, comment: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => void;
  
  // Long Videos & ROMs
  longVideos: LongVideoItem[];
  roms: RomItem[];
  addRom: (rom: Omit<RomItem, 'id' | 'downloadCount' | 'releaseDate'>) => void;
  collections: SavedCollection[];

  // Shared Files Hub
  files: SharedFileItem[];
  addSharedFile: (file: Omit<SharedFileItem, 'id' | 'downloads' | 'uploadedAt'>) => void;
  
  // Direct Messaging & 1-Message Request Gate
  conversations: Conversation[];
  activeConvId: string;
  setActiveConvId: (id: string) => void;
  sendMessage: (convId: string, message: { text?: string; type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'file'; mediaUrl?: string }) => void;
  startOrOpenChatWithUser: (targetUserId: string) => void;
  acceptMessageRequest: (convId: string) => void;
  declineMessageRequest: (convId: string) => void;
  
  // Marketplace & Cart
  products: ProductItem[];
  cart: CartItem[];
  addToCart: (product: ProductItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // Modals & Calls
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  openShareModal: (title: string, url: string) => void;
  activeShare: { title: string; url: string } | null;
  closeShareModal: () => void;
  viewingProfileUser: UserProfile | null;
  openUserProfileModal: (user: UserProfile) => void;
  closeUserProfileModal: () => void;
  isVideoCallOpen: boolean;
  openVideoCall: (callerName: string) => void;
  closeVideoCall: () => void;
  activeCallUser: string | null;
}

const WevidsContext = createContext<WevidsContextType | undefined>(undefined);

export const WevidsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewRaw] = useState<ViewName>('clips');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('wevids_user_v32');
    if (saved) return JSON.parse(saved);
    return {
      ...CURRENT_USER,
      followingIds: ['sara'],
      followerIds: ['sara', 'carlos'],
      bioAudioTitle: 'Cyber Tokyo Ambient Synth Beat',
      bioAudioUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_spaceship_hum.ogg'
    };
  });

  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>(() => {
    const base = { ...MOCK_USERS };
    base.sara.followingIds = ['you'];
    base.sara.followerIds = ['you'];
    base.sara.bioAudioTitle = 'Persian Ney & Saffron Wind';
    base.sara.bioAudioUrl = 'https://actions.google.com/sounds/v1/ambiences/tea_pour.ogg';

    base.carlos.followingIds = ['you'];
    base.carlos.followerIds = [];
    base.carlos.bioAudioTitle = '8-Bit Modder Chiptune';
    base.carlos.bioAudioUrl = 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg';

    base.aiko.followingIds = [];
    base.aiko.followerIds = [];
    base.aiko.bioAudioTitle = 'Shibuya Rain 3D Audio';
    base.aiko.bioAudioUrl = 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg';
    return base;
  });

  const [posts, setPosts] = useState<PostItem[]>(() => {
    const saved = localStorage.getItem('wevids_posts_v32');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [clips, setClips] = useState<ShortClipItem[]>(() => {
    const saved = localStorage.getItem('wevids_clips_v32');
    return saved ? JSON.parse(saved) : INITIAL_CLIPS;
  });

  const [roms, setRoms] = useState<RomItem[]>(() => {
    const saved = localStorage.getItem('wevids_roms_v32');
    return saved ? JSON.parse(saved) : INITIAL_ROMS;
  });

  const [longVideos] = useState<LongVideoItem[]>(INITIAL_LONG_VIDEOS);
  const [collections] = useState<SavedCollection[]>(INITIAL_BOOKMARKS);

  const [files, setFiles] = useState<SharedFileItem[]>(() => {
    const saved = localStorage.getItem('wevids_files_v32');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [products] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('wevids_convs_v32');
    if (saved) return JSON.parse(saved);
    return [
      ...INITIAL_CONVERSATIONS.map(c => ({
        ...c,
        status: 'active' as const
      })),
      {
        id: 'conv-req-reza',
        isGroup: false,
        avatar: 'R',
        color: 'linear-gradient(135deg, #fbbf24, #ff2d95)',
        members: ['you', 'reza'],
        lastMsg: 'Reza: Salam! I would love to collaborate on your podcast poetry project!',
        time: '5m',
        unread: 1,
        status: 'pending_request',
        requestedBy: 'reza',
        messages: [
          {
            id: 'm-req-1',
            fromId: 'reza',
            senderName: 'Reza Ahmadi',
            senderAvatar: 'R',
            senderColor: 'linear-gradient(135deg, #fbbf24, #ff2d95)',
            text: 'Salam! I would love to collaborate on your podcast poetry project! Can we connect?',
            type: 'text',
            timestamp: '11:15 AM'
          }
        ]
      }
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || 'conv-sara');
  const [soundEnabled, setSoundEnabledRaw] = useState<boolean>(true);
  const [activeShare, setActiveShare] = useState<{ title: string; url: string } | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [activeCallUser, setActiveCallUser] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('wevids_user_v32', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('wevids_posts_v32', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('wevids_clips_v32', JSON.stringify(clips));
  }, [clips]);

  useEffect(() => {
    localStorage.setItem('wevids_roms_v32', JSON.stringify(roms));
  }, [roms]);

  useEffect(() => {
    localStorage.setItem('wevids_files_v32', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('wevids_convs_v32', JSON.stringify(conversations));
  }, [conversations]);

  const setActiveView = (view: ViewName) => {
    sounds.click();
    setActiveViewRaw(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSoundEnabled = (enabled: boolean) => {
    sounds.enabled = enabled;
    setSoundEnabledRaw(enabled);
    if (enabled) sounds.pop();
  };

  // Follow / Mutual Friends System
  const isFollowing = (targetUserId: string): boolean => {
    return (currentUser.followingIds || []).includes(targetUserId);
  };

  const isMutualFriend = (targetUserId: string): boolean => {
    const follows = (currentUser.followingIds || []).includes(targetUserId);
    const followedBack = (allUsers[targetUserId]?.followingIds || []).includes('you') || (currentUser.followerIds || []).includes(targetUserId);
    return follows && followedBack;
  };

  const toggleFollowUser = (targetUserId: string) => {
    sounds.like();
    const currentlyFollowing = isFollowing(targetUserId);
    
    let updatedFollowing: string[];
    if (currentlyFollowing) {
      updatedFollowing = (currentUser.followingIds || []).filter(id => id !== targetUserId);
      toast.info(`Unfollowed ${allUsers[targetUserId]?.name || 'user'}`);
    } else {
      updatedFollowing = [...(currentUser.followingIds || []), targetUserId];
      const targetFollowsMe = (currentUser.followerIds || []).includes(targetUserId);
      if (targetFollowsMe) {
        toast.success(`🎉 You and ${allUsers[targetUserId]?.name || 'user'} are now Mutual Friends!`);
      } else {
        toast.success(`Following ${allUsers[targetUserId]?.name || 'user'}!`);
      }
    }

    setCurrentUser(prev => ({
      ...prev,
      followingIds: updatedFollowing,
      following: updatedFollowing.length
    }));
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      setAllUsers(u => ({ ...u, you: updated }));
      return updated;
    });
    sounds.success();
    toast.success('Profile updated successfully!');
  };

  // Post & Feed Actions
  const addPost = (newPostData: Omit<PostItem, 'id' | 'likes' | 'dislikes' | 'shares' | 'comments'>) => {
    const newPost: PostItem = {
      ...newPostData,
      id: `post-${Date.now()}`,
      likes: 0,
      dislikes: 0,
      shares: 0,
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
    sounds.success();
    toast.success('Shared to Global Feed!');
  };

  const togglePostLike = (postId: string) => {
    sounds.like();
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const wasLiked = p.isLiked;
        return {
          ...p,
          isLiked: !wasLiked,
          likes: wasLiked ? p.likes - 1 : p.likes + 1,
          isDisliked: false
        };
      }
      return p;
    }));
  };

  const togglePostDislike = (postId: string) => {
    sounds.pop();
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const wasDisliked = p.isDisliked;
        return {
          ...p,
          isDisliked: !wasDisliked,
          dislikes: (p.dislikes || 0) + (wasDisliked ? -1 : 1),
          isLiked: false
        };
      }
      return p;
    }));
  };

  const addPostComment = (postId: string, commentData: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => {
    sounds.pop();
    const newComment: CommentItem = {
      ...commentData,
      id: `c-${Date.now()}`,
      timestamp: 'Just now',
      likes: 0,
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    toast.success('Comment posted!');
  };

  // Clips Actions
  const toggleClipLike = (clipId: string) => {
    sounds.like();
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const wasLiked = c.isLiked;
        return {
          ...c,
          isLiked: !wasLiked,
          likes: wasLiked ? c.likes - 1 : c.likes + 1,
          isDisliked: false
        };
      }
      return c;
    }));
  };

  const toggleClipDislike = (clipId: string) => {
    sounds.pop();
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const wasDisliked = c.isDisliked;
        return {
          ...c,
          isDisliked: !wasDisliked,
          dislikes: (c.dislikes || 0) + (wasDisliked ? -1 : 1),
          isLiked: false
        };
      }
      return c;
    }));
  };

  const toggleClipBookmark = (clipId: string) => {
    sounds.pop();
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const wasSaved = c.isBookmarked;
        if (!wasSaved) toast.success('Saved to your bookmarks collection!');
        return {
          ...c,
          isBookmarked: !wasSaved
        };
      }
      return c;
    }));
  };

  const addClipComment = (clipId: string, commentData: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => {
    sounds.pop();
    const newComment: CommentItem = {
      ...commentData,
      id: `cc-${Date.now()}`,
      timestamp: 'Just now',
      likes: 0,
    };
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, comments: [...c.comments, newComment] } : c));
  };

  // ROMs
  const addRom = (romData: Omit<RomItem, 'id' | 'downloadCount' | 'releaseDate'>) => {
    sounds.success();
    const newRom: RomItem = {
      ...romData,
      id: `rom-${Date.now()}`,
      downloadCount: 1,
      releaseDate: 'Today'
    };
    setRoms(prev => [newRom, ...prev]);
    toast.success(`Published "${romData.title}" to Developer ROM Vault!`);
  };

  // Files Hub
  const addSharedFile = (fileData: Omit<SharedFileItem, 'id' | 'downloads' | 'uploadedAt'>) => {
    sounds.success();
    const newFile: SharedFileItem = {
      ...fileData,
      id: `file-${Date.now()}`,
      downloads: 1,
      uploadedAt: 'Just now'
    };
    setFiles(prev => [newFile, ...prev]);
    toast.success(`Uploaded "${fileData.fileName}" to File Vault!`);
  };

  // Direct Messaging with 1-Message Request Gate
  const startOrOpenChatWithUser = (targetUserId: string) => {
    const existing = conversations.find(c => !c.isGroup && c.members.includes(targetUserId));
    if (existing) {
      setActiveConvId(existing.id);
      setActiveView('messages');
      return;
    }

    const targetUser = allUsers[targetUserId];
    if (!targetUser) return;

    const areFriends = isMutualFriend(targetUserId);

    const newConv: Conversation = {
      id: `conv-${targetUserId}-${Date.now()}`,
      isGroup: false,
      avatar: targetUser.avatar,
      color: targetUser.color,
      members: ['you', targetUserId],
      lastMsg: areFriends ? 'Chat started' : 'Sent connection message request',
      time: 'now',
      unread: 0,
      status: areFriends ? 'active' : 'pending_request',
      requestedBy: 'you',
      messages: []
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setActiveView('messages');
    
    if (!areFriends) {
      toast.info(`You must send 1 message request to ${targetUser.name} before full chat is accepted.`);
    }
  };

  const acceptMessageRequest = (convId: string) => {
    sounds.success();
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: 'active' } : c));
    toast.success('Connection request accepted! You can now chat freely.');
  };

  const declineMessageRequest = (convId: string) => {
    sounds.click();
    setConversations(prev => prev.filter(c => c.id !== convId));
    toast.info('Message request declined.');
  };

  const sendMessage = (convId: string, msgData: { text?: string; type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'file'; mediaUrl?: string }) => {
    sounds.pop();
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      fromId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderColor: currentUser.color,
      text: msgData.text,
      type: msgData.type,
      mediaUrl: msgData.mediaUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const last = msgData.type === 'audio' ? '🎤 [Voice note]' : msgData.type === 'file' ? '📁 [File shared]' : msgData.text || '[Media]';
        return {
          ...c,
          lastMsg: `${currentUser.name}: ${last}`,
          time: 'now',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));
  };

  // Cart
  const addToCart = (product: ProductItem) => {
    sounds.pop();
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Added "${product.title}" to cart!`);
  };

  const removeFromCart = (productId: string) => {
    sounds.click();
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const openShareModal = (title: string, url: string) => {
    sounds.click();
    setActiveShare({ title, url });
  };

  const closeShareModal = () => {
    sounds.click();
    setActiveShare(null);
  };

  const openUserProfileModal = (user: UserProfile) => {
    sounds.click();
    setViewingProfileUser(user);
  };

  const closeUserProfileModal = () => {
    sounds.click();
    setViewingProfileUser(null);
  };

  const openVideoCall = (callerName: string) => {
    sounds.pop();
    setActiveCallUser(callerName);
    setIsVideoCallOpen(true);
  };

  const closeVideoCall = () => {
    sounds.click();
    setIsVideoCallOpen(false);
    setActiveCallUser(null);
  };

  return (
    <WevidsContext.Provider
      value={{
        activeView,
        setActiveView,
        currentUser,
        updateCurrentUser,
        allUsers,
        toggleFollowUser,
        isFollowing,
        isMutualFriend,
        posts,
        addPost,
        togglePostLike,
        togglePostDislike,
        addPostComment,
        clips,
        toggleClipLike,
        toggleClipDislike,
        toggleClipBookmark,
        addClipComment,
        longVideos,
        roms,
        addRom,
        collections,
        files,
        addSharedFile,
        conversations,
        activeConvId,
        setActiveConvId,
        sendMessage,
        startOrOpenChatWithUser,
        acceptMessageRequest,
        declineMessageRequest,
        products,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        soundEnabled,
        setSoundEnabled,
        openShareModal,
        activeShare,
        closeShareModal,
        viewingProfileUser,
        openUserProfileModal,
        closeUserProfileModal,
        isVideoCallOpen,
        openVideoCall,
        closeVideoCall,
        activeCallUser,
      }}
    >
      {children}
    </WevidsContext.Provider>
  );
};

export const useWevids = () => {
  const context = useContext(WevidsContext);
  if (!context) throw new Error('useWevids must be used within WevidsProvider');
  return context;
};