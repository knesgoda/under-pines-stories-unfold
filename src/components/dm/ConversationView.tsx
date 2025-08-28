import { useEffect, useRef, useState } from 'react'
import { DMMessage, fetchMessages } from '@/lib/dm'
import { Loader2 } from 'lucide-react'

interface ConversationViewProps {
  conversationId: string
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMessages(conversationId)
        setMessages(data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
      } catch (e) {
        console.error('Failed to load messages', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [conversationId])

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-2">
      {messages.map(m => (
        <div key={m.id} className="max-w-[80%] rounded-lg bg-muted p-2">
          {m.body}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
