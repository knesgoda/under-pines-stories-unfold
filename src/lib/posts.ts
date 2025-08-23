import { supabase } from "@/integrations/supabase/client"

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

export async function createPost(text: string, media: Array<any> = []): Promise<Post> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      body: text,
      author_id: user.id,
      media: media
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
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  return {
    ...post,
    media: post.media as Post['media'],
    liked_by_user: false
  }
}

export async function fetchFeed(cursor?: string): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  let query = supabase
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
      profiles!posts_author_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      post_likes!left (
        user_id
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: posts, error } = await query

  if (error) throw error

  return posts.map(post => ({
    ...post,
    media: post.media as Post['media'],
    liked_by_user: post.post_likes?.some((like: any) => like.user_id === user.id) || false
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
}