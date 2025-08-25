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

    if (req.method === 'POST') {
      const { userId } = await req.json()
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Prevent following self
      if (userId === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot follow yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if target user is private
      const { data: settings } = await supabase
        .from('user_settings')
        .select('is_private')
        .eq('user_id', userId)
        .maybeSingle()

      const isPrivate = settings?.is_private ?? false

      if (!isPrivate) {
        // Public account - create follow relationship immediately
        const { error: followError } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, followee_id: userId })
          .select()
          .single()

        if (followError && !followError.message.includes('duplicate key value')) {
          console.error('Follow error:', followError)
          return new Response(
            JSON.stringify({ error: 'Failed to follow user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ state: 'following' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Private account - create follow request
        const { data: request, error: requestError } = await supabase
          .from('follow_requests')
          .insert({ requester_id: user.id, target_id: userId })
          .select('request_id')
          .single()

        if (requestError && !requestError.message.includes('duplicate key value')) {
          console.error('Request error:', requestError)
          return new Response(
            JSON.stringify({ error: 'Failed to send follow request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ 
            state: 'requested',
            requestId: request?.request_id 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Follow function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})