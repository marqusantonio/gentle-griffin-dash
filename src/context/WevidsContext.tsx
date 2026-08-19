import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ViewName, 
  UserProfile, 
  PostItem, 
  ShortClipItem, 
  LongVideoItem, 
  RomItem, 
  ProductItem, 
  CartItem, 
  Conversation, 
  SavedCollection,
  CommentItem
} from '../types/wevids';
import { 
  CURRENT_USER, 
  INITIAL_POSTS, 
  INITIAL_CLIPS, 
  INITIAL_LONG_VIDEOS, 
  INITIAL_ROMS, 
  INITIAL_PRODUCTS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_BOOKMARKS,
  MOCK_USERS 
} from '../data/initialData';
import { sounds } from '../lib/soundFx';
import { toast } from 'sonner';

interface WevidsContextType {
  activeView: ViewName;
  setActiveView: (view: ViewName) => void;
  currentUser: UserProfile;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  allUsers: Record<string, UserProfile>;
  
  // Posts & Feed
  posts: PostItem[];
  addPost: (post: Omit<PostItem, 'id' | 'likes' | 'dislikes' | 'shares' | 'comments'>) => void;
  togglePostLike: (postId: string) => void;
  togglePostDislike: (postId: string) => void;
  addPostComment: (postId: string, comment: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => void;
  
  // Clips & Long Videos
  clips: ShortClipItem[];
  longVideos: LongVideoItem[];
  toggleClipLike: (clipId: string) => void;
  toggleClipBookmark: (clipId: string) => void;
  addClipComment: (clipId: string, comment: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => void;
  
  // ROM Vault
  roms: RomItem[];
  addRom: (rom: Omit<RomItem, 'id' | 'downloadCount' | 'releaseDate'>) => void;
  
  // Marketplace & Cart
  products: ProductItem[];
  cart: CartItem[];
  addToCart: (product: ProductItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // Messaging
  conversations: Conversation[];
  activeConvId: string;
  setActiveConvId: (id: string) => void;
  sendMessage: (convId: string, message: { text?: string; type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'rom_file'; mediaUrl?: string }) => void;
  createGroupChat: (name: string, members: string[]) => void;
  
  // Bookmarks & Playlists
  collections: SavedCollection[];
  toggleBookmark: (item: { id: string; type: 'post' | 'clip' | 'long_video' | 'rom' | 'product'; title: string; preview: string }) => void;
  
  // Sound & Modals
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
  const [activeView, setActiveViewRaw] = useState<ViewName>('feed');
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('wevids_user_v31');
    return saved ? JSON.parse(saved) : CURRENT_USER;
  });
  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>(MOCK_USERS);
  
  const [posts, setPosts] = useState<PostItem[]>(() => {
    const saved = localStorage.getItem('wevids_posts_v31');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });
  
  const [clips, setClips] = useState<ShortClipItem[]>(() => {
    const saved = localStorage.getItem('wevids_clips_v31');
    return saved ? JSON.parse(saved) : INITIAL_CLIPS;
  });
  
  const [longVideos, setLongVideos] = useState<LongVideoItem[]>(() => {
    const saved = localStorage.getItem('wevids_long_videos_v31');
    return saved ? JSON.parse(saved) : INITIAL_LONG_VIDEOS;
  });
  
  const [roms, setRoms] = useState<RomItem[]>(() => {
    const saved = localStorage.getItem('wevids_roms_v31');
    return saved ? JSON.parse(saved) : INITIAL_ROMS;
  });
  
  const [products] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('wevids_cart_v31');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('wevids_convs_v31');
    return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
  });
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || 'conv-group-1');
  
  const [collections, setCollections] = useState<SavedCollection[]>(() => {
    const saved = localStorage.getItem('wevids_bookmarks_v31');
    return saved ? JSON.parse(saved) : INITIAL_BOOKMARKS;
  });
  
  const [soundEnabled, setSoundEnabledRaw] = useState<boolean>(true);
  const [activeShare, setActiveShare] = useState<{ title: string; url: string } | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [activeCallUser, setActiveCallUser] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('wevids_user_v31', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('wevids_posts_v31', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('wevids_clips_v31', JSON.stringify(clips));
  }, [clips]);

  useEffect(() => {
    localStorage.setItem('wevids_long_videos_v31', JSON.stringify(longVideos));
  }, [longVideos]);

  useEffect(() => {
    localStorage.setItem('wevids_roms_v31', JSON.stringify(roms));
  }, [roms]);

  useEffect(() => {
    localStorage.setItem('wevids_cart_v31', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wevids_convs_v31', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('wevids_bookmarks_v31', JSON.stringify(collections));
  }, [collections]);

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

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      setAllUsers(u => ({ ...u, you: updated }));
      return updated;
    });
    sounds.success();
    toast.success('Profile updated successfully!');
  };

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
    toast.success('Post published to global feed!');
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
          isDisliked: false,
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
          isLiked: false,
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
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment],
        };
      }
      return p;
    }));
    toast.success('Comment added!');
  };

  const toggleClipLike = (clipId: string) => {
    sounds.like();
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const wasLiked = c.isLiked;
        return {
          ...c,
          isLiked: !wasLiked,
          likes: wasLiked ? c.likes - 1 : c.likes + 1,
        };
      }
      return c;
    }));
  };

  const toggleClipBookmark = (clipId: string) => {
    sounds.pop();
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    toggleBookmark({
      id: clip.id,
      type: 'clip',
      title: clip.title,
      preview: clip.description,
    });
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, isBookmarked: !c.isBookmarked } : c));
  };

  const addClipComment = (clipId: string, commentData: Omit<CommentItem, 'id' | 'timestamp' | 'likes'>) => {
    sounds.pop();
    const newComment: CommentItem = {
      ...commentData,
      id: `cc-${Date.now()}`,
      timestamp: 'Just now',
      likes: 0,
    };
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          comments: [...c.comments, newComment],
        };
      }
      return c;
    }));
  };

  const addRom = (newRomData: Omit<RomItem, 'id' | 'downloadCount' | 'releaseDate'>) => {
    const newRom: RomItem = {
      ...newRomData,
      id: `rom-${Date.now()}`,
      downloadCount: 1,
      releaseDate: 'Today',
    };
    setRoms(prev => [newRom, ...prev]);
    sounds.success();
    toast.success('ROM submitted to Developer Vault!');
  };

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

  const clearCart = () => {
    setCart([]);
  };

  const sendMessage = (convId: string, msgData: { text?: string; type: 'text' | 'image' | 'gif' | 'video' | 'audio' | 'rom_file'; mediaUrl?: string }) => {
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
        const last = msgData.type === 'audio' ? '🎤 [Voice message]' : msgData.type === 'gif' ? '🖼️ [GIF]' : msgData.text || '[Attachment]';
        return {
          ...c,
          lastMsg: `${currentUser.name}: ${last}`,
          time: 'now',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    // Auto simulated bot/member response in group
    setTimeout(() => {
      const botReplies = [
        "That's high quality! Testing it right now 🚀",
        "Confirmed working with no errors on Snapdragon 8 Gen 3!",
        "Love the fluidity and responsiveness ✨",
        "Bookmarked this for our weekend livestream!",
        "Thanks for sharing with the group!"
      ];
      const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
      const replyMsg: ChatMessage = {
        id: `m-rep-${Date.now()}`,
        fromId: 'carlos',
        senderName: 'Carlos Mendez',
        senderAvatar: 'C',
        senderColor: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
        text: randomReply,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(p => p.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMsg: `Carlos: ${randomReply}`,
            time: 'now',
            messages: [...c.messages, replyMsg]
          };
        }
        return c;
      }));
    }, 1400);
  };

  const createGroupChat = (name: string, members: string[]) => {
    sounds.success();
    const newGroup: Conversation = {
      id: `conv-group-${Date.now()}`,
      isGroup: true,
      groupName: name,
      groupTopic: 'Open developer and creator channel',
      avatar: name.charAt(0).toUpperCase(),
      color: 'linear-gradient(135deg, #00e5ff, #ff2d95)',
      members: ['you', ...members],
      lastMsg: 'Group created. Start chatting!',
      time: 'now',
      unread: 0,
      messages: [
        {
          id: `gm-init-${Date.now()}`,
          fromId: 'you',
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          senderColor: currentUser.color,
          text: `Welcome to ${name}!`,
          type: 'text',
          timestamp: 'Just now'
        }
      ]
    };
    setConversations(prev => [newGroup, ...prev]);
    setActiveConvId(newGroup.id);
    toast.success(`Created group "${name}"`);
  };

  const toggleBookmark = (item: { id: string; type: 'post' | 'clip' | 'long_video' | 'rom' | 'product'; title: string; preview: string }) => {
    sounds.pop();
    setCollections(prev => {
      const defaultCol = prev[0] || { id: 'col-default', name: '📌 Saved Vault', icon: '⭐', items: [] };
      const exists = defaultCol.items.some(i => i.id === item.id);
      
      let updatedItems;
      if (exists) {
        updatedItems = defaultCol.items.filter(i => i.id !== item.id);
        toast.info('Removed from Bookmarks');
      } else {
        updatedItems = [{ ...item, addedAt: 'Just now' }, ...defaultCol.items];
        toast.success('Saved to Bookmarks!');
      }

      return prev.map((col, idx) => idx === 0 ? { ...col, items: updatedItems } : col);
    });
  };

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
        posts,
        addPost,
        togglePostLike,
        togglePostDislike,
        addPostComment,
        clips,
        longVideos,
        toggleClipLike,
        toggleClipBookmark,
        addClipComment,
        roms,
        addRom,
        products,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        conversations,
        activeConvId,
        setActiveConvId,
        sendMessage,
        createGroupChat,
        collections,
        toggleBookmark,
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
  if (!context) {
    throw new Error('useWevids must be used within a WevidsProvider');
  }
  return context;
};