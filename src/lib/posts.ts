import { supabase } from "@/integrations/supabase/client"
import { awardToast } from '@/components/game/awardToast'

export interface Post {
  id: string
  author_id: string
  body: string
  created_at: string
  like_count: number
  share_count: number
  is_deleted: boolean
  media: Array<{
    type: 'image' | 'video'
    url: string
    width: number
    height: number
    bytes: number
    poster_url?: string
    duration?: number
    alt_text?: string
  }>
  has_media: boolean
  profiles: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  liked_by_user: boolean
}

export async function createPost(text: string, media: Post['media'] = []): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      body: text,
      author_id: user.id,
      media: media,
      status: 'published'
    })
    .select(`
      id,
      author_id,
      body,
      created_at,
      like_count,
      share_count,
      is_deleted,
      media,
      has_media,
      status,
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error
  await fetch('/api/game/claim/action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'share', targetType:'post', targetId: post.id }) }).then(r=>r.json()).then(j=>awardToast(j.awarded));

  return {
    ...post,
    media: post.media as Post['media'],
    liked_by_user: false
  }
}

export async function createDraftPost(): Promise<string> {
  const { data, error } = await supabase.rpc('create_draft_post')
  
  if (error) throw error
  await fetch('/api/game/claim/action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'share', targetType:'post', targetId: data }) }).then(r=>r.json()).then(j=>awardToast(j.awarded));
  
  return data
}

export async function publishPost(postId: string, text: string, media: Post['media'] = []): Promise<Post> {
  const { data: post, error } = await supabase.rpc('publish_post', {
    p_post_id: postId,
    p_body: text,
    p_media: media
  })

  if (error) throw error
  await fetch('/api/game/claim/action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'share', targetType:'post', targetId: postId }) }).then(r=>r.json()).then(j=>awardToast(j.awarded));

  // Fetch the complete post with profile data
  const { data: fullPost, error: fetchError } = await supabase
    .from('posts')
    .select(`
      id,
      author_id,
      body,
      created_at,
      like_count,
      share_count,
      is_deleted,
      media,
      has_media,
      status,
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('id', postId)
    .single()

  if (fetchError) throw fetchError

  return {
    ...fullPost,
    media: fullPost.media as Post['media'],
    liked_by_user: false
  }
}

export async function fetchFeed(cursor?: string): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Use the feed_following function to get posts from followed users only
  const { data: feedPosts, error } = await supabase.rpc('feed_following', {
    p_user: user.id,
    p_before: cursor ? new Date(cursor).toISOString() : new Date().toISOString(),
    p_limit: 20
  })

  if (error) throw error
  // Remove game API call since it's not relevant to feed fetching

  // Get additional data for each post (profiles and likes)
  const postIds = feedPosts?.map(p => p.id) || []
  if (postIds.length === 0) return []

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      author_id,
      body,
      created_at,
      like_count,
      share_count,
      is_deleted,
      media,
      has_media,
      status,
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      post_likes!left (
        user_id
      )
    `)
    .in('id', postIds)
    .order('created_at', { ascending: false })

  if (postsError) throw postsError

  return posts.map(post => ({
    ...post,
    media: post.media as Post['media'],
    liked_by_user: post.post_likes?.some((like: { user_id: string }) => like.user_id === user.id) || false
  }))
}

export async function toggleLike(postId: string): Promise<{ like_count: number; liked: boolean }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Check if user already liked this post
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingLike) {
    // Remove like
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    // Get updated post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single()

    if (postError) throw postError

    return { like_count: post.like_count, liked: false }
  } else {
    // Add like
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: user.id })

    if (insertError) throw insertError
    await fetch('/api/game/claim/action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'react', targetType:'post', targetId: postId }) }).then(r=>r.json()).then(j=>awardToast(j.awarded));

    // Get updated post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single()

    if (postError) throw postError

    return { like_count: post.like_count, liked: true }
  }
}

export async function sharePost(postId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get current share count and increment it
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('share_count')
    .eq('id', postId)
    .single()

  if (fetchError) throw fetchError

  const { error } = await supabase
    .from('posts')
    .update({ 
      share_count: (post.share_count || 0) + 1
    })
    .eq('id', postId)

  if (error) throw error
  await fetch('/api/game/claim/action', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'share', targetType:'post', targetId: postId }) }).then(r=>r.json()).then(j=>awardToast(j.awarded));
}
