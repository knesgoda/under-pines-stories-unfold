/* eslint-env node */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase.rpc('get_post_reaction_summary', {
      p_post_id: params.id
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user's current reaction
    const authHeader = req.headers.get('Authorization')
    let userReaction = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        const { data: reaction } = await supabase
          .from('post_reactions')
          .select('emoji')
          .eq('post_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()
        
        userReaction = reaction?.emoji || null
      }
    }

    return NextResponse.json({ 
      summary: data || [], 
      userReaction 
    })
  } catch (error) {
    console.error('Error fetching reaction summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    // Upsert reaction (update if exists, insert if not)
    const { error: upsertError } = await supabase
      .from('post_reactions')
      .upsert({
        post_id: params.id,
        user_id: user.id,
        emoji: emoji
      }, {
        onConflict: 'post_id,user_id'
      })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    // Get updated summary and user reaction
    const { data, error } = await supabase.rpc('get_post_reaction_summary', {
      p_post_id: params.id
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      summary: data || [], 
      userReaction: emoji 
    })
  } catch (error) {
    console.error('Error creating reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    // Delete user's reaction
    const { error: deleteError } = await supabase
      .from('post_reactions')
      .delete()
      .match({ 
        post_id: params.id,
        user_id: user.id 
      })

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Get updated summary
    const { data, error } = await supabase.rpc('get_post_reaction_summary', {
      p_post_id: params.id
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      summary: data || [], 
      userReaction: null 
    })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}