import * as React from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUnreadCount, listNotifications, markAsRead, subscribeToNotifications, type NotificationWithActor } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';

interface BellMenuProps {
  className?: string;
}

export function BellMenu({ className = '' }: BellMenuProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<NotificationWithActor[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Load initial data
  React.useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [count, { notifications: notifs }] = await Promise.all([
          getUnreadCount(user.id),
          listNotifications({ userId: user.id, limit: 30 })
        ]);
        setUnreadCount(count);
        setNotifications(notifs);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Subscribe to realtime notifications
  React.useEffect(() => {
    if (!user?.id) return;

    const cleanup = subscribeToNotifications(user.id, (notification) => {
      // Add new notification to the list
      setNotifications(prev => [notification as NotificationWithActor, ...prev]);
      
      // Update unread count
      if (!notification.read_at) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return cleanup;
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead([notificationId]);
    if (success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id);
    
    if (unreadIds.length === 0) return;

    const success = await markAsRead(unreadIds);
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
  };

  const getNotificationText = (notification: NotificationWithActor) => {
    const actor = notification.actor;
    const actorName = actor?.display_name || actor?.username || 'Someone';
    
    switch (notification.type) {
      case 'mention':
        return `${actorName} mentioned you in a post`;
      case 'follow':
        return `${actorName} started following you`;
      case 'comment':
        return `${actorName} commented on your post`;
      case 'post_like':
        return `${actorName} liked your post`;
      case 'post_comment':
        return `${actorName} commented on a post you commented on`;
      default:
        return `${actorName} interacted with you`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return '💬';
      case 'follow':
        return '👥';
      case 'comment':
        return '💭';
      case 'post_like':
        return '❤️';
      default:
        return '🔔';
    }
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-emerald-100/90 hover:bg-emerald-900/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 text-emerald-950 text-xs font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-2 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] sm:w-80 bg-emerald-950/95 border border-emerald-800/40 rounded-2xl shadow-xl backdrop-blur z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-emerald-800/40">
              <h3 className="text-lg font-semibold text-emerald-50">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-emerald-300 hover:text-emerald-100 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-emerald-300">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-emerald-300">
                  No notifications yet
                </div>
              ) : (
                <div className="divide-y divide-emerald-800/40">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-emerald-900/30 transition-colors ${
                        !notification.read_at ? 'bg-emerald-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-emerald-50 leading-relaxed">
                            {getNotificationText(notification)}
                          </p>
                          
                          {notification.meta && typeof notification.meta === 'object' && 'content' in notification.meta && (
                            <p className="text-xs text-emerald-300/70 mt-1 truncate">
                              "{String(notification.meta.content)}"
                            </p>
                          )}
                          
                          <p className="text-xs text-emerald-400/60 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {!notification.read_at && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 rounded-full hover:bg-emerald-800/50 transition-colors"
                            aria-label="Mark as read"
                          >
                            <Check className="h-4 w-4 text-emerald-300" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-emerald-800/40">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    window.location.href = '/notifications';
                  }}
                  className="w-full text-center text-sm text-emerald-300 hover:text-emerald-100 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
