import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useRealtimeMessages(userId: string, onNewMessage: (payload: any) => void) {
  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) return;

    let isSubscribed = true;

    const channel = supabase
      .channel(`realtime-messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (isSubscribed) {
            onNewMessage(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          if (isSubscribed) {
            onNewMessage(payload);
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [userId, onNewMessage]);
}