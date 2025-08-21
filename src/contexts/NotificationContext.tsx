import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification } from '@/lib/localStorage';
import { notificationStorage } from '@/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  const refreshNotifications = () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userNotifications = notificationStorage.getByUserId(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    if (!user) return;
    
    notificationStorage.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    if (!user) return;
    
    const unreadIds = notifications
      .filter(n => !n.isRead)
      .map(n => n.id);
    
    unreadIds.forEach(id => notificationStorage.markAsRead(id));
    
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const createNotification = (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification = notificationStorage.create({
      ...notificationData,
      priority: notificationData.priority || 'medium'
    });
    
    // Show toast for high priority notifications
    if (newNotification.priority === 'high') {
      toast({
        title: getNotificationTitle(newNotification.type),
        description: newNotification.message,
        duration: 5000,
      });
    }
    
    // Refresh notifications if it's for the current user
    if (user && notificationData.userId === user.id) {
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const getNotificationTitle = (type: Notification['type']): string => {
    switch (type) {
      case 'like': return 'New Like';
      case 'comment': return 'New Comment';
      case 'friend_request': return 'Friend Request';
      case 'friend_accept': return 'Friend Request Accepted';
      case 'group_invite': return 'Group Invitation';
      case 'group_join': return 'New Group Member';
      case 'message': return 'New Message';
      case 'mention': return 'You were mentioned';
      case 'group_post': return 'New Group Post';
      default: return 'Notification';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};