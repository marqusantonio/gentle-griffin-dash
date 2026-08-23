import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';

interface SocialSyncOptions {
  currentUserId: string;
  targetUserId: string;
}

export function useSocialSync({ currentUserId, targetUserId }: SocialSyncOptions) {
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(0);

  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Fetch of Profile Stats and Relationship State
  const fetchSocialData = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      if (isSupabaseConfigured()) {
        // Fetch target profile counters
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('follower_count, following_count, likes_count, followers, likes')
          .eq('id', targetUserId)
          .maybeSingle();

        if (!profileError && profileData) {
          setFollowerCount(profileData.follower_count ?? profileData.followers ?? 0);
          setFollowingCount(profileData.following_count ?? 0);
          setLikesCount(profileData.likes_count ?? profileData.likes ?? 0);
        }

        if (currentUserId && currentUserId !== targetUserId) {
          // Check if current user follows target
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId)
            .maybeSingle();

          setIsFollowing(Boolean(followData));

          // Check if current user likes target profile
          const { data: likeData } = await supabase
            .from('profile_likes')
            .select('*')
            .eq('liker_id', currentUserId)
            .eq('target_id', targetUserId)
            .maybeSingle();

          setIsLiked(Boolean(likeData));
        }
      }
    } catch (err) {
      console.error('[useSocialSync] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  // Realtime subscription to profiles table for counter updates across tabs/clients
  useEffect(() => {
    if (!isSupabaseConfigured() || !targetUserId) return;

    const channel = supabase
      .channel(`social-sync-${targetUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${targetUserId}`
        },
        (payload: any) => {
          if (payload?.new) {
            const updated = payload.new;
            setFollowerCount(updated.follower_count ?? updated.followers ?? 0);
            setFollowingCount(updated.following_count ?? 0);
            setLikesCount(updated.likes_count ?? updated.likes ?? 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  // Optimistic Follow Toggle Action
  const toggleFollow = async () => {
    if (!currentUserId || currentUserId === targetUserId) {
      toast.error('Cannot follow yourself or unauthenticated user');
      return;
    }

    const previousIsFollowing = isFollowing;
    const previousFollowerCount = followerCount;

    // Optimistic UI Update
    const nextFollowingState = !previousIsFollowing;
    setIsFollowing(nextFollowingState);
    setFollowerCount(prev => nextFollowingState ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (isSupabaseConfigured()) {
        if (nextFollowingState) {
          const { error } = await supabase.from('follows').upsert([{
            follower_id: currentUserId,
            following_id: targetUserId,
            status: 'accepted'
          }]);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('follows').delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId);
          if (error) throw error;
        }
      }
      toast.success(nextFollowingState ? 'Successfully followed!' : 'Unfollowed.');
    } catch (err: any) {
      // Rollback on error
      setIsFollowing(previousIsFollowing);
      setFollowerCount(previousFollowerCount);
      toast.error(`Follow update failed: ${err.message || err}`);
    }
  };

  // Optimistic Like Toggle Action
  const toggleLike = async () => {
    if (!currentUserId) {
      toast.error('Please sign in to like profiles');
      return;
    }

    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    // Optimistic UI Update
    const nextLikedState = !previousIsLiked;
    setIsLiked(nextLikedState);
    setLikesCount(prev => nextLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (isSupabaseConfigured()) {
        if (nextLikedState) {
          const { error } = await supabase.from('profile_likes').upsert([{
            liker_id: currentUserId,
            target_id: targetUserId
          }]);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('profile_likes').delete()
            .eq('liker_id', currentUserId)
            .eq('target_id', targetUserId);
          if (error) throw error;
        }
      }
      toast.success(nextLikedState ? 'Profile liked! ❤️' : 'Like removed.');
    } catch (err: any) {
      // Rollback on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      toast.error(`Like update failed: ${err.message || err}`);
    }
  };

  return {
    followerCount,
    followingCount,
    likesCount,
    isFollowing,
    isLiked,
    loading,
    toggleFollow,
    toggleLike,
    refetch: fetchSocialData
  };
}