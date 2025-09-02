'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import { CommentCard } from './CommentCard'
import { CommentForm } from './CommentForm'
import { Button } from '@/components/ui/button'
import { Loader2, MessageCircle } from 'lucide-react'

interface Comment {
  id: string
  body: string
  author_id: string
  post_id: string
  created_at: string
  is_deleted: boolean
  author: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface CommentThreadProps {
  postId: string
}

export function CommentThread({ postId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const loadComments = async () => {
    try {
      const { data, error } = await supabase.rpc('get_post_comments', {
        p_viewer: user?.id || null,
        p_post: postId,
        p_limit: 50
      })

      if (error) throw error
      setComments(Array.isArray(data) ? (data as unknown as Comment[]) : [])
    } catch (error) {
      console.error('Error loading comments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createComment = async (body: string, parentId?: string) => {
    if (!user) return

    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) return

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        postId,
        body,
        parentId: parentId || null
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create comment')
    }

    return response.json()
  }

  const handleSubmitComment = async (body: string) => {
    setIsSubmitting(true)
    try {
      await createComment(body)
      await loadComments()
      toast({
        title: "Comment posted",
        description: "Your comment has been added"
      })
    } catch (error) {
      console.error('Error creating comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (body: string) => {
    if (!replyingTo) return
    setIsSubmitting(true)
    try {
      await createComment(body, replyingTo)
      await loadComments()
      setReplyingTo(null)
      toast({
        title: "Reply posted",
        description: "Your reply has been added"
      })
    } catch (error) {
      console.error('Error creating reply:', error)
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string, newBody: string) => {
    if (!user) return

    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ body: newBody })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to edit comment')
      }

      await loadComments()
      toast({
        title: "Comment updated",
        description: "Your comment has been updated"
      })
    } catch (error) {
      console.error('Error editing comment:', error)
      toast({
        title: "Error",
        description: "Failed to edit comment",
        variant: "destructive"
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete comment')
      }

      await loadComments()
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted"
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadComments()
  }, [postId])

  useEffect(() => {
    const channel = supabase.channel(`comments:${postId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments', 
        filter: `post_id=eq.${postId}` 
      }, () => {
        loadComments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5" />
        <span>Comments ({comments.length})</span>
      </div>

      <CommentForm 
        onSubmit={handleSubmitComment}
        placeholder="Write a comment..."
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-card-foreground/60">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-0 border border-border rounded-lg bg-card">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                onReply={(commentId) => setReplyingTo(commentId === replyingTo ? null : commentId)}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                currentUserId={user?.id}
              />
              
              {replyingTo === comment.id && (
                <div className="ml-11 pb-3 border-b border-border/50">
                  <CommentForm
                    onSubmit={handleReply}
                    placeholder={`Reply to ${comment.author.display_name || comment.author.username}...`}
                    isReply
                    onCancel={() => setReplyingTo(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}