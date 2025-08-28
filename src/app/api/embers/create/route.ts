import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { emberExpiresAt } from '@/lib/ephemeral/labels';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { caption = '', media = [], visibility = 'followers' } = body;
  const sb = createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // media contains STORAGE KEYS (already uploaded to ember_media)
  const { data, error } = await sb.from('embers')
    .insert({
      author_id: u.user.id,
      caption: String(caption).slice(0, 280),
      media: Array.isArray(media) ? media : [],
      visibility,
      expires_at: emberExpiresAt()
    })
    .select('*').single();

  if (error) return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  return NextResponse.json({ ember: data });
}
