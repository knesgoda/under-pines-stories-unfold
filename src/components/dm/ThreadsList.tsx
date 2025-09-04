import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { fetchThreads, type DMThread } from '@/lib/dm'

type Props = {
  type?: 'inbox' | 'requests'
}

export default function ThreadsList({ type = 'inbox' }: Props) {
  const [threads, setThreads] = useState<DMThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadThreads()
  }, [type, loadThreads])

  const loadThreads = async () => {
    try {
      setLoading(true)
      const data = await fetchThreads(type)
      setThreads(data)
    } catch (error) {
      console.error('Failed to load threads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === 'requests' ? 'No message requests' : 'No conversations yet'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          to={`/messages/${thread.id}`}
          className="block p-4 hover:bg-accent rounded-lg transition-colors"
        >
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarImage src={thread.otherUser.avatar_url || ''} />
              <AvatarFallback>
                {thread.otherUser.display_name?.[0] || thread.otherUser.username[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">
                  {thread.otherUser.display_name || thread.otherUser.username}
                </h3>
                {thread.unreadCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {thread.unreadCount}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">
                @{thread.otherUser.username}
              </p>
              
              {thread.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">
                  {thread.lastMessage.body}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}