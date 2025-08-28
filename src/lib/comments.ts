import { supabase } from '@/integrations/supabase/client'

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  body: string
  like_count: number
  is_deleted: boolean
  created_at: string
}

export interface CommentWithReplies extends Comment {
  preview_replies?: Comment[]
}

// Fetch top level comments for a post
export async function fetchPostComments(
  postId: string,
  cursor?: string,
  limit = 20,
  viewer?: string
) {
  const { data, error } = await supabase.rpc('get_post_comments', {
    p_viewer: viewer ?? null,
    p_post: postId,
    p_before: cursor ?? new Date().toISOString(),
    p_limit: limit,
    p_preview_replies: 2
  })

  if (error) throw error

  const raw = (data ?? []) as (CommentWithReplies & { preview_replies: Comment[] })[]
  const items: CommentWithReplies[] = raw.map(row => ({
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    parent_id: row.parent_id,
    body: row.body,
    like_count: row.like_count,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    preview_replies: row.preview_replies
  }))

  const nextCursor = items.length > 0 ? items[items.length - 1].created_at : null
  return { items, nextCursor }
}

// Fetch replies for a comment
export async function fetchCommentReplies(
  parentId: string,
  after?: string,
  limit = 20,
  viewer?: string
) {
  const { data, error } = await supabase.rpc('get_comment_replies', {
    p_viewer: viewer ?? null,
    p_parent: parentId,
    p_after: after ?? 'epoch',
    p_limit: limit
  })
  if (error) throw error
  const items: Comment[] = data ?? []
  const nextAfter = items.length > 0 ? items[items.length - 1].created_at : null
  return { items, nextAfter }
}

// Create a new comment or reply
export async function createComment({
  postId,
  body,
  parentId
}: {
  postId: string
  body: string
  parentId?: string
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, body, parent_id: parentId ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data as Comment
}

// Edit an existing comment
export async function editComment(id: string, body: string) {
  const { data, error } = await supabase
    .from('comments')
    .update({ body })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Comment
}

// Soft delete a comment
export async function deleteComment(id: string) {
  const { data, error } = await supabase
    .from('comments')
    .update({ is_deleted: true, body: '' })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as Comment
}

// Toggle like on a comment
export async function toggleCommentLike(commentId: string) {
  const { data, error } = await supabase.rpc('toggle_comment_like', {
    p_comment: commentId
  })
  if (error) throw error
  return data ? data[0] : { like_count: 0, did_like: false }
}
