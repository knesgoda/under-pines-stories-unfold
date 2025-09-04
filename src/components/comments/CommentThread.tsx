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
  parent_id?: string
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
  onCommentChange?: () => void
}

export function CommentThread({ postId, onCommentChange }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const loadComments = async () => {
    try {
      // Use direct database query instead of RPC function to avoid schema mismatches
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          body,
          author_id,
          post_id,
          parent_id,
          created_at,
          is_deleted,
          author:profiles!author_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(50)

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
    if (!user) {
      console.error('No user found when trying to create comment')
      throw new Error('User not authenticated')
    }

    console.log('User object:', user)
    console.log('Creating comment with:', { 
      post_id: postId, 
      body, 
      author_id: user.id 
    })

    const { data, error } = await supabase
      .from('comments')
      .insert({ 
        post_id: postId, 
        body, 
        author_id: user.id,
        parent_id: parentId || null
      })
      .select('*')
      .single()

    if (error) {
      console.error('Supabase error creating comment:', error)
      throw error
    }

    console.log('Comment created successfully:', data)

    // Create notifications
    try {
      const excerpt = body.slice(0, 120)
      
      // Notify post author
      const { data: post } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single()
      
      if (post?.author_id) {
        await supabase.rpc('create_notification', {
          p_user: post.author_id,
          p_actor: user.id,
          p_type: 'post_comment',
          p_post: postId,
          p_comment: data.id,
          p_meta: { excerpt }
        })
      }

      // Notify parent comment author if replying
      if (parentId) {
        const { data: parent } = await supabase
          .from('comments')
          .select('author_id')
          .eq('id', parentId)
          .single()
        
        const parentAuthor = parent?.author_id
        if (parentAuthor && parentAuthor !== post?.author_id) {
          await supabase.rpc('create_notification', {
            p_user: parentAuthor,
            p_actor: user.id,
            p_type: 'comment_reply',
            p_post: postId,
            p_comment: data.id,
            p_meta: { excerpt }
          })
        }
      }
    } catch (e) {
      console.error('[comments:notify]', e)
    }

    return data
  }

  const handleSubmitComment = async (body: string) => {
    setIsSubmitting(true)
    try {
      await createComment(body)
      await loadComments()
      onCommentChange?.() // Notify parent component
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
      onCommentChange?.() // Notify parent component
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

    try {
      const { error } = await supabase
        .from('comments')
        .update({ body: newBody })
        .eq('id', commentId)
        .eq('author_id', user.id) // Ensure user can only edit their own comments

      if (error) throw error

      await loadComments()
      onCommentChange?.() // Notify parent component
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

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('author_id', user.id) // Ensure user can only delete their own comments

      if (error) throw error

      await loadComments()
      onCommentChange?.() // Notify parent component
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
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-0 border border-border rounded-lg bg-card">
          {comments
            .filter(comment => !comment.parent_id) // Only show top-level comments
            .map((comment) => {
              const replies = comments.filter(reply => reply.parent_id === comment.id)
              return (
                <div key={comment.id}>
                  <CommentCard
                    comment={comment}
                    onReply={(commentId) => setReplyingTo(commentId === replyingTo ? null : commentId)}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    currentUserId={user?.id}
                  />
                  
                  {/* Show replies */}
                  {replies.length > 0 && (
                    <div className="ml-11 space-y-0 border-l border-border/30">
                      {replies.map((reply) => (
                        <CommentCard
                          key={reply.id}
                          comment={reply}
                          onReply={(commentId) => setReplyingTo(commentId === replyingTo ? null : commentId)}
                          onEdit={handleEditComment}
                          onDelete={handleDeleteComment}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>
                  )}
                  
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
              )
            })}
        </div>
      )}
    </div>
  )
}