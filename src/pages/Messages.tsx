import { useState } from 'react'
import { ThreadsList } from '@/components/dm/ThreadsList'
import { ConversationView } from '@/components/dm/ConversationView'
import { DMComposer } from '@/components/dm/DMComposer'
import { DMThread } from '@/lib/dm'
import { RequestBanner } from '@/components/dm/RequestBanner'

export default function Messages() {
  const [selected, setSelected] = useState<DMThread | null>(null)

  return (
    <div className="min-h-screen grid md:grid-cols-[320px_1fr]">
      <div className="border-r">
        <ThreadsList onSelect={setSelected} />
      </div>
      <div className="flex flex-col h-full">
        {!selected && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation
          </div>
        )}
        {selected && (
          <div className="flex flex-col h-full">
            {selected.state === 'pending' && (
              <RequestBanner conversationId={selected.id} onAction={() => setSelected(null)} />
            )}
            <div className="flex-1">
              <ConversationView conversationId={selected.id} />
            </div>
            {selected.state === 'active' && (
              <DMComposer conversationId={selected.id} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
