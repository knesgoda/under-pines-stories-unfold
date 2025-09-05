import { supabase } from '@/integrations/supabase/client'

export interface Notification {
  id: string
  user_id: string
  type: string
  actor_id?: string
  post_id?: string
  comment_id?: string
  meta?: Record<string, any>
  read_at?: string
  created_at: string
}

export interface NotificationWithActor extends Notification {
  actor?: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  // Notifications are currently disabled
  return 0;
}

export async function getNotifications(userId: string, limit = 20, offset = 0): Promise<any[]> {
  // Notifications are currently disabled
  return [];
}

export async function markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
  // Notifications are currently disabled
  return true;
}

export async function createNotification(
  userId: string,
  type: string,
  actorId?: string,
  postId?: string,
  commentId?: string,
  meta?: Record<string, any>
): Promise<void> {
  // Notifications are currently disabled
  return;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  // Notifications are currently disabled
  return true;
}

export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
): () => void {
  // Notifications are currently disabled - return a no-op cleanup function
  return () => {};
}