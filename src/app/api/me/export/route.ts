/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

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

  try {
    const uid = user.id
    const [profile, posts, follows, saved] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('posts').select('*').eq('author_id', uid).order('created_at', { ascending: true }),
      supabase.from('follows').select('*').or(`follower_id.eq.${uid},followee_id.eq.${uid}`),
      supabase.from('saved_posts').select('*').eq('user_id', uid)
    ])

    const zip = new JSZip()
    zip.file('underpines/profile.json', JSON.stringify(profile.data ?? {}, null, 2))
    zip.file('underpines/posts.json', JSON.stringify(posts.data ?? [], null, 2))
    zip.file('underpines/follows.json', JSON.stringify(follows.data ?? [], null, 2))
    zip.file('underpines/saved.json', JSON.stringify(saved.data ?? [], null, 2))

    const blob = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
    const storageKey = `exports/${uid}/${crypto.randomUUID()}.zip`
    const { error: uploadError } = await supabase.storage.from('exports').upload(storageKey, blob, {
      contentType: 'application/zip',
      upsert: true
    })
    if (uploadError) return NextResponse.json({ error: 'upload_failed' }, { status: 500 })

    const { data: signed } = await supabase.storage.from('exports').createSignedUrl(storageKey, 60 * 60)
    await supabase.from('user_exports').insert({ user_id: uid, storage_key: storageKey })

    return NextResponse.json({ url: signed?.signedUrl })
  } catch (e) {
    console.error('[me/export]', e)
    return NextResponse.json({ error: 'export_failed' }, { status: 500 })
  }
}

