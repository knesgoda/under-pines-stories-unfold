import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  post_id?: string;
  comment_id?: string;
  actor_id?: string;
  meta: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface NotificationWithActor extends Notification {
  actor?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * List notifications with pagination
 */
export async function listNotifications({
  cursor,
  limit = 30,
  type
}: {
  cursor?: string;
  limit?: number;
  type?: string;
} = {}): Promise<{ notifications: NotificationWithActor[]; nextCursor?: string }> {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      ),
      post:posts!notifications_post_id_fkey(
        id,
        content
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Get one extra to check if there are more

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing notifications:', error);
    return { notifications: [] };
  }

  const notifications = data || [];
  const hasMore = notifications.length > limit;
  const nextCursor = hasMore ? notifications[limit - 1]?.created_at : undefined;

  return {
    notifications: hasMore ? notifications.slice(0, limit) : notifications,
    nextCursor
  };
}

/**
 * Mark notifications as read
 */
export async function markAsRead(ids: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

/**
 * Subscribe to realtime notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): RealtimeChannel {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();
}

/**
 * Create a notification
 */
export async function createNotification({
  user_id,
  type,
  post_id,
  comment_id,
  actor_id,
  meta = {}
}: {
  user_id: string;
  type: string;
  post_id?: string;
  comment_id?: string;
  actor_id?: string;
  meta?: Record<string, any>;
}): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id,
      type,
      post_id,
      comment_id,
      actor_id,
      meta
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data;
}
