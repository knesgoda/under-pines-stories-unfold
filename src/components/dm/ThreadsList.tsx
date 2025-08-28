import { useEffect, useState } from 'react'
import { fetchThreads, DMThread } from '@/lib/dm'
import { Loader2 } from 'lucide-react'

interface ThreadsListProps {
  box?: 'inbox' | 'requests'
  onSelect?: (thread: DMThread) => void
}

export function ThreadsList({ box = 'inbox', onSelect }: ThreadsListProps) {
  const [threads, setThreads] = useState<DMThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchThreads(box)
        setThreads(data as DMThread[])
      } catch (e) {
        console.error('Failed to load threads', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [box])

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="divide-y">
      {threads.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect?.(t)}
          className="w-full text-left p-4 hover:bg-accent"
        >
          <div className="font-medium">{t.other_user.display_name || t.other_user.username}</div>
          {t.last_message && (
            <div className="text-sm text-muted-foreground truncate">
              {t.last_message.body}
            </div>
          )}
        </button>
      ))}
      {threads.length === 0 && (
        <div className="p-4 text-muted-foreground text-sm">No messages</div>
      )}
    </div>
  )
}
