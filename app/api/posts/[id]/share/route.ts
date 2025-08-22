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

    // Increment share count
    const { data, error } = await supabase
      .from('posts')
      .update({ 
        share_count: supabase.raw('share_count + 1')
      })
      .eq('id', postId)
      .select('share_count')
      .single()

    if (error) {
      console.error('Error updating share count:', error)
      return NextResponse.json({ error: 'Failed to update share count' }, { status: 500 })
    }

    console.info('Post shared:', { postId, userId: user.id, shareCount: data.share_count })

    return NextResponse.json({
      share_count: data.share_count,
      share_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/post/${postId}`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}