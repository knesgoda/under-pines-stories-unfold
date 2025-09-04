import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
// Using regular img since app is Vite-based
import { supabase } from '@/integrations/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { getNotifications, markNotificationsAsRead, type Notification } from '@/lib/notifications'

export type Notif = {
  id: string
  type: 'follow'|'follow_request'|'follow_accept'|'post_like'|'post_comment'|'comment_reply'
  postId?: string | null
  commentId?: string | null
  createdAt: string
  readAt?: string | null
  meta?: Record<string, unknown>
  actor: { id: string; username: string; display_name?: string | null; avatar_url?: string | null }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function loadMore() {
    if (loading || done) return
    setLoading(true)
    
    try {
      const { notifications, nextCursor } = await getNotifications(30, cursor)
      
      // Convert to the expected format
      const newItems: Notif[] = notifications.map(n => ({
        id: n.id,
        type: n.type as any,
        postId: n.post_id,
        commentId: n.comment_id,
        createdAt: n.created_at,
        readAt: n.read_at,
        meta: n.meta,
        actor: n.actor,
      }))

      setItems(prev => [...prev, ...newItems])
      setCursor(nextCursor)
      setDone(!nextCursor)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadMore() }, [])

  async function markAllRead() {
    const success = await markNotificationsAsRead()
    if (success) {
      setItems(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    }
  }

  function textFor(n: Notif) {
    const name = n.actor.display_name || n.actor.username
    switch (n.type) {
      case 'follow':         return `${name} started following you`
      case 'follow_request': return `${name} requested to follow you`
      case 'follow_accept':  return `${name} accepted your follow request`
      case 'post_like':      return `${name} liked your post`
      case 'post_comment':   return `${name} commented on your post`
      case 'comment_reply':  return `${name} replied to your comment`
    }
  }

  function linkFor(n: Notif) {
    if (n.postId) return `/post/${n.postId}${n.commentId ? `#c-${n.commentId}` : ''}`
    return `/${n.actor.username}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Notifications</h1>
            <button onClick={markAllRead} className="text-sm text-accent-warm hover:opacity-90">Mark all as read</button>
          </div>

          <ul className="space-y-2">
            {items.map(n => (
              <li key={n.id} className={`p-3 rounded-md bg-background-panel ${!n.readAt ? 'outline outline-1 outline-accent-warm/40' : ''}`}>
                <Link to={linkFor(n)} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-black/20">
                    {n.actor.avatar_url && (
                      <img src={n.actor.avatar_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm">{textFor(n)}</div>
                    {n.meta?.excerpt && <div className="text-xs text-text-light/70 truncate">"{String(n.meta.excerpt)}"</div>}
                    <div className="text-xs text-text-light/50">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {!done && (
            <div className="flex justify-center py-6">
              <button onClick={loadMore} disabled={loading} className="px-4 h-9 rounded-md bg-background-sand text-black">
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}