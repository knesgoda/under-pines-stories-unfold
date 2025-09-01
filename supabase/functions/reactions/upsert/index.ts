import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const validReactions = ['thumbs_up','laugh','angry','sad','rage','eyeroll']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      },
    )

    const { post_id, reaction } = await req.json()
    if (!post_id || typeof post_id !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid post_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!validReactions.includes(reaction)) {
      return new Response(JSON.stringify({ error: 'Invalid reaction' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { error } = await supabase.rpc('upsert_post_reaction', {
      p_post_id: post_id,
      p_reaction: reaction,
    })
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: counts } = await supabase
      .from('post_reaction_counts')
      .select('*')
      .eq('post_id', post_id)
      .maybeSingle()

    return new Response(JSON.stringify({ counts: counts?.counts || {} }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('reactions/upsert error', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
