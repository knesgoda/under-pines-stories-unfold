'use client'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUnreadNotificationCount } from '@/lib/notifications'
import { safeCleanup } from '@/lib/safeCleanup'

interface Props { isActive?: boolean }

export default function NotificationsBell({ isActive }: Props) {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let subscription: unknown
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) return
      
      // Get unread count using the service
      const unreadCount = await getUnreadNotificationCount()
      setCount(unreadCount)
      
      // Subscribe to real-time updates
      subscription = supabase
        .channel(`notifs:${uid}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          () => setCount(c => c + 1)
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          () => {
            // Refresh count when notifications are marked as read
            getUnreadNotificationCount().then(setCount)
          }
        )
        .subscribe()
    }
    init()
    return () => { 
      safeCleanup(subscription)
    }
  }, [])

  return (
    <Link
      to="/notifications"
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all hover:bg-muted/20 hover:text-accent interactive-glow',
        isActive ? 'bg-primary/20 text-accent border-l-2 border-primary' : 'text-secondary-foreground/80'
      )}
    >
      <Bell className="h-5 w-5 flex-shrink-0" />
      <span>Notifications</span>
      {count > 0 && (
        <span className="absolute right-3 top-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-warm text-black text-[11px] leading-[18px] text-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
