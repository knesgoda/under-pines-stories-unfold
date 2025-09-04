import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { listNotifications, markAsRead, markAllAsRead, type NotificationWithActor } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Filter, X } from 'lucide-react';

type FilterType = 'all' | 'mentions' | 'follows' | 'comments' | 'likes';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<NotificationWithActor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [nextCursor, setNextCursor] = React.useState<string | undefined>();
  const [hasMore, setHasMore] = React.useState(true);

  const loadNotifications = async (cursor?: string, append = false) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { notifications: newNotifications, nextCursor: newNextCursor } = await listNotifications({
        cursor,
        limit: 30,
        type: filter === 'all' ? undefined : filter
      });

      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      setNextCursor(newNextCursor);
      setHasMore(!!newNextCursor);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id, filter]);

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
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications
      .filter(n => !n.read_at)
      .map(n => n.id);
    
    if (unreadIds.length === 0) return;

    const success = await markAllAsRead(user!.id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
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

  const filterOptions: Array<{ value: FilterType; label: string; count?: number }> = [
    { value: 'all', label: 'All' },
    { value: 'mentions', label: 'Mentions' },
    { value: 'follows', label: 'Follows' },
    { value: 'comments', label: 'Comments' },
    { value: 'likes', label: 'Likes' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-50 mb-4">Please sign in</h1>
          <p className="text-emerald-300">You need to be signed in to view notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-emerald-50">Notifications</h1>
            {notifications.some(n => !n.read_at) && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 text-emerald-50 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-emerald-800 text-emerald-50'
                    : 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
                }`}
              >
                {option.label}
                {option.count !== undefined && (
                  <span className="ml-2 text-xs opacity-70">({option.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {isLoading && notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                <p className="text-emerald-300">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold text-emerald-50 mb-2">No notifications</h3>
                <p className="text-emerald-300">
                  {filter === 'all' 
                    ? "You're all caught up! Check back later for new notifications."
                    : `No ${filter} notifications yet.`
                  }
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 rounded-2xl border transition-colors ${
                    !notification.read_at 
                      ? 'bg-emerald-900/30 border-emerald-800/50' 
                      : 'bg-emerald-950/50 border-emerald-800/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-50 leading-relaxed">
                        {getNotificationText(notification)}
                      </p>
                      
                      {notification.post && (
                        <div className="mt-3 p-3 bg-emerald-900/30 rounded-lg border border-emerald-800/30">
                          <p className="text-sm text-emerald-200 line-clamp-3">
                            "{notification.post.content}"
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-emerald-400/70">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                        
                        {!notification.read_at && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-emerald-800/50 text-emerald-200 rounded-full hover:bg-emerald-800/70 transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            Mark read
                          </button>
                    )}
                  </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Load More */}
            {hasMore && !isLoading && (
              <div className="text-center pt-6">
                <button
                  onClick={() => loadNotifications(nextCursor, true)}
                  className="px-6 py-3 bg-emerald-800 text-emerald-50 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Load more notifications
              </button>
            </div>
          )}

            {isLoading && notifications.length > 0 && (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}