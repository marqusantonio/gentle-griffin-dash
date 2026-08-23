import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Zap, Loader2 } from 'lucide-react';
import { useWevids } from '../../context/WevidsContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export type RelationshipState = 'NONE' | 'FOLLOWING' | 'FOLLOW_BACK' | 'FRIENDS';

interface FollowButtonProps {
  targetUserId: string;
  targetUserName?: string;
  onStatusChange?: (status: RelationshipState) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  targetUserName = 'Creator',
  onStatusChange,
  className = '',
  size = 'md'
}) => {
  const { currentUser, toggleFollowUser, isFollowing, isMutualFriend } = useWevids();
  const [relStatus, setRelStatus] = useState<RelationshipState>('NONE');
  const [isProcessing, setIsProcessing] = useState(false);

  const isMe = targetUserId === currentUser?.id;

  useEffect(() => {
    if (isMe) return;

    let isMounted = true;

    const checkRelationship = async () => {
      if (isSupabaseConfigured() && currentUser?.id) {
        try {
          const { data, error } = await supabase.rpc('get_relationship_status', {
            p_current_user_id: currentUser.id,
            p_target_user_id: targetUserId
          });
          if (!error && data && isMounted) {
            setRelStatus(data as RelationshipState);
            onStatusChange?.(data as RelationshipState);
            return;
          }
        } catch {
          // Fallback
        }
      }

      if (isMounted) {
        if (isMutualFriend(targetUserId)) {
          setRelStatus('FRIENDS');
          onStatusChange?.('FRIENDS');
        } else if (isFollowing(targetUserId)) {
          setRelStatus('FOLLOWING');
          onStatusChange?.('FOLLOWING');
        } else {
          setRelStatus('NONE');
          onStatusChange?.('NONE');
        }
      }
    };

    checkRelationship();

    return () => {
      isMounted = false;
    };
  }, [targetUserId, currentUser.id, isMutualFriend, isFollowing, isMe, onStatusChange]);

  if (isMe) return null;

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;

    sounds.click();
    setIsProcessing(true);

    try {
      await toggleFollowUser(targetUserId);

      if (isSupabaseConfigured() && currentUser?.id) {
        const { data } = await supabase.rpc('get_relationship_status', {
          p_current_user_id: currentUser.id,
          p_target_user_id: targetUserId
        });
        if (data) {
          setRelStatus(data as RelationshipState);
          onStatusChange?.(data as RelationshipState);
        }
      } else {
        const nextState = relStatus === 'NONE' ? 'FOLLOWING' : relStatus === 'FOLLOW_BACK' ? 'FRIENDS' : 'NONE';
        setRelStatus(nextState);
        onStatusChange?.(nextState);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update relationship');
    } finally {
      setIsProcessing(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-5 py-2.5 text-xs font-orbitron font-bold'
  }[size];

  if (relStatus === 'FRIENDS') {
    return (
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className={`relative inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse hover:scale-105 transition-all duration-300 group ${className}`}
        title="Mutual Friends Linked - Unrestricted Messaging"
      >
        <span className={`w-full h-full bg-slate-950 rounded-[14px] ${sizeClasses} flex items-center gap-1.5 font-orbitron font-bold text-cyan-400 group-hover:bg-transparent group-hover:text-white transition-all`}>
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
          )}
          <span>⚡ LINKED / FRIENDS</span>
        </span>
      </button>
    );
  }

  if (relStatus === 'FOLLOW_BACK') {
    return (
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className={`inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 text-slate-950 font-orbitron font-bold ${sizeClasses} shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] hover:scale-105 transition-all duration-300 ${className}`}
        title={`${targetUserName} follows you. Click to follow back & unlock Friends status!`}
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <UserPlus className="w-3.5 h-3.5" />
        )}
        <span>⚡ FOLLOW BACK</span>
      </button>
    );
  }

  if (relStatus === 'FOLLOWING') {
    return (
      <button
        onClick={handleAction}
        disabled={isProcessing}
        className={`inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 border border-cyan-400/40 text-cyan-400 font-orbitron font-bold ${sizeClasses} hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all duration-300 ${className}`}
        title="Click to unfollow"
      >
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <UserCheck className="w-3.5 h-3.5" />
        )}
        <span>REQUESTED</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleAction}
      disabled={isProcessing}
      className={`inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 border border-cyan-400 text-cyan-400 font-orbitron font-bold ${sizeClasses} shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.7)] hover:bg-cyan-400 hover:text-slate-950 transition-all duration-300 ${className}`}
    >
      {isProcessing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      <span>+ FOLLOW</span>
    </button>
  );
};