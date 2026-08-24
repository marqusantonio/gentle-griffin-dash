import { useMemo } from 'react';
import { useWevids } from '../context/WevidsContext';
import { ViewName } from '../types/wevids';

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'post' | 'message';
  actorName: string;
  avatar: string;
  color: string;
  message: string;
  time: string;
  actionView: ViewName;
}

export const useNotifications = (): NotificationItem[] => {
  const { posts, clips, conversations, currentUser, allUsers } = useWevids();

  return useMemo(() => {
    const currentId = currentUser?.id;
    const items: NotificationItem[] = [];

    if (!currentId) return items;

    // Follow notifications
    const followerIds = currentUser?.followerIds || [];
    followerIds.forEach((followerId) => {
      if (followerId === currentId) return;
      const user = allUsers[followerId];
      if (!user) return;

      items.push({
        id: `follow-${followerId}`,
        type: 'follow',
        actorName: user.name || 'Creator',
        avatar: user.avatarImage || user.avatar || 'C',
        color: user.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
        message: `${user.name || 'Creator'} started following you`,
        time: 'Recently',
        actionView: 'profile',
      });
    });

    // Post notifications
    (posts || []).forEach((post) => {
      if (!post) return;

      // Notifications for my posts
      if (post.userId === currentId) {
        const likeCount = Number(post.likes) || 0;
        if (likeCount > 0) {
          items.push({
            id: `post-like-${post.id}`,
            type: 'like',
            actorName: 'WEVIDS Community',
            avatar: '❤️',
            color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
            message: `Your post received ${likeCount.toLocaleString()} like${likeCount === 1 ? '' : 's'}`,
            time: post.time || 'Recently',
            actionView: 'feed',
          });
        }

        const commentCount = (post.comments?.length) || 0;
        if (commentCount > 0) {
          const lastComment = post.comments?.[0];
          const commenterName = lastComment?.userName || 'Someone';
          items.push({
            id: `post-comment-${post.id}`,
            type: 'comment',
            actorName: commenterName,
            avatar: lastComment?.userAvatar || '💬',
            color: lastComment?.userColor || 'linear-gradient(135deg, #00e5ff, #ff2d95)',
            message: `${commenterName} commented on your post`,
            time: post.time || 'Recently',
            actionView: 'feed',
          });
        }

        return;
      }

      // New post notifications from people I follow
      if ((currentUser?.followingIds || []).includes(post.userId)) {
        const author = allUsers[post.userId];
        items.push({
          id: `new-post-${post.id}`,
          type: 'post',
          actorName: author?.name || post.authorName || 'Creator',
          avatar: author?.avatarImage || post.authorAvatar || 'C',
          color: author?.color || post.authorColor || 'linear-gradient(135deg, #00e5ff, #ff2d95)',
          message: `${author?.name || post.authorName || 'Creator'} shared a new post`,
          time: post.time || 'Recently',
          actionView: 'feed',
        });
      }
    });

    // Clip notifications
    (clips || []).forEach((clip) => {
      if (!clip) return;

      if (clip.userId === currentId) {
        const likeCount = Number(clip.likes) || 0;
        if (likeCount > 0) {
          items.push({
            id: `clip-like-${clip.id}`,
            type: 'like',
            actorName: 'WEVIDS Community',
            avatar: '🎬',
            color: 'linear-gradient(135deg, #ff2d95, #00e5ff)',
            message: `Your short received ${likeCount.toLocaleString()} like${likeCount === 1 ? '' : 's'}`,
            time: 'Recently',
            actionView: 'clips',
          });
        }
      }
    });

    // New message notifications
    (conversations || []).forEach((conv) => {
      if (!conv || conv.status !== 'active') return;
      const lastMessage = conv.messages?.[conv.messages.length - 1];
      const partnerId = conv.members?.find((id) => id !== currentId);
      const partner = partnerId ? allUsers[partnerId] : null;

      if (partner && lastMessage && lastMessage.fromId !== currentId) {
        items.push({
          id: `msg-${conv.id}-${lastMessage.id || Date.now()}`,
          type: 'message',
          actorName: partner.name || 'Creator',
          avatar: partner.avatarImage || partner.avatar || 'C',
          color: partner.color || 'linear-gradient(135deg, #ff2d95, #00e5ff)',
          message: `New message from ${partner.name || 'Creator'}`,
          time: lastMessage.timestamp || 'Just now',
          actionView: 'messages',
        });
      }
    });

    // Sort: most recent types first using type priority
    const typePriority: Record<string, number> = {
      message: 0,
      comment: 1,
      like: 2,
      follow: 3,
      post: 4,
    };

    return items
      .sort((a, b) => (typePriority[a.type] ?? 5) - (typePriority[b.type] ?? 5))
      .slice(0, 20);
  }, [posts, clips, conversations, currentUser, allUsers]);
};