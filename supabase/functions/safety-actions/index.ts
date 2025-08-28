import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()
    
    if (req.method === 'POST') {
      const body = await req.json()
      
      switch (action) {
        case 'block':
          const { error: blockError } = await supabaseClient
            .from('blocks')
            .insert({
              blocker_id: user.id,
              blocked_id: body.userId
            })
          
          if (blockError) {
            console.error('Block error:', blockError)
            return new Response(JSON.stringify({ error: blockError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          // Cancel any existing follow requests
          await supabaseClient
            .from('follow_requests')
            .delete()
            .or(`and(requester_id.eq.${user.id},target_id.eq.${body.userId}),and(requester_id.eq.${body.userId},target_id.eq.${user.id})`)

          // Remove any existing follows
          await supabaseClient
            .from('follows')
            .delete()
            .or(`and(follower_id.eq.${user.id},followee_id.eq.${body.userId}),and(follower_id.eq.${body.userId},followee_id.eq.${user.id})`)

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'unblock':
          const { error: unblockError } = await supabaseClient
            .from('blocks')
            .delete()
            .eq('blocker_id', user.id)
            .eq('blocked_id', body.userId)
          
          if (unblockError) {
            console.error('Unblock error:', unblockError)
            return new Response(JSON.stringify({ error: unblockError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'mute':
          const { error: muteError } = await supabaseClient
            .from('mutes')
            .insert({
              muter_id: user.id,
              muted_id: body.userId
            })
          
          if (muteError) {
            console.error('Mute error:', muteError)
            return new Response(JSON.stringify({ error: muteError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'unmute':
          const { error: unmuteError } = await supabaseClient
            .from('mutes')
            .delete()
            .eq('muter_id', user.id)
            .eq('muted_id', body.userId)
          
          if (unmuteError) {
            console.error('Unmute error:', unmuteError)
            return new Response(JSON.stringify({ error: unmuteError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        case 'report':
          const { error: reportError } = await supabaseClient
            .from('reports')
            .insert({
              reporter_id: user.id,
              target_user_id: body.targetUserId,
              post_id: body.postId,
              comment_id: body.commentId,
              reason: body.reason
            })
          
          if (reportError) {
            console.error('Report error:', reportError)
            return new Response(JSON.stringify({ error: reportError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        default:
          return new Response('Action not found', { status: 404, headers: corsHeaders })
      }
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  } catch (error) {
    console.error('Safety actions error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})