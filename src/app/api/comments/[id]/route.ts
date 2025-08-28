/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body } = await req.json()
  if (!body || body.length === 0 || body.length > 1000) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { data, error: updateError } = await supabase
    .from('comments')
    .update({ body })
    .eq('id', params.id)
    .eq('author_id', user.id)
    .select('*')
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.split('Bearer ')[1]
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error: delError } = await supabase
    .from('comments')
    .update({ is_deleted: true, body: '' })
    .eq('id', params.id)
    .eq('author_id', user.id)
    .select('*')
    .single()
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
  return NextResponse.json(data)
}
