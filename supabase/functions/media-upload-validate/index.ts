import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaUploadRequest {
  file: File;
  type: 'image' | 'video';
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

    // Parse the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'image' | 'video'

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg']
    
    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid image type. Allowed: JPEG, PNG, WebP, GIF' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid video type. Allowed: MP4, WebM, OGG' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File too large. Maximum size: 10MB' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `media/${type}s/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('media')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (type === 'image') {
      // Use Supabase Image Transform for thumbnail
      const thumbnailPath = `media/thumbnails/${fileName}`
      
      // For now, we'll use the same URL with transform parameters
      // In a real implementation, you'd create a proper thumbnail
      thumbnailUrl = `${publicUrl}?width=300&height=300&resize=cover&quality=80`
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        thumbnailUrl,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        dimensions: type === 'image' ? {
          // In a real implementation, you'd extract actual dimensions
          width: 0,
          height: 0
        } : null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Media upload validation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
