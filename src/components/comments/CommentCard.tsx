'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Reply, Heart } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface Comment {
  id: string
  body: string
  author_id: string
  created_at: string
  is_deleted: boolean
  author: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

interface CommentCardProps {
  comment: Comment
  onReply?: (commentId: string) => void
  onEdit?: (commentId: string, body: string) => void
  onDelete?: (commentId: string) => void
  currentUserId?: string
}

export function CommentCard({ comment, onReply, onEdit, onDelete, currentUserId }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)

  const createdAt = new Date(comment.created_at)
  const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true })

  const displayName = comment.author.display_name || comment.author.username
  const isOwner = currentUserId === comment.author_id

  // Load like state on mount
  useEffect(() => {
    if (!currentUserId) return
    
    const loadLikeState = async () => {
      try {
        // Check if user has liked this comment
        const { data: likeData } = await supabase
          .from('comment_likes')
          .select('user_id')
          .eq('comment_id', comment.id)
          .eq('user_id', currentUserId)
          .maybeSingle()

        setIsLiked(!!likeData)

        // Get like count
        const { count } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id)

        setLikeCount(count || 0)
      } catch (error) {
        console.error('Error loading like state:', error)
      }
    }

    loadLikeState()
  }, [comment.id, currentUserId])

  const handleLike = async () => {
    if (!currentUserId || isLiking) return

    setIsLiking(true)
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUserId)

        if (error) throw error

        setIsLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        // Like
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: currentUserId
          })

        if (error) throw error

        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleSaveEdit = () => {
    if (editBody.trim() && onEdit) {
      onEdit(comment.id, editBody.trim())
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditBody(comment.body)
    setIsEditing(false)
  }

  if (comment.is_deleted) {
    return (
      <div className="py-3 text-card-foreground/40 italic">
        [Comment deleted]
      </div>
    )
  }

  return (
    <div className="py-3 border-b border-border/50 last:border-b-0">
      <div className="flex gap-3">
        <Link to={`/${comment.author.username}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.author.avatar_url} />
            <AvatarFallback className="bg-accent-warm text-bg-dark text-xs">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/${comment.author.username}`}
              className="font-medium text-card-foreground hover:text-accent-warm transition-colors text-sm"
            >
              {displayName}
            </Link>
            <span className="text-card-foreground/60 text-xs">•</span>
            <span className="text-card-foreground/60 text-xs" title={createdAt.toLocaleString()}>
              {relativeTime}
            </span>
            
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(comment.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full min-h-[60px] p-2 rounded border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={1000}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-card-foreground text-sm leading-relaxed break-words">
                {comment.body}
              </div>
              
              <div className="flex items-center gap-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply?.(comment.id)}
                  className="h-6 px-2 text-xs text-card-foreground/60 hover:text-card-foreground"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking || !currentUserId}
                  className="h-6 px-2 text-xs text-card-foreground/60 hover:text-red-500"
                >
                  <Heart className={`h-3 w-3 mr-1 ${isLiked ? 'fill-current text-red-500' : ''}`} />
                  {likeCount > 0 ? likeCount : 'Like'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}