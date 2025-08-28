import { useState } from 'react'
import { MoreHorizontal, UserX, VolumeX, Flag, Volume2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReportModal } from './ReportModal'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ProfileActionsProps {
  userId: string
  username: string
  isBlocked?: boolean
  isMuted?: boolean
  onUpdate?: () => void
}

export function ProfileActions({ 
  userId, 
  username, 
  isBlocked = false, 
  isMuted = false, 
  onUpdate 
}: ProfileActionsProps) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSafetyAction = async (action: string) => {
    setLoading(true)
    try {
      const response = await fetch(`https://rxlrwephzfsmzspyjsdd.supabase.co/functions/v1/safety-actions/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error('Action failed')
      }

      const actionMessages = {
        block: 'User blocked successfully',
        unblock: 'User unblocked successfully',
        mute: 'User muted successfully',
        unmute: 'User unmuted successfully'
      }

      toast({
        title: 'Success',
        description: actionMessages[action as keyof typeof actionMessages]
      })

      onUpdate?.()
    } catch (error) {
      console.error('Safety action error:', error)
      toast({
        title: 'Error',
        description: 'Failed to perform action. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async (reason: string) => {
    try {
      const response = await fetch('https://rxlrwephzfsmzspyjsdd.supabase.co/functions/v1/safety-actions/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ 
          targetUserId: userId,
          reason 
        })
      })

      if (!response.ok) {
        throw new Error('Report failed')
      }

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.'
      })

      setShowReportModal(false)
    } catch (error) {
      console.error('Report error:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            disabled={loading}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isBlocked ? (
            <DropdownMenuItem
              onClick={() => handleSafetyAction('unblock')}
              className="text-green-600 focus:text-green-600"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Unblock @{username}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleSafetyAction('block')}
              className="text-red-600 focus:text-red-600"
            >
              <UserX className="mr-2 h-4 w-4" />
              Block @{username}
            </DropdownMenuItem>
          )}
          
          {isMuted ? (
            <DropdownMenuItem
              onClick={() => handleSafetyAction('unmute')}
              className="text-green-600 focus:text-green-600"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Unmute @{username}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => handleSafetyAction('mute')}
              className="text-yellow-600 focus:text-yellow-600"
            >
              <VolumeX className="mr-2 h-4 w-4" />
              Mute @{username}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowReportModal(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Flag className="mr-2 h-4 w-4" />
            Report @{username}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReport}
        targetUsername={username}
      />
    </>
  )
}