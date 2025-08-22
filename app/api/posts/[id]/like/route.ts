import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const postId = params.id

    // Check if like already exists
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    let liked = false
    
    if (existingLike) {
      // Unlike - remove the like
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error removing like:', error)
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 })
      }

      // Decrement like count
      const { error: updateError } = await supabase.rpc('decrement_like_count', {
        post_id: postId
      })

      if (updateError) {
        console.error('Error updating like count:', updateError)
      }
    } else {
      // Like - add the like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        })

      if (error) {
        console.error('Error adding like:', error)
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 })
      }

      // Increment like count
      const { error: updateError } = await supabase.rpc('increment_like_count', {
        post_id: postId
      })

      if (updateError) {
        console.error('Error updating like count:', updateError)
      }

      liked = true
    }

    // Get updated like count
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', postId)
      .single()

    console.info('Like toggled:', { postId, userId: user.id, liked })

    return NextResponse.json({
      liked,
      like_count: post?.like_count || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}