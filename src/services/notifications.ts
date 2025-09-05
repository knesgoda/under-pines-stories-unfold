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
  // Notifications are currently disabled
  return 0;
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
  // Notifications are currently disabled
  return { notifications: [], hasMore: false };
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[]): Promise<boolean> {
  // Notifications are currently disabled
  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  // Notifications are currently disabled
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
  // Notifications are currently disabled
  return true;
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification) => void
): () => void {
  // Notifications are currently disabled
  return () => {};
}