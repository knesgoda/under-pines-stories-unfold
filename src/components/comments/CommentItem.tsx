import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Comment, createComment, toggleCommentLike } from '@/lib/comments'
import { CommentComposer } from './CommentComposer'

interface Props {
  comment: Comment
  replies?: Comment[]
  depth?: number
  onReplyAdded?: (reply: Comment) => void
  onLoadMoreReplies?: () => void
  hasMoreReplies?: boolean
}

export function CommentItem({
  comment,
  replies = [],
  depth = 0,
  onReplyAdded,
  onLoadMoreReplies,
  hasMoreReplies
}: Props) {
  const { user } = useAuth()
  const [showReply, setShowReply] = useState(false)
  const [likeData, setLikeData] = useState({ count: comment.like_count, didLike: false })

  const handleLike = async () => {
    const { like_count, did_like } = await toggleCommentLike(comment.id)
    setLikeData({ count: like_count, didLike: did_like })
  }

  const handleReply = async (body: string) => {
    const reply = await createComment({ postId: comment.post_id, body, parentId: comment.id })
    onReplyAdded?.(reply)
    setShowReply(false)
  }

  return (
    <div className={`mt-4 ${depth > 0 ? 'ml-4' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">{comment.author_id}</div>
          <div className="whitespace-pre-line text-sm">{comment.is_deleted ? 'Comment deleted' : comment.body}</div>
          {!comment.is_deleted && (
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <button onClick={handleLike} className="flex items-center gap-1" aria-label="Like comment">
                <Heart className="h-4 w-4" fill={likeData.didLike ? 'currentColor' : 'none'} />
                {likeData.count}
              </button>
              {user && (
                <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1" aria-label="Reply">
                  <MessageSquare className="h-4 w-4" /> Reply
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showReply && user && (
        <div className="mt-2">
          <CommentComposer onSubmit={handleReply} placeholder="Write a reply..." autoFocus />
        </div>
      )}

      {replies.map(r => (
        <CommentItem key={r.id} comment={r} depth={depth + 1} />
      ))}

      {hasMoreReplies && (
        <Button variant="link" size="sm" onClick={onLoadMoreReplies} className="mt-2">
          View more replies
        </Button>
      )}
    </div>
  )
}
