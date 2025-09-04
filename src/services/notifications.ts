import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  post_id?: string;
  comment_id?: string;
  actor_id?: string;
  meta: Record<string, unknown>;
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
}

export interface NotificationListResult {
  notifications: NotificationWithActor[];
  hasMore: boolean;
  nextCursor?: string;
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
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * List notifications with pagination
 */
export async function listNotifications({
  userId,
  cursor,
  limit = 20,
  type
}: {
  userId: string;
  cursor?: string;
  limit?: number;
  type?: string;
}): Promise<NotificationListResult> {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (type) {
    query = query.eq('type', type);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], hasMore: false };
  }

  const notifications = data || [];
  const hasMore = notifications.length > limit;
  const result = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor = hasMore ? result[result.length - 1]?.created_at : undefined;

  return {
    notifications: result as NotificationWithActor[],
    hasMore,
    nextCursor
  };
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', notificationIds);

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
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: string,
  actorId: string,
  options: {
    postId?: string;
    commentId?: string;
    meta?: Record<string, unknown>;
  } = {}
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      actor_id: actorId,
      post_id: options.postId,
      comment_id: options.commentId,
      meta: options.meta || {}
    });

  if (error) {
    console.error('Error creating notification:', error);
    return false;
  }

  return true;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): () => void {
  const channel = supabase
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
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}