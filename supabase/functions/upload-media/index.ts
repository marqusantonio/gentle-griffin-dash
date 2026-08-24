import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, fileBase64, contentType, folder = 'uploads' } = await req.json()

    if (!fileName || !fileBase64 || !contentType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const mediaBucketExists = buckets?.some(b => b.name === 'media')
    if (!mediaBucketExists) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('media', { public: true })
      if (createBucketError) throw createBucketError
    }

    const binaryString = atob(fileBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const fileData = new Blob([bytes], { type: contentType })

    const filePath = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${fileName}`

    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(filePath, fileData, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      })

    if (error) throw error

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filePath)

    return new Response(JSON.stringify({ publicUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('[upload-media] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})