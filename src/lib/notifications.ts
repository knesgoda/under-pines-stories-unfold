import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  post_id?: string;
  comment_id?: string;
  actor_id: string;
  meta: Record<string, any>;
  read_at?: string;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface NotificationCounts {
  unread: number;
  total: number;
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .is('read_at', null);

  if (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get notifications for the current user with pagination
 */
export async function getNotifications(
  limit: number = 30,
  cursor?: string
): Promise<{ notifications: Notification[]; nextCursor?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { notifications: [] };
  }

  const before = cursor ? new Date(cursor).toISOString() : new Date().toISOString();

  // Get notifications
  const { data: rows, error } = await supabase
    .from('notifications')
    .select('id, type, post_id, comment_id, actor_id, created_at, read_at, meta')
    .eq('user_id', session.user.id)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading notifications:', error);
    return { notifications: [] };
  }

  // Get actor profiles
  const actorIds = Array.from(new Set(rows?.map(r => r.actor_id) ?? []));
  let actors: Record<string, any> = {};
  
  if (actorIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', actorIds);
    
    actors = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
  }

  const notifications: Notification[] = (rows ?? []).map(r => ({
    id: r.id,
    user_id: session.user.id,
    type: r.type,
    post_id: r.post_id,
    comment_id: r.comment_id,
    actor_id: r.actor_id,
    meta: r.meta ?? {},
    read_at: r.read_at,
    created_at: r.created_at,
    actor: actors[r.actor_id] ?? { id: r.actor_id, username: 'unknown' },
  }));

  const nextCursor = notifications.length ? notifications[notifications.length - 1].created_at : undefined;

  return { notifications, nextCursor };
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds?: string[]): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  try {
    let query = supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
      .is('read_at', null);

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    }

    const { error } = await query;

    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
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
    meta?: Record<string, any>;
  } = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        actor_id: actorId,
        post_id: options.postId,
        comment_id: options.commentId,
        meta: options.meta ?? {},
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}
