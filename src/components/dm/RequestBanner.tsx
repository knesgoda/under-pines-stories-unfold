import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'

interface RequestBannerProps {
  conversationId: string
  onAction?: (action: 'accept' | 'decline') => void
}

export function RequestBanner({ conversationId, onAction }: RequestBannerProps) {
  async function handle(action: 'accept' | 'decline') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      await supabase.rpc('dm_set_request', {
        p_me: user.id,
        p_conversation: conversationId,
        p_action: action
      })
      onAction?.(action)
    } catch (e) {
      console.error('Failed to update request', e)
    }
  }

  return (
    <div className="bg-muted p-3 flex items-center justify-between">
      <span className="text-sm">This conversation is pending</span>
      <div className="space-x-2">
        <Button size="sm" onClick={() => handle('accept')}>Accept</Button>
        <Button size="sm" variant="outline" onClick={() => handle('decline')}>Decline</Button>
      </div>
    </div>
  )
}
