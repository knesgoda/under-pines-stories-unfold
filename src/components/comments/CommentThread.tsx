import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Comment, CommentWithReplies, createComment, fetchPostComments, fetchCommentReplies } from '@/lib/comments'
import { CommentComposer } from './CommentComposer'
import { CommentItem } from './CommentItem'
import { Button } from '@/components/ui/button'

interface Props {
  postId: string
}

interface CommentState extends CommentWithReplies {
  replies: Comment[]
  nextAfter: string | null
}

export function CommentThread({ postId }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentState[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadComments = async (initial = false) => {
    const { items, nextCursor } = await fetchPostComments(postId, initial ? undefined : cursor ?? undefined, 20, user?.id)
    const mapped = items.map(c => ({ ...c, replies: c.preview_replies ?? [], nextAfter: null }))
    setComments(initial ? mapped : [...comments, ...mapped])
    setCursor(nextCursor)
    setLoading(false)
  }

  useEffect(() => {
    loadComments(true)
  }, [postId, user?.id])

  const handlePost = async (body: string) => {
    const newComment = await createComment({ postId, body })
    setComments([{ ...newComment, replies: [], nextAfter: null }, ...comments])
  }

  const loadMoreReplies = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId)
    if (!comment) return
    const { items, nextAfter } = await fetchCommentReplies(commentId, comment.nextAfter ?? undefined, 20, user?.id)
    comment.replies = [...comment.replies, ...items]
    comment.nextAfter = nextAfter
    setComments([...comments])
  }

  if (loading) {
    return (
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6">
      {user && (
        <div className="mb-4">
          <CommentComposer onSubmit={handlePost} />
        </div>
      )}

      {comments.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Be the first to start the conversation.</p>
      )}

      {comments.map(c => (
        <CommentItem
          key={c.id}
          comment={c}
          replies={c.replies}
          hasMoreReplies={c.replies.length >= 2}
          onLoadMoreReplies={() => loadMoreReplies(c.id)}
          onReplyAdded={reply => {
            c.replies = [...c.replies, reply]
            setComments([...comments])
          }}
        />
      ))}

      {cursor && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => { if (!loadingMore) { setLoadingMore(true); loadComments(); setLoadingMore(false); }}}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
