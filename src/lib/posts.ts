import { supabase } from "@/integrations/supabase/client"
import { awardToast } from '@/components/game/awardToast'

export interface Post {
  id: string
  author_id: string
  body: string
  created_at: string
  like_count: number
  share_count: number
  comment_count: number
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
      profiles!author_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  // Award ingredients for creating a post
  try {
    const { data: rewardResult } = await supabase.functions.invoke('game-reward', {
      body: { activityType: 'post_create' }
    });
    if (rewardResult?.awarded?.length > 0) {
      awardToast(rewardResult.awarded);
    }
  } catch (rewardError) {
    console.error('Error awarding post creation reward:', rewardError);
  }

  return {
    ...post,
    media: post.media as Post['media'],
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
    liked_by_user: false,
    comment_count: 0
  }
}

export async function createDraftPost(): Promise<string> {
  const { data, error } = await supabase.rpc('create_draft_post')
  
  if (error) throw error
  
  return data
}

async function fetchAllPosts(cursor?: string): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  console.log('Fetching all posts as fallback...')

  // Get all public posts as fallback
  const { data: posts, error } = await supabase
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
      profiles!author_id (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .lt('created_at', cursor ? new Date(cursor).toISOString() : new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching all posts:', error)
    throw error
  }

  console.log('Found posts:', posts?.length || 0)

  // Get user's likes for these posts
  const postIds = posts?.map(p => p.id) || []
  const { data: userLikes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  const likedPostIds = new Set(userLikes?.map(l => l.post_id) || [])

  return (posts || []).map(post => ({
    ...post,
    media: post.media as Post['media'],
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
    liked_by_user: likedPostIds.has(post.id),
    comment_count: 0
  }))
}

export async function publishPost(postId: string, text: string, media: Post['media'] = []): Promise<Post> {
  const { data: post, error } = await supabase.rpc('publish_post', {
    p_post_id: postId,
    p_body: text,
    p_media: media
  })

  if (error) throw error

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
      profiles!author_id (
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
    profiles: Array.isArray(fullPost.profiles) ? fullPost.profiles[0] : fullPost.profiles,
    liked_by_user: false,
    comment_count: 0
  }
}

export async function fetchFeed(cursor?: string): Promise<Post[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Try to get posts from followed users first
  const { data: feedPosts, error } = await supabase.rpc('feed_following', {
    p_user: user.id,
    p_before: cursor ? new Date(cursor).toISOString() : new Date().toISOString(),
    p_limit: 20
  })

  console.log('Feed following result:', { feedPosts, error })

  if (error) {
    console.error('Error fetching feed:', error)
    // Fallback to showing all public posts if feed_following fails
    return await fetchAllPosts(cursor)
  }

  // Get additional data for each post (profiles and likes)
  const postIds = feedPosts?.map(p => p.id) || []
  console.log('Post IDs from feed:', postIds)
  
  if (postIds.length === 0) {
    console.log('No posts from followed users, falling back to all posts')
    // If no posts from followed users, show all public posts as fallback
    return await fetchAllPosts(cursor)
  }

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
      profiles!author_id (
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
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
    liked_by_user: post.post_likes?.some((like: { user_id: string }) => like.user_id === user.id) || false,
    comment_count: 0
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

    // Award ingredients for liking a post
    try {
      const { data: rewardResult } = await supabase.functions.invoke('game-reward', {
        body: { activityType: 'post_like' }
      });
      if (rewardResult?.awarded?.length > 0) {
        awardToast(rewardResult.awarded);
      }
    } catch (rewardError) {
      console.error('Error awarding like reward:', rewardError);
    }

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

  // Award ingredients for sharing a post
  try {
    const { data: rewardResult } = await supabase.functions.invoke('game-reward', {
      body: { activityType: 'post_share' }
    });
    if (rewardResult?.awarded?.length > 0) {
      awardToast(rewardResult.awarded);
    }
  } catch (rewardError) {
    console.error('Error awarding share reward:', rewardError);
  }
}
