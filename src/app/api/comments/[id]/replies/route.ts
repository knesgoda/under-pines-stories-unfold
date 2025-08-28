/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const after = searchParams.get('after') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  const authHeader = req.headers.get('authorization')
  const token = authHeader ? authHeader.split('Bearer ')[1] : undefined
  let viewer: string | undefined
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token)
    viewer = user?.id
  }

  const { data, error } = await supabase.rpc('get_comment_replies', {
    p_viewer: viewer ?? null,
    p_parent: params.id,
    p_after: after ?? 'epoch',
    p_limit: limit
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const items = data ?? []
  const nextAfter = items.length > 0 ? items[items.length - 1].created_at : null
  return NextResponse.json({ items, nextAfter })
}
