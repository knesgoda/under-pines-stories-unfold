import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { toZonedTime, format } from 'date-fns-tz'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MessageCircle, Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { sharePost, type Post } from '@/lib/posts'
import { MediaGrid } from '@/components/media/MediaGrid'
import LinkPreviewCard from '@/components/post/LinkPreviewCard'
import PostReactions from '@/components/reactions/PostReactions'
import { CommentModal } from '@/components/comments/CommentModal'
import { supabase } from '@/integrations/supabase/client'
/* eslint-disable @typescript-eslint/no-explicit-any */

interface PostCardProps {
  post: Post
}

const previewCache = new Map<string, any>()

export function PostCard({ post }: PostCardProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  
  const createdAt = new Date(post.created_at)
  const zonedTime = toZonedTime(createdAt, 'America/Los_Angeles')
  const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true })
  const absoluteTime = format(zonedTime, 'MMM d, yyyy \'at\' h:mm a zzz', { 
    timeZone: 'America/Los_Angeles' 
  })

  // Load comment count
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('is_deleted', false)
        
        if (!error && count !== null) {
          setCommentCount(count)
        }
      } catch (error) {
        console.error('Error loading comment count:', error)
      }
    }
    
    loadCommentCount()
  }, [post.id])

  const handleShare = async () => {
    if (isSharing) return
    
    setIsSharing(true)
    
    try {
      const shareUrl = `${window.location.origin}/post/${post.id}`
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        
        // Update share count on server
        await sharePost(post.id)
        
        console.info('Post shared:', { postId: post.id })
        
        toast({
          title: "Link copied!",
          description: "Post link has been copied to clipboard.",
        })
      } else {
        // Fallback for browsers without clipboard API
        toast({
          title: "Share link",
          description: shareUrl,
        })
      }
    } catch (error) {
      console.error('Error sharing post:', error)
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const displayName = post.profiles.display_name || post.profiles.username
  const username = post.profiles.username

  // Format post body with line breaks preserved
  const formattedBody = post.body.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < post.body.split('\n').length - 1 && <br />}
    </span>
  ))

  const urlMatch = post.body.match(/https?:\/\/\S+/)
  const firstUrl = urlMatch ? urlMatch[0] : null

  useEffect(() => {
    if (!firstUrl) return
    if (previewCache.has(firstUrl)) {
      setPreview(previewCache.get(firstUrl))
      return
    }
    // Link preview functionality disabled for now
    // TODO: Implement link preview with Supabase Edge Function if needed
    return () => {}
  }, [firstUrl])

  return (
    <Card className="bg-card border-ink-muted shadow-soft hover:shadow-glow transition-all duration-200 fade-in">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={`/${post.profiles.username}`}>
            <Avatar className="h-10 w-10 flex-shrink-0 hover:opacity-80 transition-opacity">
              <AvatarImage src={post.profiles.avatar_url} />
              <AvatarFallback className="bg-accent-warm text-bg-dark">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/${post.profiles.username}`}
                className="font-semibold text-card-foreground hover:text-accent-warm transition-colors"
              >
                {displayName}
              </Link>
              <Link 
                to={`/${post.profiles.username}`}
                className="text-muted-foreground hover:text-accent-warm transition-colors"
              >
                @{username}
              </Link>
              <span className="text-muted-foreground/60">•</span>
              <span 
                className="text-muted-foreground hover:underline cursor-help" 
                title={absoluteTime}
              >
                {relativeTime}
              </span>
            </div>
            
            <div className="mt-3 text-card-foreground leading-relaxed break-words">
              {formattedBody}
            </div>

            {post.has_media && post.media.length > 0 && (
              <MediaGrid media={post.media} className="mt-4" />
            )}

            {preview && preview.url && (
              <div className="mt-4">
                <LinkPreviewCard {...preview} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 mt-4">
              <PostReactions postId={post.id} />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors p-2"
              >
                <Share className="h-4 w-4 transition-transform hover:scale-110" />
                <span className="font-medium">{post.share_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors p-2"
              >
                <MessageCircle className="h-4 w-4 transition-transform hover:scale-110" />
                <span className="font-medium">{commentCount}</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <CommentModal
        open={open}
        onClose={() => setOpen(false)}
        postId={post.id}
        onCommentChange={() => {
          // Reload comment count when comments change
          const loadCommentCount = async () => {
            try {
              const { count, error } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id)
                .eq('is_deleted', false)
              
              if (!error && count !== null) {
                setCommentCount(count)
              }
            } catch (error) {
              console.error('Error loading comment count:', error)
            }
          }
          loadCommentCount()
        }}
      />
    </Card>
  )
}