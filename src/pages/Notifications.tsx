import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Heart, MessageCircle, User, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { getNotifications, markNotificationsAsRead, type NotificationWithActor } from '@/lib/notifications'
import { toast } from '@/hooks/use-toast'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)
  type Filter = 'all' | 'likes' | 'comments' | 'follows' | 'mentions'
  const [filter, setFilter] = useState<Filter>('all')

  const loadNotifications = async (cursor?: string) => {
    if (!user) return

    try {
      // Notifications are disabled for now
      setNotifications([])
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter])

  const handleMarkAsRead = async (notificationIds?: string[]) => {
    try {
      await markNotificationsAsRead(notificationIds || [])
      // Refresh notifications after marking as read
      loadNotifications()
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case 'follow':
        return <User className="h-4 w-4 text-green-500" />
      case 'mention':
        return <Hash className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationText = (notification: NotificationWithActor) => {
    const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone'
    
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`
      case 'comment':
        return `${actorName} commented on your post`
      case 'follow':
        return `${actorName} started following you`
      case 'mention':
        return `${actorName} mentioned you in a post`
      default:
        return `${actorName} interacted with your content`
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    return notification.type === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-0 md:ml-60 pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
          </div>
        </main>
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={(value: string) => setFilter(value as Filter)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="follows">Follows</TabsTrigger>
            <TabsTrigger value="mentions">Mentions</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "You'll see notifications here when people interact with your content"
                  : `No ${filter} notifications yet`
                }
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`p-4 transition-colors ${
                  !notification.read_at ? 'bg-muted/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {notification.actor ? (
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.actor.avatar_url || ''} />
                        <AvatarFallback>
                          {notification.actor.display_name?.[0] || notification.actor.username[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getNotificationIcon(notification.type)}
                      <p className="text-sm font-medium">
                        {getNotificationText(notification)}
                      </p>
                      {!notification.read_at && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs mt-2"
                        onClick={() => handleMarkAsRead([notification.id])}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                  
                  {notification.post_id && (
                    <Link
                      to={`/post/${notification.post_id}`}
                      className="text-xs text-primary hover:underline flex-shrink-0"
                    >
                      View post
                    </Link>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
        </div>
      </main>
      <MobileNav />
    </div>
  )
}