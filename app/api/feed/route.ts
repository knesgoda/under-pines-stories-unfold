import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const type = searchParams.get('type') || 'following'

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_author_id_fkey(username, display_name, avatar_url),
        post_likes(user_id)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    if (type === 'following') {
      // Get posts from followed users plus own posts
      const { data: follows } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id)

      const followedUserIds = follows?.map(f => f.followee_id) || []
      const userIds = [user.id, ...followedUserIds]
      
      query = query.in('author_id', userIds)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Error fetching feed:', error)
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    // Add like status for current user
    const postsWithLikes = posts?.map(post => ({
      ...post,
      liked_by_user: post.post_likes.some((like: any) => like.user_id === user.id),
      post_likes: undefined, // Remove the raw likes data
    })) || []

    return NextResponse.json(postsWithLikes)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}