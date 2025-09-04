/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emojiToType, typeToEmoji, ReactionType } from '@/components/reactions/reactionTypes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function countsToSummary(counts: Record<string, number> | null) {
  const summary: { emoji: string; count: number }[] = []
  if (!counts) return summary
  for (const key in typeToEmoji) {
    const count = counts[key as keyof typeof counts]
    if (count && count > 0) {
      summary.push({ emoji: typeToEmoji[key as ReactionType], count })
    }
  }
  return summary
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { data: counts, error } = await supabase
      .from('post_reaction_counts')
      .select('*')
      .eq('post_id', params.id)
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const authHeader = req.headers.get('Authorization')
    let userReaction: string | null = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      if (user) {
        const { data: reaction } = await supabase
          .from('post_reactions')
          .select('reaction')
          .eq('post_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (reaction?.reaction) {
          userReaction = typeToEmoji[reaction.reaction as ReactionType]
        }
      }
    }

    return NextResponse.json({ summary: countsToSummary(counts), userReaction })
  } catch (error) {
    console.error('Error fetching reaction summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { emoji } = body
    const reaction = emojiToType[emoji]
    if (!reaction) {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    const { error: upsertError } = await supabase.rpc('upsert_post_reaction', {
      p_post_id: params.id,
      p_reaction: reaction,
    })
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    const { data: counts } = await supabase
      .from('post_reaction_counts')
      .select('*')
      .eq('post_id', params.id)
      .maybeSingle()

    return NextResponse.json({ summary: countsToSummary(counts), userReaction: emoji })
  } catch (error) {
    console.error('Error creating reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: deleteError } = await supabase.rpc('clear_post_reaction', {
      p_post_id: params.id,
    })
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const { data: counts } = await supabase
      .from('post_reaction_counts')
      .select('*')
      .eq('post_id', params.id)
      .maybeSingle()

    return NextResponse.json({ summary: countsToSummary(counts), userReaction: null })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
