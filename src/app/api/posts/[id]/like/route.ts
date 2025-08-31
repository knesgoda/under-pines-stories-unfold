/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', params.id)
      .eq('user_id', user.id)
    const { count } = await supabase
      .from('post_likes')
      .select('post_id', { count: 'exact', head: true })
      .eq('post_id', params.id)
    return NextResponse.json({ like_count: count ?? 0, did_like: false })
  }

  const { error: insertError } = await supabase
    .from('post_likes')
    .insert({ post_id: params.id, user_id: user.id })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  await fetch(new URL('/api/game/claim/action', process.env.NEXT_PUBLIC_APP_ORIGIN), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ action:'react', targetType:'post', targetId: params.id })
  });

  // notify post author
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', params.id)
      .single()
    if (post?.author_id) {
      await supabase.rpc('create_notification', {
        p_user: post.author_id,
        p_actor: user.id,
        p_type: 'post_like',
        p_post: params.id,
        p_comment: null,
        p_meta: {}
      })
    }
  } catch (e) {
    console.error('[post_like:notify]', e)
  }

  const { count } = await supabase
    .from('post_likes')
    .select('post_id', { count: 'exact', head: true })
    .eq('post_id', params.id)
  return NextResponse.json({ like_count: count ?? 0, did_like: true })
}
