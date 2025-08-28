import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    if (req.method === 'GET') {
      const box = url.searchParams.get('box') || 'incoming'
      
      let query
      if (box === 'incoming') {
        query = supabase
          .from('follow_requests')
          .select(`
            request_id,
            created_at,
            profiles!follow_requests_requester_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('target_id', user.id)
      } else {
        query = supabase
          .from('follow_requests')
          .select(`
            request_id,
            created_at,
            profiles!follow_requests_target_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('requester_id', user.id)
      }

      const { data: requests, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Get requests error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch requests' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ requests }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { requestId } = await req.json()
      
      if (!requestId) {
        return new Response(
          JSON.stringify({ error: 'Request ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'accept') {
        // Get the request to verify ownership and get requester info
        const { data: request, error: fetchError } = await supabase
          .from('follow_requests')
          .select('requester_id, target_id')
          .eq('request_id', requestId)
          .eq('target_id', user.id)
          .single()

        if (fetchError || !request) {
          return new Response(
            JSON.stringify({ error: 'Request not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Create follow relationship
        const { error: followError } = await supabase
          .from('follows')
          .insert({
            follower_id: request.requester_id,
            followee_id: request.target_id
          })

        if (followError && !followError.message.includes('duplicate key value')) {
          console.error('Accept follow error:', followError)
          return new Response(
            JSON.stringify({ error: 'Failed to accept request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // notify requester of acceptance
        const { error: notifError } = await supabase.rpc('create_notification', {
          p_user: request.requester_id,
          p_actor: user.id,
          p_type: 'follow_accept',
          p_post: null,
          p_comment: null,
          p_meta: {}
        })
        if (notifError) console.error('Notify error:', notifError)

        // Delete the request
        const { error: deleteError } = await supabase
          .from('follow_requests')
          .delete()
          .eq('request_id', requestId)

        if (deleteError) {
          console.error('Delete request error:', deleteError)
        }

        return new Response(
          JSON.stringify({ status: 'accepted' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'decline') {
        const { error: deleteError } = await supabase
          .from('follow_requests')
          .delete()
          .eq('request_id', requestId)
          .eq('target_id', user.id)

        if (deleteError) {
          console.error('Decline request error:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to decline request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ status: 'declined' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'cancel') {
        const { error: deleteError } = await supabase
          .from('follow_requests')
          .delete()
          .eq('request_id', requestId)
          .eq('requester_id', user.id)

        if (deleteError) {
          console.error('Cancel request error:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to cancel request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ status: 'cancelled' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Follow requests function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})