import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emojiToType, typeToEmoji } from '@/components/reactions/reactionTypes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(req.url)
    const emoji = searchParams.get('emoji') || ''
    const reaction = emojiToType[emoji]

    if (!reaction) {
      return NextResponse.json({ error: 'Missing or invalid emoji parameter' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('post_reactions')
      .select(`
        reaction,
        created_at as reacted_at,
        user:profiles!post_reactions_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', params.id)
      .eq('reaction', reaction)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = (data || []).map(it => ({
      ...it,
      emoji: typeToEmoji[it.reaction as keyof typeof typeToEmoji],
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching reactors:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
