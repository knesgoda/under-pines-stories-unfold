import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface URLPreviewRequest {
  url: string;
}

interface URLPreviewData {
  title?: string;
  description?: string;
  image?: string;
  site_name?: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { url }: URLPreviewRequest = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if we already have this URL cached
    const { data: cachedData } = await supabaseClient
      .from('url_cache')
      .select('*')
      .eq('url', url)
      .single()

    // If cached and not expired, return cached data
    if (cachedData && cachedData.expires_at && new Date(cachedData.expires_at) > new Date()) {
      return new Response(
        JSON.stringify({
          success: true,
          title: cachedData.title,
          description: cachedData.description,
          image: cachedData.image,
          url: cachedData.url
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch the URL and extract metadata
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UnderPinesBot/1.0)',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const html = await response.text()
    
    // Extract metadata using regex (simple approach)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i)

    const previewData: URLPreviewData = {
      title: titleMatch?.[1]?.trim() || undefined,
      description: descriptionMatch?.[1]?.trim() || undefined,
      image: imageMatch?.[1]?.trim() || undefined,
      site_name: siteNameMatch?.[1]?.trim() || undefined,
      url
    }

    // Cache the result
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Cache for 24 hours

    await supabaseClient
      .from('url_cache')
      .upsert({
        url,
        title: previewData.title,
        description: previewData.description,
        image: previewData.image,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        ...previewData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('URL preview error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate preview' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
