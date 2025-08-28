import { useState } from 'react'
import { sendMessage } from '@/lib/dm'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface DMComposerProps {
  conversationId: string
  onSend?: () => void
}

export function DMComposer({ conversationId, onSend }: DMComposerProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!text.trim()) return
    try {
      setSending(true)
      await sendMessage(conversationId, text)
      setText('')
      onSend?.()
    } catch (e) {
      console.error('Failed to send message', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t p-4 space-y-2">
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write a message"
        rows={2}
      />
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={sending || !text.trim()}>
          Send
        </Button>
      </div>
    </div>
  )
}
