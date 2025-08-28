/* eslint-env node */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  if (body.profile) {
    await supabase
      .from('profiles')
      .update({
        display_name: body.profile.display_name || null,
        bio: body.profile.bio || null,
        interests: body.profile.interests || null
      })
      .eq('id', user.id)
  }

  if (Array.isArray(body.follows)) {
    for (const f of body.follows.slice(0, 1000)) {
      if (f.followee_id && f.followee_id !== user.id) {
        await supabase.from('follows').upsert({ follower_id: user.id, followee_id: f.followee_id })
      }
    }
  }

  if (Array.isArray(body.posts)) {
    for (const p of body.posts.slice(0, 200)) {
      await supabase.from('posts').insert({
        author_id: user.id,
        body: String(p.body || '').slice(0, 2500),
        media: Array.isArray(p.media) ? p.media : [],
        status: 'published'
      })
    }
  }

  return NextResponse.json({ ok: true })
}

