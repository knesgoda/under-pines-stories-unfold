import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { toZonedTime, format } from 'date-fns-tz'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, Share, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { toggleLike, sharePost, type Post } from '@/lib/posts'

interface PostCardProps {
  post: Post
  onLikeToggle: (postId: string, newLikeCount: number, isLiked: boolean) => void
}

export function PostCard({ post, onLikeToggle }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  
  const createdAt = new Date(post.created_at)
  const zonedTime = toZonedTime(createdAt, 'America/Los_Angeles')
  const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true })
  const absoluteTime = format(zonedTime, 'MMM d, yyyy \'at\' h:mm a zzz', { 
    timeZone: 'America/Los_Angeles' 
  })

  const handleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    
    try {
      const { like_count, liked } = await toggleLike(post.id)
      onLikeToggle(post.id, like_count, liked)
      
      console.info('Like toggled:', { postId: post.id, liked })
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLiking(false)
    }
  }

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={`/${post.profiles.username}`}>
            <Avatar className="h-10 w-10 flex-shrink-0 hover:opacity-80 transition-opacity">
              <AvatarImage src={post.profiles.avatar_url} />
              <AvatarFallback>
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={`/${post.profiles.username}`}
                className="font-semibold text-foreground hover:underline"
              >
                {displayName}
              </Link>
              <Link 
                to={`/${post.profiles.username}`}
                className="text-muted-foreground hover:underline"
              >
                @{username}
              </Link>
              <span className="text-muted-foreground">•</span>
              <span 
                className="text-muted-foreground hover:underline cursor-help" 
                title={absoluteTime}
              >
                {relativeTime}
              </span>
            </div>
            
            <div className="mt-2 text-foreground leading-relaxed break-words">
              {formattedBody}
            </div>
            
            <div className="flex items-center gap-6 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors",
                  post.liked_by_user && "text-red-500"
                )}
              >
                <Heart 
                  className={cn(
                    "h-4 w-4",
                    post.liked_by_user && "fill-current"
                  )} 
                />
                <span>{post.like_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center gap-2 text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <Share className="h-4 w-4" />
                <span>{post.share_count}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Comment</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}