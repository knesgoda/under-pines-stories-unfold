'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { validateFormInput, rateLimiter } from '@/lib/security'
import { toast } from '@/hooks/use-toast'

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
  isReply?: boolean
  onCancel?: () => void
}

export function CommentForm({ onSubmit, placeholder = "Write a comment...", isReply = false, onCancel }: CommentFormProps) {
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || isSubmitting) return

    // Rate limiting check
    const userId = user?.id || 'anonymous';
    if (!rateLimiter.isAllowed(`comment-${userId}`, 10, 60000)) {
      toast({
        title: "Too many attempts",
        description: "Please wait a moment before commenting again.",
        variant: "destructive"
      });
      return;
    }

    // Validate and sanitize input
    const validation = validateFormInput(body, {
      maxLength: 1000,
      minLength: 1,
      required: true
    });

    if (!validation.isValid) {
      toast({
        title: "Invalid input",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true)
    try {
      await onSubmit(validation.sanitized)
      setBody('')
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast({
        title: "Error",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  if (!user) {
    return (
      <div className="p-4 bg-background-panel rounded-lg text-center text-card-foreground/60">
        <p>Please log in to comment</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="bg-accent-warm text-bg-dark text-xs">
            {(user.email || 'U')[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
            maxLength={1000}
          />
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-card-foreground/60">
              {body.length}/1000 {!isReply && '• Cmd+Enter to submit'}
            </span>
            
            <div className="flex gap-2">
              {isReply && onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!body.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}