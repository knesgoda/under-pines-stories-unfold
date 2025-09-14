import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GiftRequest {
  recipientId: string;
  itemSlug: string;
  quantity?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { recipientId, itemSlug, quantity = 1 }: GiftRequest = await req.json();

    // Validate recipient exists
    const { data: recipient } = await supabaseClient
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', recipientId)
      .single();

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'Recipient not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if sender has the item
    const { data: senderItem } = await supabaseClient
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('item_slug', itemSlug)
      .single();

    if (!senderItem || senderItem.quantity < quantity) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient quantity',
        available: senderItem?.quantity || 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get item details
    const { data: item } = await supabaseClient
      .from('items')
      .select('name, emoji, type')
      .eq('slug', itemSlug)
      .single();

    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only allow gifting crafted items (s'mores and hot dogs)
    if (item.type !== 'crafted') {
      return new Response(JSON.stringify({ 
        error: 'You can only gift crafted items like s\'mores and hot dogs!' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Remove item from sender's inventory
    const newSenderQuantity = senderItem.quantity - quantity;
    if (newSenderQuantity <= 0) {
      await supabaseClient
        .from('user_inventory')
        .delete()
        .eq('user_id', user.id)
        .eq('item_slug', itemSlug);
    } else {
      await supabaseClient
        .from('user_inventory')
        .update({ quantity: newSenderQuantity })
        .eq('user_id', user.id)
        .eq('item_slug', itemSlug);
    }

    // Add item to recipient's inventory
    await supabaseClient.rpc('increment_inventory', {
      p_user_id: recipientId,
      p_item_slug: itemSlug,
      p_quantity: quantity
    });

    // Get sender profile for the response
    const { data: sender } = await supabaseClient
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single();

    return new Response(JSON.stringify({ 
      success: true,
      gift: {
        item: item.name,
        emoji: item.emoji,
        quantity: quantity,
        sender: sender?.display_name || sender?.username || 'Someone',
        recipient: recipient.display_name || recipient.username
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in game-gift function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});