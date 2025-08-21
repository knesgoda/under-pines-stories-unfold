import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'friend_request' | 'group_invite' | 'message';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  related_user_id: string | null;
  related_post_id: string | null;
  related_group_id: string | null;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      
      // Subscribe to real-time updates
      const subscription = supabase
        .channel('notifications_changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          refreshNotifications();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const refreshNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
      } else {
        setNotifications(data || []);
        const unread = data?.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
      } else {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createNotification = async (notificationData: Omit<Notification, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    createNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};